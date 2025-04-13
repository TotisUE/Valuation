// src/components/results/ResultsDisplay.jsx (o src/components/ResultsDisplay.jsx)
import React, { useState } from 'react';

// --- Importaremos estos componentes en el siguiente paso ---
import ValuationSnapshot from './ValuationSnapshot';
import ScoreDetails from './ScoreDetails';
import RoadmapSection from './RoadmapSection';
import ResultsCTA from './ResultsCTA';
import { ScoringAreas } from '../../scoringAreas.js'; // Ajusta la ruta si es necesario

// Definición de las pestañas que tendremos
const TABS = [
  { id: 'snapshot', label: 'Resumen Valoración' },
  { id: 'scores', label: 'Detalle Puntuación' },
  { id: 'roadmap', label: 'Hoja de Ruta' },
];

// El componente principal de resultados
function ResultsDisplay({ calculationResult, onStartOver, onBackToEdit }) {
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
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
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
           <ResultsCTA />
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
  tabNav: {
    borderBottom: '1px solid #ccc',
    marginBottom: '0px', // Quitar margen inferior para que el borde conecte
    paddingLeft: '10px', // Añadir padding para separar del borde
    display: 'flex',
    gap: '2px', // Espacio pequeño entre botones
  },
  tabButton: {
    padding: '10px 15px',
    cursor: 'pointer',
    border: '1px solid #ccc',
    borderBottom: '1px solid #ccc', // Borde inferior visible en inactivas
    background: '#eee',
    borderTopLeftRadius: '5px', // Redondeo superior
    borderTopRightRadius: '5px',
    opacity: 0.7,
    marginBottom: '-1px', // Para alinear con el borde del contenido
    position: 'relative',
    zIndex: 1,
  },
  tabButtonActive: {
    padding: '10px 15px',
    cursor: 'pointer',
    border: '1px solid #ccc',
    borderBottom: '1px solid white', // Fondo blanco "cubre" el borde inferior
    background: 'white',
    borderTopLeftRadius: '5px',
    borderTopRightRadius: '5px',
    fontWeight: 'bold',
    marginBottom: '-1px', // Asegura que se alinee sobre el borde del contenido
    position: 'relative',
    zIndex: 2, // Poner por encima de las inactivas y el borde
  },
  tabContent: {
    padding: '20px',
    border: '1px solid #ccc',
    borderTop: 'none', // El borde superior ya está manejado por las pestañas
    borderRadius: '0 0 5px 5px', // Redondeo inferior
    background: 'white',
    marginBottom: '20px',
    minHeight: '200px', // Altura mínima para que se vea el contenedor
  },
   disclaimer: {
      marginTop: '2rem',
      fontSize: '0.9em',
      color: '#777',
      textAlign: 'center',
   },
   actionsFooter: {
      textAlign: 'center',
      marginTop: '2rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
   },
   actionButton: {
       padding: '10px 20px',
       border: 'none',
       borderRadius: '4px',
       cursor: 'pointer',
       fontSize: '1em',
   }
};

export default ResultsDisplay;