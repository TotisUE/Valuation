// netlify/functions/submit-s2d-assessment/submit-s2d-assessment.js
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Considera restringirlo a tu URL de Netlify en producción
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization' // Authorization por si lo usas en el futuro
};

export const handler = async (event) => {
    // Manejo de CORS Preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { ...corsHeaders, 'Allow': 'POST' },
            body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
        };
    }

    // Leer variables de entorno de Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('[submit-s2d-assessment] Supabase environment variables are missing.');
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, error: 'Server configuration error for S2D submission.' })
        };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    try {
        const s2dDataPackage = JSON.parse(event.body);
        console.log('[submit-s2d-assessment] Received payload:', s2dDataPackage);

        // Validación básica del payload (puedes expandir esto)
        if (!s2dDataPackage || typeof s2dDataPackage.s2d_productName !== 'string' || s2dDataPackage.s2d_productName.trim() === '') {
            console.error('[submit-s2d-assessment] Invalid payload: Product name is missing or invalid.');
            return {
                statusCode: 400, // Bad Request
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, error: 'Product name is required.' })
            };
        }
        // Puedes añadir más validaciones para los scores, etc.

        // Mapeo de los datos del payload a las columnas de la tabla
        // Asegúrate de que los NOMBRES DE CLAVE aquí coincidan con los NOMBRES DE COLUMNA en tu tabla s2d_assessments
        const dataToInsert = {
            // Si pasas userId o mainSubmissionId desde el frontend, descomenta y usa:
            // user_id: s2dDataPackage.userId || null,
            // main_submission_id: s2dDataPackage.mainSubmissionId || null,
            product_name: s2dDataPackage.s2d_productName,
            product_description: s2dDataPackage.s2d_productDescription,
            product_revenue: s2dDataPackage.s2d_productRevenue,
            process_maturity_score: s2dDataPackage.processMaturityScore,
            owner_independence_score: s2dDataPackage.ownerIndependenceScore,
            client_experience_score: s2dDataPackage.clientExperienceOptimizationScore, // Nombre de clave coincide con el payload
            resource_allocation_score: s2dDataPackage.resourceAllocationEffectivenessScore, // Nombre de clave coincide con el payload
            detailed_answers_json: s2dDataPackage.detailedAnswers,
            s2d_all_answers_json: s2dDataPackage.s2d_all_answers
        };
        
        console.log('[submit-s2d-assessment] Data being inserted into s2d_assessments:', dataToInsert);

        const { data: insertedData, error: insertError } = await supabase
            .from('s2d_assessments') // Nombre de tu tabla
            .insert([dataToInsert])
            .select(); // Para obtener el registro insertado de vuelta

        if (insertError) {
            console.error('[submit-s2d-assessment] Supabase insert error:', insertError);
            throw new Error(`Database error during S2D insert: ${insertError.message}`);
        }

        if (!insertedData || insertedData.length === 0) {
            console.error('[submit-s2d-assessment] Supabase insert did not return data.');
            throw new Error('Failed to confirm S2D assessment save in database (no data returned).');
        }

        const newAssessmentId = insertedData[0].id;
        console.log(`[submit-s2d-assessment] S2D Assessment saved successfully. ID: ${newAssessmentId}`);

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                message: 'Product/Service Assessment saved successfully!',
                assessmentId: newAssessmentId // Devolver el ID del nuevo registro
            }),
        };

    } catch (error) {
        console.error('[submit-s2d-assessment] Error in handler:', error);
        const isClientError = error.message.includes('Product name is required'); // Ejemplo
        return {
            statusCode: isClientError ? 400 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, error: error.message }),
        };
    }
};