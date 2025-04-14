// src/components/results/ResultsCTA.jsx
import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ValuationReportPDF from './ValuationReportPDF'; 

function ResultsCTA({ calculationResult, formData }) {
  return (
    // El div contenedor se mantiene, pero ahora solo contendrá un botón
    <div className="results-cta" style={styles.ctaContainer}>
     <PDFDownloadLink
    document={
        // Pasar los datos necesarios al componente PDF
        <ValuationReportPDF
            calculationResult={calculationResult}
            formData={formData}
        />
    }
    // Nombre del archivo que se descargará
    fileName={`Valuation-Report-${formData?.userEmail || 'summary'}.pdf`}
    // Estilo para que el enlace parezca un botón
    style={styles.ctaButtonDownload}
>
    {({ blob, url, loading, error }) =>
        loading ? 'Generating PDF...' : 'Download Report (PDF)'
    }
</PDFDownloadLink>
      {/* --- Botón "Discuss Your Results" ELIMINADO --- */}
    </div>
  );
}

// Estilos básicos (puedes ajustar ctaContainer si lo prefieres con un solo botón)
const styles = {
  ctaButtonDownload: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1em',
    backgroundColor: '#5bc0de', // Azul claro
    color: 'white',
    textDecoration: 'none', // <--- AÑADE ESTA LÍNEA AQUÍ
},
}

export default ResultsCTA;