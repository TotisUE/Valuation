// src/components/results/ResultsCTA.jsx
import React from 'react';

function ResultsCTA() {
  const handleDownloadPDF = () => {
    // TODO: Implementar lógica de generación de PDF (puede ser compleja)
    alert('PDF Download functionality coming soon!');
  };

  const handleScheduleCall = () => {
      // TODO: Enlazar a Calendly o página de contacto
      alert('Functionality to schedule a call coming soon!');
      // window.open('TU_ENLACE_DE_CONTACTO_O_CALENDLY', '_blank'); // Abrir en nueva pestaña
  }

  return (
    <div className="results-cta" style={styles.ctaContainer}>
      <button type="button" onClick={handleDownloadPDF} style={styles.ctaButtonDownload}>
        Download Report (PDF)
      </button>
       <button type="button" onClick={handleScheduleCall} style={styles.ctaButtonContact}>
        Discuss Your Results
      </button>
    </div>
  );
}

// Estilos básicos para los botones CTA
const styles = {
    ctaContainer: {
        display: 'flex',
        gap: '10px', // Espacio entre botones
        justifyContent: 'center', // Centrar botones en su contenedor
        flexWrap: 'wrap',
    },
    ctaButtonDownload: {
        padding: '10px 20px', border: 'none', borderRadius: '4px',
        cursor: 'pointer', fontSize: '1em',
        backgroundColor: '#5bc0de', // Azul claro
        color: 'white',
    },
    ctaButtonContact: {
        padding: '10px 20px', border: 'none', borderRadius: '4px',
        cursor: 'pointer', fontSize: '1em',
        backgroundColor: '#5cb85c', // Verde
        color: 'white',
    }
}

export default ResultsCTA;