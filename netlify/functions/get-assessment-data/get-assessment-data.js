// netlify/functions/get-assessment-data/get-assessment-data.js

import { createClient } from '@supabase/supabase-js';

// --- Cabeceras CORS comunes ---
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS', // Solo GET y OPTIONS para esta
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export const handler = async (event) => {
    console.log("--- get-assessment-data function invoked ---");

    // --- MANEJO DE CORS PREFLIGHT (OPTIONS) ---
    if (event.httpMethod === 'OPTIONS') {
        console.log(`OPTIONS request received for ${event.path}`);
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }
    // --- FIN MANEJO OPTIONS ---

    // Esta función también usará GET
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
        // --- Obtener assessment_id de los Query Parameters ---
        const assessmentId = event.queryStringParameters?.id;

        // --- Validaciones de ID ---
        if (!assessmentId) {
            return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Assessment ID parameter is missing.' }) };
        }
        const idAsNumber = parseInt(assessmentId, 10);
        if (isNaN(idAsNumber) || idAsNumber <= 0) {
             return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Invalid Assessment ID format.' }) };
        }

        console.log(`Attempting to fetch data for assessment ID: ${idAsNumber}`);

        // --- Consultar Supabase ---
        const { data: submissionData, error: fetchError } = await supabase
            .from('submissions')
            .select('form_data, user_email')
            .eq('id', idAsNumber)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') { // No encontrado
                return { statusCode: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Assessment data not found.' }) };
            }
            console.error('Supabase Select Error (submissions):', fetchError);
            throw new Error(`Database Error: ${fetchError.message}`);
        }

        // Opcional: Comentar o quitar el warning si form_data vacío es esperado/ok
        // if (!submissionData.form_data) {
        //    console.warn(`Assessment found (ID: ${idAsNumber}) but form_data is missing or null.`);
        // }

        console.log(`Successfully fetched data for assessment ID: ${idAsNumber}`);

        // --- Respuesta de Éxito ---
        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Incluir CORS headers
            body: JSON.stringify({
                success: true, // Incluir success
                data: submissionData.form_data || {} // Devolver {} si form_data es null/undefined
            }),
        };

    } catch (error) {
        console.error('Error in get-assessment-data handler:', error);
        let errorMessage = 'Failed to retrieve assessment data.';
        if (error instanceof SyntaxError) { errorMessage = 'Invalid data format in request.' }
        else if (error.message) { errorMessage = error.message; }
        const statusCode = error.message?.includes('Database') ? 500 : 500; // Default a 500
        return {
            statusCode,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Incluir CORS headers
            body: JSON.stringify({ success: false, error: errorMessage }),
        };
    }
};