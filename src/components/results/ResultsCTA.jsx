// src/components/results/ResultsCTA.jsx
import React from 'react';

// Estilos (asegúrate que textDecoration: 'none' no esté si no es necesario)
const styles = {
    ctaContainer: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'center', // Centrará el botón
        flexWrap: 'wrap',
    },
    ctaButtonDownload: {
        padding: '10px 20px', border: 'none', borderRadius: '4px',
        cursor: 'pointer', fontSize: '1em',
        backgroundColor: '#5bc0de', // Azul claro
        color: 'white',
        // textDecoration: 'none', // Probablemente ya no es necesario
        opacity: 1, // Asegurar opacidad normal
        transition: 'background-color 0.2s, opacity 0.2s', // Añadir transición
    },
    // Estilo para estado deshabilitado
    ctaButtonDisabled: {
        cursor: 'not-allowed',
        opacity: 0.6,
        backgroundColor: '#9cdaee', // Un color azul más claro/apagado cuando está deshabilitado
    }
};

// Helper para obtener el estilo del botón dinámicamente
const getButtonStyle = (isLoading) => {
    let style = { ...styles.ctaButtonDownload }; // Copiar estilo base
    if (isLoading) {
        style = { ...style, ...styles.ctaButtonDisabled }; // Fusionar con estilo deshabilitado
    }
    return style;
}

function ResultsCTA({ onDownloadClick, isLoading }) {
  return (
    <div className="results-cta" style={styles.ctaContainer}>
      <button
        type="button"
        onClick={onDownloadClick} // Llamar al manejador pasado por props
        disabled={isLoading}      // Deshabilitar mientras se genera
        style={getButtonStyle(isLoading)} // Aplicar estilo dinámico
      >
        {/* Cambiar texto según el estado de carga */}
        {isLoading ? 'Generating PDF...' : 'Download Report (PDF)'}
      </button>
    </div>
  );
}
export default ResultsCTA;