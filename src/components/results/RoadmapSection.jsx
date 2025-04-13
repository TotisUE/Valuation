// src/components/results/RoadmapSection.jsx
import React from 'react';

function RoadmapSection({ roadmap = [], stage }) { // Añadir valor por defecto

    // Calcular URL única (repetimos lógica aquí por simplicidad)
    const stageToUrlMap = {
        "Pre-Revenue / Negative EBITDA": 'https://www.acquisition.com/training/improvise',
        "Startup": 'https://www.acquisition.com/training/monetize',
        "Mature Start-up": 'https://www.acquisition.com/training/stabilize',
        "Grow-up": 'https://www.acquisition.com/training/prioritize',
        "Mature Grow-up": 'https://www.acquisition.com/training/productize',
        "Scale Up": 'https://www.acquisition.com/training/optimize',
        "Mature Scaleup": 'https://www.acquisition.com/training/specialize',
      };
    const fallbackUrl = 'https://www.acquisition.com/training/stabilize';
    const roadmapTargetUrl = stage ? (stageToUrlMap[stage] || fallbackUrl) : fallbackUrl;

  return (
    <div>
      <h3>Personalized Improvement Roadmap</h3>
       {roadmap && roadmap.length > 0 ? (
            <div className="roadmap-section-inner">
                <p>Based on your scores, here are the top {roadmap.length} areas with the most potential for value improvement:</p>
                {roadmap.map((item, index) => (
                    <div key={item?.areaName || index} className="roadmap-item" style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: index < roadmap.length - 1 ? '1px dashed #eee' : 'none' }}>
                        <h4>{index + 1}. {item?.title ?? 'N/A'} <span style={{fontSize: '0.9em', color: '#666'}}>({item?.areaScore ?? 0}/{item?.maxScore ?? 20} points)</span></h4>
                        <p style={{ fontSize: '0.9em', fontStyle: 'italic', color: '#555' }}><strong>Why it matters:</strong> {item?.rationale ?? ''}</p>
                        <p><strong>Action Steps:</strong></p>
                        {Array.isArray(item?.actionSteps) ? (
                           <ol style={{ listStyle: 'decimal inside', paddingLeft: '20px' }}>
                               {item.actionSteps.map((step, stepIndex) => (
                                   <li key={stepIndex} style={{marginBottom: '5px'}}>{step}</li>
                               ))}
                           </ol>
                        ) : <p>No action steps defined.</p>}
                    </div>
                ))}
                {/* Enlace Único */}
                <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ccc'}}>
                     <a href={roadmapTargetUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '1em', fontWeight: 'bold' }}>
                        {`-> Access the "${stage}" Training Section on Acquisition.com for Detailed Guidance`}
                     </a>
                </div>
            </div>
        ) : (
            <p>Your scores indicate a relatively balanced business or specific roadmap steps could not be determined.</p>
        )}
    </div>
  );
}

export default RoadmapSection;