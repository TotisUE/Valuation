// src/components/results/ValuationSnapshot.jsx
import React from 'react';
const styles = {
  container: {
      padding: '10px', // Espaciado interno
  },
  sectionTitle: {
      fontSize: '1.3em',
      fontWeight: 'bold',
      marginBottom: '15px',
      color: '#333',
      borderBottom: '1px solid #eee', // Línea divisoria sutil
      paddingBottom: '8px',
  },
  dataRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '8px',
      padding: '4px 0', // Espaciado vertical
  },
  dataLabel: {
      fontWeight: 'bold',
      color: '#555',
      marginRight: '10px',
  },
  dataValue: {
      textAlign: 'right',
      color: '#1a1a1a',
  },
  explanationText: { // Estilo para los textos educativos
      fontSize: '0.9em',
      color: '#666',
      marginTop: '-4px', // Acercar al dato anterior
      marginBottom: '12px', // Espacio antes del siguiente dato
      paddingLeft: '10px', // Pequeña indentación
      fontStyle: 'italic',
  },
  valuationHighlight: { // Para el resultado final
      fontSize: '2em',
      fontWeight: 'bold',
      color: '#27ae60', // Verde
      margin: '0.5em 0',
      textAlign: 'center',
  },
  valuationCommentary: { // Para el texto del múltiplo final
      textAlign: 'center',
      fontSize: '1em',
      color: '#444',
  }
};

function ValuationSnapshot({
  stage,
  adjEbitda,
  baseMultiple,
  maxMultiple,
  finalMultiple,
  estimatedValuation,
  scorePercentage
}) {
  return (
    <div>
      <h3>Business Snapshot</h3>
      <p><strong>Stage:</strong> {stage ?? 'N/A'}</p>
      {/* TODO: Añadir explicación de Stage aquí */}
      <p><strong>Adjusted EBITDA:</strong> ${adjEbitda?.toLocaleString() ?? 'N/A'}</p>
      <p><strong>Industry Adjusted Multiple Range:</strong> {baseMultiple?.toFixed(1) ?? 'N/A'}x - {maxMultiple?.toFixed(1) ?? 'N/A'}x</p>
      <p><strong>Overall Qualitative Score:</strong> {(scorePercentage * 100).toFixed(0)}%</p>
      <p style={{fontSize: '0.9em', color: '#666', marginTop: '-10px', marginBottom: '20px'}}>(This score influences where your specific multiple falls within the industry range)</p>


      <h3 style={{ marginTop: '2rem' }}>Estimated Valuation</h3>
      {/* TODO: Añadir gráfico Gauge/Velocímetro aquí */}
      <p className="valuation-range" style={{ fontSize: '2em', fontWeight: 'bold', color: '#27ae60', margin: '0.5em 0' }}>
          ~ ${estimatedValuation?.toLocaleString() ?? 'N/A'}
      </p>
      <p className="valuation-commentary">Based on an estimated multiple of <strong>{finalMultiple?.toFixed(1) ?? 'N/A'}x</strong> applied to your Adjusted EBITDA.</p>
    </div>
  );
}

export default ValuationSnapshot;