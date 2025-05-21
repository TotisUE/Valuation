// src/components/results/ResultsDisplay.jsx
import React, { useState, useRef,useMemo,useEffect} from 'react';
import { pdf } from '@react-pdf/renderer'; // Necesario para generar el PDF
//import { toPng } from 'html-to-image';     // Necesario para capturar el gráfico
import { toJpeg } from 'html-to-image'; 
import ValuationSnapshot from './ValuationSnapshot';
import { useNavigate } from 'react-router-dom';
import ScoreDetails from './ScoreDetails';
import RoadmapSection from './RoadmapSection';
import ResultsCTA from './ResultsCTA';
import DiscussTabContent from './DiscussTabContent';
import ValuationReportPDF from './ValuationReportPDF'; // Componente que define el PDF
import ScoreRadarChart from './ScoreRadarChart';   // Componente del gráfico (para el div oculto)
import { ScoringAreas } from '../../scoringAreas.js';

// src/components/results/ResultsDisplay.jsx
// CERCA DEL INICIO DEL ARCHIVO, ANTES DEL COMPONENTE:

// ANTES:
// const TABS = [
//   { id: 'snapshot', label: 'Valuation Summary' },
//   { id: 'scores', label: 'Score Detail' },
//   { id: 'roadmap', label: 'Roadmap' },
//   { id: 'discuss', label: 'Discuss Your Results' },
// ];

// DESPUÉS (NUEVA DEFINICIÓN):
const ALL_TABS_CONFIG = [
  { id: 'snapshot', label: 'Valuation Summary', componentBuilder: (props) => <ValuationSnapshot {...props} /> },
  { id: 'scores', label: 'Score Detail', componentBuilder: (props) => <ScoreDetails scores={props.scores} /> },
  { id: 'roadmap', label: 'Roadmap', componentBuilder: (props) => <RoadmapSection roadmap={props.roadmap} stage={props.stage} /> }, // roadmap y stage vienen de calculationResult
  { id: 'discuss', label: 'Discuss Your Results', componentBuilder: (props) => <DiscussTabContent calendlyLink={props.consultantCalendlyLink} userEmail={props.userEmail} /> },
];



// El componente principal de resultados
function ResultsDisplay({
  
  calculationResult,
  onStartOver,
  onBackToEdit,
  consultantCalendlyLink,
  userEmail,
  formData
}) {
  const navigate = useNavigate();
  // --- Estados ---
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  // Ref para el contenedor OCULTO del gráfico
  const hiddenChartRef = useRef(null);

  // --- Manejo de Carga ---
  if (!calculationResult) {
    return <div className="submission-result">Loading results...</div>;
  }

  // --- Extracción de Datos ---
  const {
    stage = 'N/A',
    adjEbitda = 0,
    baseMultiple = 0,
    maxMultiple = 0,
    finalMultiple = 0,
    estimatedValuation = 0,
    scores = {},
    roadmap = [],
    scorePercentage = 0,
    isOwner
  } = calculationResult || {};

   const visibleTabs = useMemo(() => {
    if (isOwner) {
      return ALL_TABS_CONFIG;
    } else {
      return ALL_TABS_CONFIG.filter(tab => tab.id === 'scores' || tab.id === 'roadmap');
    }
  }, [isOwner]);

  const [activeTab, setActiveTab] = useState(() => visibleTabs.length > 0 ? visibleTabs[0].id : '');

  useEffect(() => {
    // Si las pestañas visibles cambian (ej. por cambio de rol) y la activa ya no está,
    // o si inicialmente no había pestañas visibles y ahora sí.
    if (visibleTabs.length > 0 && !visibleTabs.find(tab => tab.id === activeTab)) {
        setActiveTab(visibleTabs[0].id);
    } else if (visibleTabs.length === 0 && activeTab !== '') {
        setActiveTab(''); 
    }
  }, [visibleTabs, activeTab]);



  // --- FUNCIÓN FINAL PARA DESCARGAR PDF CON GRÁFICO ---
  const handleDownloadPdfWithChart = async () => {
    if (!hiddenChartRef.current || !calculationResult || !formData) {
        console.error("Missing data or hidden chart ref for PDF generation.");
        if (!hiddenChartRef.current) {
           console.error("Hidden chart container not rendered yet or ref not assigned.");
           alert("Could not generate PDF. Chart container not ready. Please wait a moment and try again.");
           return;
        }
        alert("Could not generate PDF. Required data is missing.");
        return;
    }
    if (isGeneratingPdf) return; // Evitar doble clic

    setIsGeneratingPdf(true);
    console.log("Starting PDF generation...");

    // Opcional: Pequeño retraso para asegurar renderizado
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        console.log("Attempting to capture hidden chart container:", hiddenChartRef.current);
        // Capturar el gráfico oculto como imagen Data URL
        //const chartImageDataUrl = await toPng(hiddenChartRef.current, {
          const chartImageDataUrl = await toJpeg(hiddenChartRef.current, {
            quality: 0.95,
            pixelRatio: 2, // Mayor resolución
            backgroundColor: 'white', // Fondo blanco explícito
        });
        console.log("Captured Image Data URL (snippet):", chartImageDataUrl ? chartImageDataUrl.substring(0, 100) + '...' : 'Capture Failed!');
        console.log("Hidden chart image captured.");
        console.log("Captured Image Data URL:", chartImageDataUrl);
        // Generar el Blob del PDF usando la imagen
        const pdfBlob = await pdf(
            <ValuationReportPDF
                calculationResult={calculationResult}
                formData={formData}
                chartImage={chartImageDataUrl} // Pasar la imagen al PDF
            />
        ).toBlob();
        console.log("PDF Blob generated.");

        // Crear enlace y simular clic para descargar
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        const fileName = `Valuation-Report-${formData?.userEmail || 'summary'}.pdf`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        console.log("PDF Download triggered.");

    } catch (error) {
        console.error("Error generating PDF with chart:", error);
         if (error.message && error.message.includes('foreignObject')) {
             console.error("Potential SVG rendering issue in html-to-image.");
             alert("Error capturing chart image (SVG issue). Please try again or contact support.");
         } else {
            alert(`An error occurred while generating the PDF: ${error.message}`);
         }
    } finally {
        setIsGeneratingPdf(false); // Resetear estado
        console.log("PDF generation process finished.");
    }
  };
  // --- FIN FUNCIÓN DE DESCARGA ---

  // --- FUNCIÓN CORRECTA PARA RENDERIZAR CONTENIDO DE PESTAÑA ---
 const renderTabContent = () => {
    console.log(`--- renderTabContent: activeTab = '${activeTab}'`);
    const currentTabConfig = visibleTabs.find(tab => tab.id === activeTab);
    if (!currentTabConfig) {
        // Esto podría pasar si activeTab es '' porque no hay pestañas visibles
        if (visibleTabs.length > 0) {
            // Si hay pestañas visibles pero ninguna coincide, podría ser un error de estado transitorio.
            // Opcionalmente, mostrar la primera visible.
            // setActiveTab(visibleTabs[0].id); // Cuidado con bucles de renderizado aquí
            return <div>No tab content available.</div>;
        }
        return <div>Please select a tab.</div>; // O un mensaje más apropiado
    }

    // Props que se pasarán a los componentes de las pestañas
    const tabComponentProps = {
        stage, adjEbitda, baseMultiple, maxMultiple, finalMultiple, estimatedValuation,
        scorePercentage, scores, roadmap,
        consultantCalendlyLink, // Pasa las props que vienen de ResultsDisplay
        userEmail,             // Pasa las props que vienen de ResultsDisplay
        formData,                // Pasa formData si es necesario para algún componente de tab
        // Puedes añadir más props específicas si los componentes de las pestañas las necesitan
        // calculationResult // Podrías pasar todo el objeto si es más fácil
    };
    return currentTabConfig.componentBuilder(tabComponentProps);
};


  // --- FIN renderTabContent ---


  return (
  <div className="submission-result results-display">
    {/* Navegación de Pestañas */}
    <div className="results-tabs-nav" style={styles.tabNav}>
      {/* MODIFICACIÓN: Iterar sobre visibleTabs */}
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={activeTab === tab.id ? styles.tabButtonActive : styles.tabButton}
          // ... (resto de las clases y props del botón)
        >
          {tab.label}
        </button>
      ))}
    </div>



      {/* Contenido de la Pestaña Activa */}
      <div className="results-tab-content" style={styles.tabContent}>
        {renderTabContent()}
      </div>

      {/* --- CONTENEDOR OCULTO ACTIVO PARA CAPTURAR GRÁFICO --- */}
      <div
          ref={hiddenChartRef}
          style={{
              position: 'absolute',
              left: '-9999px',
              top: '-9999px',
              width: '600px', // Ancho fijo razonable para captura
              height: '450px', // Alto fijo razonable para captura
              padding: '10px',
              backgroundColor: 'white',
              boxSizing: 'content-box',
              // zIndex: -1 // Opcional si interfiere
          }}
          aria-hidden="true" // Ocultar de lectores de pantalla
      >
           {/* Renderizar el gráfico aquí SOLO para la captura */}
           {scores && Object.keys(scores).length > 0 ? (
              <ScoreRadarChart scores={scores} />
           ) : (
              <div>{/* Placeholder or nothing */}</div>
           )}
      </div>
      {/* --- FIN CONTENEDOR OCULTO --- */}

      {/* Disclaimer */}
      <p style={styles.disclaimer}>
           Disclaimer: This is a preliminary, automated estimate for informational purposes only...
      </p>

      {/* CTAs y Acciones */}
      <div className="results-actions-footer" style={styles.actionsFooter}>
           {/* Pasar props correctos a ResultsCTA */}
           <ResultsCTA
               onDownloadClick={handleDownloadPdfWithChart}
               isLoading={isGeneratingPdf}
           />
                     {/* ---- INICIO DE NUEVOS BOTONES ---- */}
           <button
               type="button"
               onClick={() => {
                   console.log('GENERATE PROMPT button clicked');
                   // Lógica futura aquí
               }}
               style={styles.actionButton} // Reutilizamos el estilo existente
               className="generate-prompt-button" // Clase opcional para estilos específicos
           >
               Generate Prompt
           </button>

           <button
               type="button"
               onClick={() => {
                   console.log('CREATE FOR AN ADDITIONAL PRODUCT/SERVICE button clicked');
           navigate('/add-product-service');
                }}
                style={styles.actionButton}
                className="create-additional-product-button"
            >

               Create for an additional product/service
           </button>
           {/* ---- FIN DE NUEVOS BOTONES ---- */}


           {/* Botones originales */}
           <button type="button" onClick={onStartOver} className="start-over-button" style={styles.actionButton}>Start Over</button>
           <button type="button" onClick={onBackToEdit} className="back-to-edit-button" style={styles.actionButton}>Back to Edit</button>
      </div>
    </div>
  );
}

// Estilos (puedes añadir los específicos de discuss si quieres)
const styles = {
  tabNav: { borderBottom: '1px solid #ccc', marginBottom: '0px', paddingLeft: '10px', display: 'flex', gap: '2px' },
  tabButton: { padding: '10px 15px', cursor: 'pointer', border: '1px solid #ccc', borderBottom: '1px solid #ccc', background: '#eee', borderTopLeftRadius: '5px', borderTopRightRadius: '5px', opacity: 0.7, marginBottom: '-1px', position: 'relative', zIndex: 1, color: '#333', transition: 'background-color 0.2s, color 0.2s' },
  tabButtonActive: { padding: '10px 15px', cursor: 'pointer', border: '1px solid #ccc', borderBottom: '1px solid white', background: 'white', borderTopLeftRadius: '5px', borderTopRightRadius: '5px', fontWeight: 'bold', marginBottom: '-1px', position: 'relative', zIndex: 2, color: '#000000', transition: 'background-color 0.2s, color 0.2s' },
  tabContent: { padding: '20px', border: '1px solid #ccc', borderTop: 'none', borderRadius: '0 0 5px 5px', background: 'white', marginBottom: '20px', minHeight: '200px' },
  disclaimer: { marginTop: '2rem', fontSize: '0.9em', color: '#777', textAlign: 'center' },
  actionsFooter: { textAlign: 'center', marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  actionButton: { padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em' }
};

// No necesitamos combinedStyles si no aplicamos estilos dinámicos complejos a los botones aquí

export default ResultsDisplay;