// netlify/functions/verify-continuation-token/verify-continuation-token.js

import { createClient } from '@supabase/supabase-js';

// --- Cabeceras CORS comunes ---
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS', // Solo GET y OPTIONS para esta
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export const handler = async (event) => {
    console.log("--- verify-continuation-token function invoked ---");

    // --- MANEJO DE CORS PREFLIGHT (OPTIONS) ---
    if (event.httpMethod === 'OPTIONS') {
        console.log(`OPTIONS request received for ${event.path}`);
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }
    // --- FIN MANEJO OPTIONS ---

    // IMPORTANTE: Usaremos GET para esta función
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: { ...corsHeaders, 'Allow': 'GET' },
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    // --- Leer Variables de Entorno ---
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('Supabase Env Vars missing');
        return { statusCode: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Server configuration error.' }) };
    }

    // --- Inicializar Supabase ---
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    try {
        // --- Obtener Token de los Query Parameters ---
        const token = event.queryStringParameters?.token;

        // --- Validaciones de Token ---
        if (!token) {
            return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, valid: false, error: 'Token parameter is missing.' }) };
        }
        console.log(`Token received: "${token}", Detected length: ${token.length}`);
        if (typeof token !== 'string' || token.length !== 64) {
            return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, valid: false, error: 'Invalid token format.' }) };
        }

        console.log(`Verifying token: ${token.substring(0, 10)}...`);

        // --- Buscar el Token en Supabase ---
        const now = new Date();
        const { data: tokenData, error: fetchError } = await supabase
            .from('magic_links')
            .select('assessment_id, email, expires_at, used_at')
            .eq('token', token)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') { // No encontrado
                return { statusCode: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, valid: false, error: 'Token not found.' }) };
            }
            console.error('Supabase Select Error (magic_links):', fetchError);
            throw new Error(`Database Error: ${fetchError.message}`);
        }

        // --- Validaciones Adicionales (Usado, Expirado) ---
        if (tokenData.used_at) {
            return { statusCode: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, valid: false, error: 'Token has already been used.' }) };
        }
        const expiresAt = new Date(tokenData.expires_at);
        if (expiresAt < now) {
            return { statusCode: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, valid: false, error: 'Token has expired.' }) };
        }

        console.log(`Token verified successfully for assessment ${tokenData.assessment_id}`);
        // Opcional: Marcar token como usado aquí si es necesario

        // --- Respuesta de Éxito ---
        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Incluir CORS headers
            body: JSON.stringify({
                success: true, // Incluido success
                valid: true,
                assessment_id: tokenData.assessment_id,
                email: tokenData.email
            }),
        };

    } catch (error) {
        console.error('Error in verify-continuation-token handler:', error);
        let errorMessage = 'Failed to verify token.';
        if (error instanceof SyntaxError) { errorMessage = 'Invalid data format in request.' }
        else if (error.message) { errorMessage = error.message; }
        const statusCode = error.message?.includes('Database') ? 500 : 500; // Default a 500 si no es DB
        return {
            statusCode,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Incluir CORS headers
            body: JSON.stringify({ success: false, valid: false, error: errorMessage }), // Asegurar success/valid false
        };
    }
};