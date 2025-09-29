// netlify/functions/debug-env.js
export const handler = async (event) => {

    // Por seguridad, solo mostraremos si las variables existen, no sus valores completos.
    const supabaseUrlExists = !!process.env.SUPABASE_URL;
    const supabaseServiceKeyExists = !!process.env.SUPABASE_SERVICE_KEY;
  
    const response = {
      message: "This function checks which environment variables are available.",
      variables: {
        SUPABASE_URL_EXISTS: supabaseUrlExists,
        SUPABASE_SERVICE_KEY_EXISTS: supabaseServiceKeyExists
      },
      // Mostramos un trozo de la URL para confirmar que es la correcta
      url_snippet: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 20) + "..." : "URL NOT FOUND"
    };
  
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response, null, 2),
    };
  };