// src/components/results/ResultsDisplay.jsx (o src/components/ResultsDisplay.jsx)
import React, { useState } from 'react';

// --- Importaremos estos componentes en el siguiente paso ---
import ValuationSnapshot from './ValuationSnapshot';
import ScoreDetails from './ScoreDetails';
import RoadmapSection from './RoadmapSection';
import ResultsCTA from './ResultsCTA';
import { ScoringAreas } from '../../scoringAreas.js'; // Ajusta la ruta si es necesario
import DiscussTabContent from './DiscussTabContent'; // <-- AÑADIR ESTA LÍNEA

// Definición de las pestañas que tendremos
const TABS = [
  { id: 'snapshot', label: 'Valuation Summary' },
  { id: 'scores', label: 'Score Detail' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'discuss', label: 'Discuss Your Results' }, 
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
  // Estado para saber qué pestaña está activa
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  // Si no hay datos, muestra un mensaje de carga
  if (!calculationResult) {
    return <div className="submission-result">Cargando resultados...</div>;
  }

  // Extraemos los datos principales del objeto calculationResult
  // (Asegúrate de que todos estos datos existen en el objeto que pasas desde MultiStepForm)
  const {
    stage = 'N/A',
    adjEbitda = 0,
    baseMultiple = 0,
    maxMultiple = 0,
    finalMultiple = 0,
    estimatedValuation = 0,
    scores = {},
    roadmap = [],
    scorePercentage = 0
  } = calculationResult || {}; // Usar valores por defecto por seguridad

  // Función para renderizar el contenido de la pestaña activa
  const renderTabContent = () => {
    switch (activeTab) {
      case 'snapshot':
        // --- USA EL COMPONENTE REAL ---
        return <ValuationSnapshot
                  stage={stage}
                  adjEbitda={adjEbitda}
                  baseMultiple={baseMultiple}
                  maxMultiple={maxMultiple}
                  finalMultiple={finalMultiple}
                  estimatedValuation={estimatedValuation}
                  scorePercentage={scorePercentage}
               />;
      case 'scores':
         // --- USA EL COMPONENTE REAL ---
        return <ScoreDetails scores={scores} />;
      case 'roadmap':
          // --- USA EL COMPONENTE REAL ---
         return <RoadmapSection roadmap={roadmap} stage={stage} />;
         case 'discuss':
          return <DiscussTabContent
                    calendlyLink={consultantCalendlyLink} // Pasa el prop
                    userEmail={userEmail}                 // Pasa el prop
                 />;
      default:
        // Se mantiene igual
        return <div>Selecciona una pestaña</div>;
    }
  };

  return (
    // Contenedor principal de resultados con clase para estilo
    <div className="submission-result results-display">

      {/* Navegación de Pestañas */}
      <div className="results-tabs-nav" style={styles.tabNav}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            // Cambia la pestaña activa al hacer clic
            onClick={() => setActiveTab(tab.id)}
            // Aplica estilos diferentes si la pestaña está activa
            style={activeTab === tab.id ? styles.tabButtonActive : styles.tabButton}
            // Clases para CSS externo
            className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'discuss' ? 'discuss-tab-button' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la Pestaña Activa */}
      <div className="results-tab-content" style={styles.tabContent}>
        {/* Llama a la función que decide qué mostrar */}
        {renderTabContent()}
      </div>

       {/* Disclaimer */}
       <p style={styles.disclaimer}>
           Disclaimer: This is a preliminary, automated estimate for informational purposes only...
       </p>

       {/* CTAs y Acciones */}
       <div className="results-actions-footer" style={styles.actionsFooter}>
           {/* --- USAR COMPONENTE REAL --- */}
           <ResultsCTA 
            calculationResult={calculationResult}
            formData={formData}
            />
           {/* Botones originales */}
           <button type="button" onClick={onStartOver} className="start-over-button" style={styles.actionButton}>
               Start Over
           </button>
           <button type="button" onClick={onBackToEdit} className="back-to-edit-button" style={styles.actionButton}>
               Back to Edit
           </button>
       </div>

    </div>
  );
}

// Estilos básicos inline (puedes moverlos a tu archivo CSS)
const styles = {
  tabNav: { borderBottom: '1px solid #ccc', marginBottom: '0px', paddingLeft: '10px', display: 'flex', gap: '2px' },
  tabButton: { padding: '10px 15px', cursor: 'pointer', border: '1px solid #ccc', borderBottom: '1px solid #ccc', background: '#eee', borderTopLeftRadius: '5px', borderTopRightRadius: '5px', opacity: 0.7, marginBottom: '-1px', position: 'relative', zIndex: 1, color: '#333', transition: 'background-color 0.2s, color 0.2s' }, // Añadida transición
  tabButtonActive: { padding: '10px 15px', cursor: 'pointer', border: '1px solid #ccc', borderBottom: '1px solid white', background: 'white', borderTopLeftRadius: '5px', borderTopRightRadius: '5px', fontWeight: 'bold', marginBottom: '-1px', position: 'relative', zIndex: 2, color: '#000000', transition: 'background-color 0.2s, color 0.2s' }, // Añadida transición
  // --- Estilos para la pestaña Discuss (Ejemplo llamativo - Verde) ---
  discussTabButtonSpecificStyles: {
     backgroundColor: '#5cb85c', // Verde
     color: 'white',
     fontWeight: 'bold',
     opacity: 1, // Asegurar que no sea opaco
     borderBottomColor: '#4cae4c', // Mantener borde inferior de color si no está activa
  },
  discussTabButtonActiveSpecificStyles: { // Estilo si la pestaña Discuss está ACTIVA
      background: 'white', // Fondo blanco normal
      color: '#5cb85c', // Texto verde
      borderBottom: '1px solid white', // Borde inferior blanco
      fontWeight: 'bold', // Mantener negrita
      borderTopColor: '#4cae4c', // Ejemplo: Borde superior verde oscuro
      borderLeftColor: '#4cae4c',
      borderRightColor: '#4cae4c',
  },
  tabContent: { padding: '20px', border: '1px solid #ccc', borderTop: 'none', borderRadius: '0 0 5px 5px', background: 'white', marginBottom: '20px', minHeight: '200px' },
  disclaimer: { marginTop: '2rem', fontSize: '0.9em', color: '#777', textAlign: 'center' },
  actionsFooter: { textAlign: 'center', marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  actionButton: { padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em' }
};

// Helper para combinar estilos (mejor si usas clases CSS, pero funciona)
const combinedStyles = {
    getButtonStyle: (tabId, activeTabId) => {
        const isActive = activeTabId === tabId;
        const baseStyle = isActive ? styles.tabButtonActive : styles.tabButton;

        if (tabId === 'discuss') {
            const specificStyle = isActive
                ? styles.discussTabButtonActiveSpecificStyles
                : styles.discussTabButtonSpecificStyles;
            // Fusionar base con específico, dando prioridad al específico
            return { ...baseStyle, ...specificStyle };
        }
        return baseStyle;
    }
};

export default ResultsDisplay;