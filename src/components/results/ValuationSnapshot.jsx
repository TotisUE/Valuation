// src/components/results/ValuationSnapshot.jsx
import React from 'react';

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