// netlify/functions/save-partial-assessment/save-partial-assessment.js

import { createClient } from '@supabase/supabase-js';

// Variable de entorno para identificar quién guarda (opcional, pero útil)
// const SAVED_BY = 'vc'; // No se usa actualmente, comentado

// --- Cabeceras CORS comunes ---
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // O 'http://localhost:5173' en dev si quieres ser específico
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', // Añade métodos según necesites por función
    'Access-Control-Allow-Headers': 'Content-Type, Authorization' // Añade cabeceras según necesites
};

export const handler = async (event) => {
    console.log("--- save-partial-assessment function invoked ---");

    // --- MANEJO DE CORS PREFLIGHT (OPTIONS) ---
    if (event.httpMethod === 'OPTIONS') {
        console.log(`OPTIONS request received for ${event.path}`);
        return {
            statusCode: 204, // No Content
            headers: corsHeaders,
            body: ''
        };
    }
    // --- FIN MANEJO OPTIONS ---

    // Solo permitir POST para esta función
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { ...corsHeaders, 'Allow': 'POST' }, // Incluir CORS headers
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    // Leer variables de entorno de Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('Supabase Env Vars missing for save-partial-assessment');
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Incluir CORS headers
            body: JSON.stringify({ success: false, error: 'Server configuration error.' })
        };
    }

    // Inicializar Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    try {
        const payload = JSON.parse(event.body);
        const { assessment_id, userEmail, formData } = payload;

        // --- Validación básica del payload ---
        if (!userEmail || !formData) {
            console.error("Incomplete data received: missing userEmail or formData");
            return {
                statusCode: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Incluir CORS headers
                body: JSON.stringify({ success: false, error: 'Missing required data (email or form data).' })
            };
        }
        if (typeof formData !== 'object' || formData === null) {
            console.error("Invalid formData received: not an object");
            return {
                statusCode: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Incluir CORS headers
                body: JSON.stringify({ success: false, error: 'Invalid form data format.' })
            };
        }

        // --- Datos a guardar/actualizar ---
        const dataToUpsert = {
            user_email: userEmail,
            form_data: formData,
            status: 'partial_vc',
            is_complete: false,
        };

        console.log(`Attempting to upsert assessment. Provided assessment_id: ${assessment_id}`);

        // --- Lógica de Upsert ---
        const { data, error } = await supabase
            .from('submissions')
            .upsert(
                assessment_id ? { ...dataToUpsert, id: assessment_id } : dataToUpsert,
                { onConflict: 'id' }
            )
            .select('id') // Solo necesitamos el ID de vuelta
            .single();

        if (error) {
            console.error('Supabase Upsert Error:', error);
            throw new Error(`Database Upsert Error: ${error.message}`);
        }
        if (!data || !data.id) {
            console.error('Upsert operation did not return expected ID.');
            throw new Error('Failed to save assessment data properly.');
        }

        console.log('Supabase Upsert Success. Assessment ID:', data.id);

        // --- Respuesta de Éxito ---
        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Incluir CORS headers
            body: JSON.stringify({
                success: true,
                message: 'Assessment progress saved successfully.',
                assessment_id: data.id
            }),
        };

    } catch (error) {
        console.error('Error in save-partial-assessment handler:', error);
        let errorMessage = 'Failed to save assessment progress.';
        if (error instanceof SyntaxError) { errorMessage = 'Invalid data format received.' }
        else if (error.message) { errorMessage = error.message; }
        return {
            // Determinar status code más específico si es posible
            statusCode: error.message.includes('Database') || error.message.includes('Failed to save') ? 500 : 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Incluir CORS headers
            body: JSON.stringify({ success: false, error: errorMessage }),
        };
    }
};