// src/components/results/RoadmapSection.jsx
import React from 'react';

// --- AÑADIR ESTILOS ---
const styles = {
    container: {
        padding: '10px',
    },
    title: {
        fontSize: '1.3em',
        fontWeight: 'bold',
        marginBottom: '15px',
        color: '#333',
        borderBottom: '1px solid #eee',
        paddingBottom: '8px',
    },
    introText: { // Estilo para la introducción
        fontSize: '1em',
        color: '#444',
        marginBottom: '20px',
        lineHeight: '1.4',
    },
    roadmapItem: {
        marginBottom: '25px', // Más espacio entre items
        paddingBottom: '15px',
        borderBottom: '1px dashed #eee',
    },
    itemTitleContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline', // Alinear línea base del texto
        marginBottom: '5px',
    },
    itemTitle: {
        fontSize: '1.1em',
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginRight: '10px', // Espacio antes del score
    },
    itemScore: {
        fontSize: '0.9em',
        color: '#666',
        whiteSpace: 'nowrap', // Evitar que el score se parta
    },
    itemRationale: {
        fontSize: '0.9em',
        fontStyle: 'italic',
        color: '#555',
        marginBottom: '10px', // Espacio antes de los pasos
        paddingLeft: '10px', // Indentación para la razón
    },
    actionStepsTitle: {
        fontWeight: 'bold',
        color: '#444',
        marginBottom: '5px',
        // Podrías añadir 'marginLeft: '10px'' si quieres indentar el título "Action Steps:"
    },
    actionStepsList: {
        listStyle: 'decimal inside',
        paddingLeft: '20px',
        margin: 0, // Resetear margen de la lista
    },
    actionStepItem: {
        marginBottom: '6px',
        lineHeight: '1.4',
        color: '#333',
    },
    finalLinkContainer: {
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #ccc',
        textAlign: 'center', // Centrar enlace final
    },
    finalLink: {
        fontSize: '1.1em', // Hacerlo un poco más grande
        fontWeight: 'bold',
        color: '#007bff', // Color de enlace estándar
        textDecoration: 'none', // Quitar subrayado por defecto
        transition: 'color 0.2s',
    },
    // Estilo para hover del enlace (opcional)
    // finalLinkHover: {
    //     color: '#0056b3',
    //     textDecoration: 'underline',
    // }
};
// --- FIN DE ESTILOS A AÑADIR ---


function RoadmapSection({ roadmap = [], stage }) { // Añadir valor por defecto

    // Calcular URL única (sin cambios)
    const stageToUrlMap = { /* ... */ };
    const fallbackUrl = 'https://www.acquisition.com/training/stabilize';
    const roadmapTargetUrl = stage ? (stageToUrlMap[stage] || fallbackUrl) : fallbackUrl;

  return (
    // --- Usar div con estilo container ---
    <div style={styles.container}>
      {/* --- Usar estilo para el título --- */}
      <h3 style={styles.title}>Personalized Improvement Roadmap</h3>
       {roadmap && roadmap.length > 0 ? (
            <div className="roadmap-section-inner">
                {/* --- USAR ESTILO Y REFINAR TEXTO INTRODUCTORIO --- */}
                <p style={styles.introText}>
                    Improving specific operational areas can significantly increase your business's value and attractiveness. This roadmap highlights your top <strong>{roadmap.length}</strong> opportunities based on your scores:
                </p>
                {roadmap.map((item, index) => (
                    // --- Usar estilo para cada item del roadmap ---
                    <div key={item?.areaName || index} style={styles.roadmapItem}>
                        {/* --- Contenedor para título y score --- */}
                        <div style={styles.itemTitleContainer}>
                            <span style={styles.itemTitle}>{index + 1}. {item?.title ?? 'N/A'}</span>
                            <span style={styles.itemScore}>({item?.areaScore ?? 0}/{item?.maxScore ?? 20} points)</span>
                        </div>
                        {/* --- Usar estilo para la razón --- */}
                        <p style={styles.itemRationale}><strong>Why it matters:</strong> {item?.rationale ?? ''}</p>
                        {/* --- Usar estilo para título de pasos y lista --- */}
                        <p style={styles.actionStepsTitle}>Action Steps:</p>
                        {Array.isArray(item?.actionSteps) ? (
                           <ol style={styles.actionStepsList}>
                               {item.actionSteps.map((step, stepIndex) => (
                                   // --- Usar estilo para cada paso ---
                                   <li key={stepIndex} style={styles.actionStepItem}>{step}</li>
                               ))}
                           </ol>
                        ) : <p>No action steps defined.</p>}
                    </div>
                ))}
                {/* --- Usar estilos para contenedor y enlace final --- */}
                <div style={styles.finalLinkContainer}>
                     <a
                        href={roadmapTargetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.finalLink}
                        // onMouseOver={(e) => e.currentTarget.style = {...styles.finalLink, ...styles.finalLinkHover}} // Ejemplo de hover inline
                        // onMouseOut={(e) => e.currentTarget.style = styles.finalLink}
                     >
                        {`-> Access the "${stage}" Training Section on Acquisition.com for Detailed Guidance`}
                     </a>
                </div>
            </div>
        ) : (
            <p style={styles.introText}>Your scores indicate a relatively balanced business or specific roadmap steps could not be determined.</p> // Usar estilo intro
        )}
    </div>
  );
}

export default RoadmapSection;