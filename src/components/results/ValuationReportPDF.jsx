// src/components/results/ValuationReportPDF.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { ScoringAreas } from '../../scoringAreas'; // Asegúrate que la ruta es correcta
import { calculateMaxScoreForArea } from '../../questions';

// --- Opcional: Registrar fuentes (si quieres usar fuentes personalizadas) ---
// Font.register({
//   family: 'Oswald',
//   src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
// });

// --- Definir Estilos para el PDF ---
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30, // Margen de la página
    fontFamily: 'Helvetica', // Fuente por defecto
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
    // fontFamily: 'Oswald', // Si registraste la fuente
  },
  section: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#444444',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    color: '#555555',
  },
  value: {
    textAlign: 'right',
  },
  textBlock: {
      marginBottom: 5,
  },
  roadmapItem: {
      marginBottom: 10,
      paddingLeft: 10, // Indentación pequeña
  },
  roadmapTitle: {
      fontWeight: 'bold',
      fontSize: 11,
  },
  roadmapRationale: {
      fontStyle: 'italic',
      color: '#666',
      marginBottom: 3,
  },
  roadmapAction: {
      marginLeft: 10, // Indentación para pasos de acción
  },
  //chartImage: {
    //width: 400,       // <-- Ancho fijo en puntos (pt)
    //height: 300,      // <-- Alto fijo en puntos (pt)
    //alignSelf: 'center',
   // marginTop: 10,
   // marginBottom: 15,
  //  borderWidth: 1, // <-- Añadir un borde temporal
   // borderColor: 'red', // <-- Borde rojo para ver si el espacio se reserva
 // },
  disclaimer: {
      marginTop: 20,
      fontSize: 8,
      color: '#888888',
      textAlign: 'center',
      borderTopWidth: 1,
      borderTopColor: '#eeeeee',
      paddingTop: 10,
  }
});

// --- Helper para formatear números ---
const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 }); // Sin decimales para valoración
};
const formatPercentage = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    return `${(num * 100).toFixed(1)}%`; // Un decimal para porcentaje
};
 const formatMultiple = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    return `${num.toFixed(2)}x`; // Dos decimales para múltiplo
};
const formatScore = (scoreString) => {
    // Asume formato "X / Y"
    if (typeof scoreString !== 'string' || !scoreString.includes('/')) return scoreString || 'N/A';
    const [score, max] = scoreString.split('/').map(s => s.trim());
    return `${score} / ${max}`; // Devuelve como está pero limpia espacios
}

// --- El Componente del Documento PDF ---
function ValuationReportPDF({ calculationResult, formData, chartImage }) {

  console.log("--- ValuationReportPDF: chartImage prop received (snippet):", chartImage ? chartImage.substring(0, 60) + '...' : 'NO IMAGE PROP');

  // Extraer datos con valores por defecto por seguridad
  const {
    stage = 'N/A',
    adjEbitda = 0,
    baseMultiple = 0,
    maxMultiple = 0,
    finalMultiple = 0,
    estimatedValuation = 0,
    scores = {}, // Objeto con scores por area (ej: { SYSTEMS: 15, ... })
    roadmap = [], // Array de objetos roadmap
    scorePercentage = 0
  } = calculationResult || {};

  const {
    userEmail = 'N/A',
    currentRevenue = null,
    grossProfit = null,
    ebitda = null,
    ebitdaAdjustments = 0,
    naicsSector = 'N/A',
    naicsSubSector = 'N/A',
    // ... incluir otras claves de formData si quieres mostrarlas ...
    // ownerRole = 'N/A',
    // yearsInvolved = 'N/A',
  } = formData || {};

  const formattedScores = Object.values(ScoringAreas).reduce((acc, areaKey) => {
        const scoreValue = scores[areaKey] ?? 0;
        const maxScore = calculateMaxScoreForArea(areaKey);
        acc[areaKey] = `${scoreValue} / ${maxScore}`;
        return acc;
  }, {});


  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* --- Cabecera --- */}
        <Text style={styles.header}>Business Valuation Summary</Text>

        {/* --- Información Básica --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{userEmail}</Text>
          </View>
           <View style={styles.row}>
            <Text style={styles.label}>Industry Sector:</Text>
            <Text style={styles.value}>{naicsSector}</Text>
          </View>
           <View style={styles.row}>
            <Text style={styles.label}>Industry Sub-Sector:</Text>
            <Text style={styles.value}>{naicsSubSector}</Text>
          </View>
          {/* Añadir más campos de formData si se desea */}
        </View>

        {/* --- Entradas Financieras --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Inputs (Last Full Year)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Revenue:</Text>
            <Text style={styles.value}>${formatNumber(currentRevenue)}</Text>
          </View>
          {grossProfit !== null && ( // Mostrar solo si se proporcionó
              <View style={styles.row}>
                <Text style={styles.label}>Gross Profit:</Text>
                <Text style={styles.value}>${formatNumber(grossProfit)}</Text>
              </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>EBITDA:</Text>
            <Text style={styles.value}>${formatNumber(ebitda)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>EBITDA Adjustments:</Text>
            <Text style={styles.value}>${formatNumber(ebitdaAdjustments)}</Text>
          </View>
          <View style={[styles.row, {marginTop: 5, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 5}]}>
            <Text style={styles.label}>Adjusted EBITDA:</Text>
            <Text style={styles.value}>${formatNumber(adjEbitda)}</Text>
          </View>
        </View>

        {/* --- Resultados de Valoración --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valuation Results</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Calculated Stage:</Text>
            <Text style={styles.value}>{stage}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Overall Score Percentage:</Text>
            <Text style={styles.value}>{formatPercentage(scorePercentage)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Base Multiple:</Text>
            <Text style={styles.value}>{formatMultiple(baseMultiple)}</Text>
          </View>
           <View style={styles.row}>
            <Text style={styles.label}>Max Potential Multiple:</Text>
            <Text style={styles.value}>{formatMultiple(maxMultiple)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Final Adjusted Multiple:</Text>
            <Text style={styles.value}>{formatMultiple(finalMultiple)}</Text>
          </View>
          <View style={[styles.row, {marginTop: 5, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 5}]}>
            <Text style={[styles.label, {fontSize: 12}]}>Estimated Valuation Range:</Text>
            <Text style={[styles.value, {fontSize: 12, fontWeight: 'bold'}]}>${formatNumber(estimatedValuation)}</Text>
          </View>
        </View>

        {/* --- Detalles de Puntuación --- */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Score Details by Area</Text>
           {chartImage && ( // Mostrar solo si la imagen existe
               <Image
               src={chartImage} 
               style={styles.chartImage} // Usa los estilos simplificados de la Prueba 1
           />
           )}
           {Object.values(ScoringAreas).map((areaKey) => (
               <View key={areaKey} style={styles.row}>
                   <Text style={styles.label}>{areaKey}:</Text>
                   {/* Usar los scores formateados aquí */}
                   <Text style={styles.value}>{formattedScores[areaKey] ?? 'N/A'}</Text>
               </View>
           ))}
        </View>

        {/* --- Roadmap de Mejora --- */}
        {roadmap && roadmap.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Improvement Roadmap (Top Priorities)</Text>
                {roadmap.map((item, index) => (
                    <View key={index} style={styles.roadmapItem}>
                        <Text style={styles.roadmapTitle}>{index + 1}. {item.title} (Score: {item.areaScore} / {item.maxScore})</Text>
                        <Text style={styles.roadmapRationale}>{item.rationale}</Text>
                        <Text style={styles.subsectionTitle}>Action Steps:</Text>
                        {item.actionSteps && item.actionSteps.map((step, stepIndex) => (
                            <Text key={stepIndex} style={styles.roadmapAction}>- {step}</Text>
                        ))}
                    </View>
                ))}
            </View>
        )}

        {/* --- Disclaimer --- */}
         <Text style={styles.disclaimer}>
           Disclaimer: This is a preliminary, automated estimate based on the inputs provided and standardized industry benchmarks. It is for informational purposes only and does not constitute financial advice or a formal valuation opinion. Actual business value can vary significantly based on due diligence, market conditions, deal structure, and other factors not captured in this tool. Consult with qualified professionals for a comprehensive valuation and business advice.
         </Text>

      </Page>
    </Document>
  );
}

export default ValuationReportPDF;