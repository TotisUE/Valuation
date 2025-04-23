// src/utils/urlHelpers.js

// Helper para determinar la URL base de las funciones Netlify
export function getFunctionsBaseUrl() { // Añadir 'export'
    if (import.meta.env.DEV) {
        const devBaseUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL || '';
        // Quitamos los console.log de aquí para mantenerlo limpio
        if (!devBaseUrl) {
            console.error("getFunctionsBaseUrl: VITE_NETLIFY_FUNCTIONS_BASE_URL not defined!");
            return ''; // O lanzar un error si prefieres
        }
        return devBaseUrl;
    } else {
        // En producción, la ruta relativa es suficiente
        return ''; // Devuelve vacío para usar rutas relativas
    }
}

// Podrías añadir otras funciones de utilidad de URL aquí en el futuro