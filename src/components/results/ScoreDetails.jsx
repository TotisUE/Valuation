// src/components/results/ScoreDetails.jsx
import React from 'react';
import ScoreRadarChart from './ScoreRadarChart';
import { ScoringAreas } from '../../scoringAreas';
import { calculateMaxScoreForArea } from '../../questions';

// Estilos básicos (puedes moverlos a CSS)
const styles = {
    container: {
        padding: '10px',
    },
    title: {
        fontSize: '1.3em',
        fontWeight: 'bold',
        marginBottom: '15px',
        textAlign: 'center',
        color: '#333',
    },
    chartExplanation: { // Estilo para texto explicativo del gráfico
        fontSize: '0.9em',
        color: '#666',
        textAlign: 'center',
        marginBottom: '15px',
        padding: '0 10px',
    },
    chartContainer: {
        marginBottom: '30px',
    },
    listContainer: {
         marginTop: '20px',
         borderTop: '1px solid #eee',
         paddingTop: '20px',
    },
    listTitle: {
        fontSize: '1.1em',
        fontWeight: 'bold',
        marginBottom: '10px',
        color: '#444',
    },
    scoreItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0',
    },
    areaName: {
        fontWeight: '500',
         color: '#555',
    },
    areaScore: {
         fontWeight: 'bold',
         color: '#1a1a1a',
    }
};

function ScoreDetails({ scores }) {

    // Validación (mantenemos la validación)
    if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0) {
        return <div>Score details are unavailable.</div>;
    }

    // Filtrar las claves válidas (basado en las *claves* que llegan en scores)
    const validAreaKeys = Object.keys(scores)
                              .filter(key => Object.values(ScoringAreas).includes(key));

    // Si no hay claves válidas encontradas en los scores recibidos
     if (validAreaKeys.length === 0) {
          return <div>No valid score data found to display details.</div>;
     }

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Detailed Score Breakdown</h3>

            {/* --- AÑADIR EXPLICACIÓN DEL GRÁFICO --- */}
            <p style={styles.chartExplanation}>
                This radar chart visually compares your scores (inner shape) against the maximum possible score for each area (outer shape). A larger, more balanced shape generally indicates stronger overall business health.
            </p>
            <div style={styles.chartContainer}>
                 <ScoreRadarChart scores={scores} />
            </div>

             {/* Contenedor OPCIONAL para la lista de scores (si quieres ambos) */}
             <div style={styles.listContainer}>
                 <h4 style={styles.listTitle}>Scores by Area:</h4>
                 {/* Mapear usando las claves válidas filtradas */}
                 {validAreaKeys.map((areaKey) => {
                     const scoreValue = scores[areaKey] ?? 0; // Usar la clave correcta
                     const maxScore = calculateMaxScoreForArea(areaKey); // Usar la clave correcta
                     return (
                         <div key={areaKey} style={styles.scoreItem}>
                             {/* Mostrar el nombre del área (la clave misma) */}
                             <span style={styles.areaName}>{areaKey.replace(/_/g, ' ')}:</span>
                             <span style={styles.areaScore}>{scoreValue} / {maxScore}</span>
                         </div>
                     );
                 })}
             </div>
        </div>
    );
}

export default ScoreDetails;