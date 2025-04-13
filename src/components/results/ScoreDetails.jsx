// src/components/results/ScoreDetails.jsx
import React from 'react';
// <<< IMPORTANTE: Ajusta la ruta a scoringAreas si es diferente >>>
import { ScoringAreas } from '../../scoringAreas.js'; // Asume que está 2 niveles arriba
// O import { ScoringAreas } from '../scoringAreas'; si está 1 nivel arriba
// O import { ScoringAreas } from '../../questions'; si se exporta desde questions.js

// Textos explicativos (Tarea 6 - Contenido Educativo - Propuesta inicial)
const areaExplanations = {
    [ScoringAreas.SYSTEMS]: "Reflects the efficiency, documentation, and scalability of your core operations.",
    [ScoringAreas.WORKFORCE]: "Assesses owner dependency, team strength, accountability, and talent management.",
    [ScoringAreas.MARKET]: "Evaluates market size/growth, customer diversification, and competitive positioning.",
    [ScoringAreas.PROFITABILITY]: "Focuses on the health and trend of margins and the predictability of revenue.",
    [ScoringAreas.MARKETING]: "Measures brand strength, lead generation effectiveness, and value communication.",
    [ScoringAreas.OFFERING]: "Gauges customer satisfaction, product/service differentiation, and quality.",
    [ScoringAreas.EXPANSION]: "Indicates the business's readiness and capability to scale effectively.",
};

function ScoreDetails({ scores = {} }) { // Añadir valor por defecto
   // Calcular maxScore para el área MARKET (si es necesario ajustar)
   const getMaxScore = (areaName) => areaName === ScoringAreas.MARKET ? 25 : 20;

  // Filtrar y mapear solo las áreas válidas que existen en ScoringAreas
  const validScores = Object.entries(scores)
        .filter(([areaKey]) => Object.values(ScoringAreas).includes(areaKey));

  return (
    <div>
      <h3>Score Details (Qualitative Areas)</h3>
      {/* TODO: Añadir Gráfico de Barras/Radar aquí */}
      <p style={{marginBottom: '1.5rem'}}>This reflects how your business scores across key qualitative areas that influence valuation multiples.</p>
      {validScores.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {validScores.map(([areaName, score]) => {
                const maxScore = getMaxScore(areaName);
                // Asegurarse que score sea un número o 0
                const numericScore = typeof score === 'number' ? score : 0;
                const percentage = maxScore > 0 ? (numericScore / maxScore) * 100 : 0;
                return (
                   <li key={areaName} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                       <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'}}>
                           <strong style={{fontSize: '1.1em'}}>{areaName}:</strong>
                           <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>{numericScore} / {maxScore}</span>
                       </div>
                       {/* Barra de progreso */}
                       <div style={{ backgroundColor: '#e0e0e0', borderRadius: '5px', height: '12px', overflow: 'hidden' }}>
                           <div style={{ width: `${percentage}%`, backgroundColor: '#3498db', height: '100%', borderRadius: '5px 0 0 5px' }}></div>
                       </div>
                       {/* Explicación Educativa */}
                       <p style={{fontSize: '0.9em', color: '#666', marginTop: '8px'}}>
                           {areaExplanations[areaName] || `Details for ${areaName}`}
                       </p>
                   </li>
                );
            })}
         </ul>
      ) : (
          <p>Score details are not available.</p>
      )}
    </div>
  );
}

export default ScoreDetails;