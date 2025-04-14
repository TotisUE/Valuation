// src/components/results/DiscussTabContent.jsx
import React from 'react';

// Opciones de configuración para Calendly (ajústalas según necesidad)
const calendlyOptions = {
  hideGdprBanner: true, // Ocultar banner GDPR si no es necesario
  // Añade más parámetros de URL si los necesitas:
  // hide_event_type_details=1
  // hide_landing_page_details=1
  // background_color=f0f0f0
  // text_color=333333
  // primary_color=007bff
};

function DiscussTabContent({ calendlyLink, userEmail }) { // Solo recibe link y email

  // Construir la URL final de Calendly con prellenado de email
  const getEmbedUrl = () => {
    if (!calendlyLink || typeof calendlyLink !== 'string' || !calendlyLink.startsWith('http')) {
        console.error("Invalid or missing Calendly Link provided:", calendlyLink);
        return null; // No mostrar nada si no hay enlace válido
    }

    try {
      const url = new URL(calendlyLink);
      const params = new URLSearchParams(url.search); // Mantener parámetros existentes

      // Prellenar email (si existe)
      if (userEmail) {
        params.set('email', userEmail);
      }

      // Añadir opciones de embed como parámetros
      if (calendlyOptions.hideGdprBanner) params.set('hide_gdpr_banner', '1');
      // if (calendlyOptions.hideEventTypeDetails) params.set('hide_event_type_details', '1'); // Ejemplo
      // ...añadir otras opciones...

      url.search = params.toString();
      return url.toString();

    } catch (error) {
      console.error("Error constructing Calendly URL:", error);
      return null; // Enlace inválido o error al procesar
    }
  };

  const finalCalendlyUrl = getEmbedUrl();

  if (!finalCalendlyUrl) {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
       <p>The consulting schedule is not available at the moment.</p>
       <p>Please try again later or contact support.</p>
        </div>
    );
  }

  return (
    <div className="calendly-embed-container" style={{ minHeight: '680px', height: '70vh', position: 'relative', overflow: 'hidden' }}>
      {/* Usamos iFrame para el embed directo */}
      <iframe
        src={finalCalendlyUrl}
        width="100%"
        height="100%"
        style={{ border: '0', position: 'absolute', top: 0, left: 0 }}
        frameBorder="0"
        title="Agendar Consulta - Calendly"
        allow="fullscreen"
      ></iframe>
    </div>
  );
}

export default DiscussTabContent;