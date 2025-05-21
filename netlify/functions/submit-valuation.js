// netlify/functions/submit-valuation/submit-valuation.js

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { Resend } from 'resend';
// Ajusta la ruta según la estructura real desde netlify/functions/submit-valuation/
import { ScoringAreas } from '../../src/scoringAreas.js';
import { getQuestionsDataArray, calculateMaxScoreForArea } from '../../src/questions.js'; 

// --- Cabeceras CORS comunes ---
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Helper ActiveCampaign
async function activeCampaignApiCall(apiUrl, apiKey, endpoint, method = 'GET', body = null) {
    const url = `${apiUrl}/api/3/${endpoint}`;
    const options = {
        method,
        headers: {
            'Api-Token': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    try {
        const response = await fetch(url, options);
        // Manejar error 422 como no fatal inicialmente
        if (!response.ok && response.status !== 422) {
            const errorText = await response.text();
            console.error(`ActiveCampaign API Error (${response.status}) on ${endpoint}: ${errorText}`);
            throw new Error(`ActiveCampaign API Error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        // Loguear errores de validación devueltos por AC en el cuerpo JSON
        if (data.errors) {
            console.error(`ActiveCampaign Validation Error on ${endpoint}:`, data.errors);
            // Podrías lanzar un error aquí si quieres que falle la función
        }
         // Loguear si fue 422 (ej. contacto ya existe, no es necesariamente un error)
         if (response.status === 422) {
             console.warn(`ActiveCampaign potential issue on ${endpoint} (Status 422):`, data);
         }
        return data;
    } catch (error) {
        console.error(`Failed to fetch ActiveCampaign ${url}:`, error);
        return null; // Devolver null para no detener el flujo principal
    }
}

export const handler = async (event) => {
    console.log("--- submit-valuation function invoked ---");

    // --- MANEJO DE CORS PREFLIGHT (OPTIONS) ---
    if (event.httpMethod === 'OPTIONS') {
        console.log(`OPTIONS request received for ${event.path}`);
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }
    // --- FIN MANEJO OPTIONS ---

    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        console.log("Method is NOT POST, returning 405.");
        return {
            statusCode: 405,
            headers: { ...corsHeaders, 'Allow': 'POST' },
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    // --- Leer TODAS las variables de entorno ---
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const activeCampaignApiUrl = process.env.ACTIVECAMPAIGN_API_URL;
    const activeCampaignApiKey = process.env.ACTIVECAMPAIGN_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const notificationRecipient = process.env.NOTIFICATION_EMAIL_RECIPIENT;
    const notificationFrom = process.env.NOTIFICATION_EMAIL_FROM;

    // Validar variables esenciales
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('Supabase Env Vars missing');
        return { statusCode: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Server config error (Supabase).' }) };
    }
    // No hacer fatal la falta de claves para servicios secundarios
    if (!resendApiKey || !notificationRecipient || !notificationFrom) {
        console.warn('Resend Env Vars missing. Skipping internal email notification.');
    }
    if (!activeCampaignApiUrl || !activeCampaignApiKey) {
        console.warn('ActiveCampaign Env Vars missing. Skipping AC sync.');
    }

    // Inicializar clientes
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    try {
        // Parsear payload
        const payload = JSON.parse(event.body);
        const formData = payload?.formData;
        const results = payload?.results;

        // Extraer scores y validar payload esencial
        const scores = results?.scores;
        if (!formData || !formData.userEmail || !results || !results.stage || !scores) {
            console.error("Incomplete data received in payload:", { hasFormData: !!formData, hasUserEmail: !!formData?.userEmail, hasResults: !!results, hasStage: !!results?.stage, hasScores: !!scores });
            throw new Error("Incomplete data received (missing formData, userEmail, results, stage, or scores)");
        }

        // Helper calculateMaxScoreForArea (interno)
        const dataToInsert = {
            // --- Campos existentes que mapean a columnas ---
            user_email: formData.userEmail,
            stage: results.stage,
            estimated_valuation: results.estimatedValuation,
            final_multiple: results.finalMultiple,
            score_percentage: results.scorePercentage,
            score_expansion: `${scores[ScoringAreas.EXPANSION] ?? 0} / ${calculateMaxScoreForArea(ScoringAreas.EXPANSION)}`,
            score_marketing_brand: `${scores[ScoringAreas.MARKETING] ?? 0} / ${calculateMaxScoreForArea(ScoringAreas.MARKETING)}`,
            score_profitability: `${scores[ScoringAreas.PROFITABILITY] ?? 0} / ${calculateMaxScoreForArea(ScoringAreas.PROFITABILITY)}`,
            score_offering: `${scores[ScoringAreas.OFFERING_SALES] ?? 0} / ${calculateMaxScoreForArea(ScoringAreas.OFFERING_SALES)}`,
            score_workforce: `${scores[ScoringAreas.WORKFORCE] ?? 0} / ${calculateMaxScoreForArea(ScoringAreas.WORKFORCE)}`,
            score_systems: `${scores[ScoringAreas.SYSTEMS] ?? 0} / ${calculateMaxScoreForArea(ScoringAreas.SYSTEMS)}`,
            score_market: `${scores[ScoringAreas.MARKET] ?? 0} / ${calculateMaxScoreForArea(ScoringAreas.MARKET)}`,
            is_complete: true,
            status: 'complete',

            form_data: formData,

            //employee_count_range: formData.employeeCountRange, // Mapea formData.employeeCountRange a la columna employee_count_range
            employee_count: formData.employeeCount, // Mapea formData.employeeCount a la columna employee_count
            location_state: formData.locationState,             // Mapea formData.locationState a location_state
            location_zip: formData.locationZip,                 // Mapea formData.locationZip a location_zip
            revenue_source_balance: formData.revenueSourceBalance, // Mapea formData.revenueSourceBalance a revenue_source_balance
            customer_type_balance: formData.customerTypeBalance     // Mapea formData.customerTypeBalance a customer_type_balance
            // --- FIN NUEVOS CAMPOS ---
        };
        console.log("Data to Insert into Supabase:", "Structure looks ok, logging only keys:", Object.keys(dataToInsert)); // Evitar loguear datos sensibles

        // *** CORRECCIÓN: Usar lógica original de insert/select ***
        const { data: insertedDataArray, error: insertError } = await supabase
            .from('submissions')
            .insert([dataToInsert]) // Debe ser un array
            .select(); // Selecciona las columnas insertadas por defecto

        if (insertError) {
            console.error('Supabase Insert Error:', insertError);
            let dbErrorMessage = insertError.message;
            if (insertError.details) dbErrorMessage += ` Details: ${insertError.details}`;
            if (insertError.hint) dbErrorMessage += ` Hint: ${insertError.hint}`;
            throw new Error(`Database Error: ${dbErrorMessage}`);
        }
        if (!insertedDataArray || insertedDataArray.length === 0) {
             console.error('Supabase insert did not return expected data array.');
             throw new Error('Failed to confirm submission save in database.');
        }
        const submissionId = insertedDataArray[0]?.id; // Obtener ID del primer resultado
        console.log('Supabase Insert Success. Submission ID:', submissionId);
         // *** FIN CORRECCIÓN ***

        // --- 2. Integración con ActiveCampaign ---
        let activeCampaignSuccess = false;
        const stageForTag = results.stage;
        const emailForAC = formData.userEmail;
        if (activeCampaignApiUrl && activeCampaignApiKey && emailForAC && stageForTag) {
            console.log(`Attempting ActiveCampaign sync for ${emailForAC} with stage ${stageForTag}`);
            try {
                const contactPayload = { contact: { email: emailForAC } };
                const syncResponse = await activeCampaignApiCall(activeCampaignApiUrl, activeCampaignApiKey, 'contact/sync', 'POST', contactPayload);
                if (syncResponse?.contact) {
                    const contactId = syncResponse.contact.id;
                    console.log(`ActiveCampaign contact synced (ID: ${contactId})`);
                    const tagName = `Valuation-Stage-${stageForTag.replace(/[\s/]+/g, '-')}`;
                    const tagsResponse = await activeCampaignApiCall(activeCampaignApiUrl, activeCampaignApiKey, `tags?search=${encodeURIComponent(tagName)}`);
                    const foundTag = tagsResponse?.tags?.find(t => t.tag === tagName);
                    if (foundTag) {
                        const tagId = foundTag.id;
                        const tagPayload = { contactTag: { contact: contactId, tag: tagId } };
                        const tagAddResponse = await activeCampaignApiCall(activeCampaignApiUrl, activeCampaignApiKey, 'contactTags', 'POST', tagPayload);
                        if (tagAddResponse?.contactTag) {
                            console.log(`ActiveCampaign Tag successfully added to contact ${contactId}`);
                            activeCampaignSuccess = true;
                        } else { console.warn("ActiveCampaign Add Tag response issue:", tagAddResponse); }
                    } else { console.warn(`ActiveCampaign Tag "${tagName}" not found.`); }
                } else { console.warn("ActiveCampaign Sync Contact response issue:", syncResponse); }
            } catch (acError) { console.error("Error during ActiveCampaign processing, but continuing...", acError); }
        } else { console.warn("Skipping ActiveCampaign sync: Missing credentials, email, or stage."); }

        // --- 3. RESEND --- Enviar Notificación Interna ---
        let resendSuccess = false;
        if (resend && notificationRecipient && notificationFrom) {
            console.log(`Attempting to send internal notification email via Resend to ${notificationRecipient}`);
            try {
                const emailSubject = `Nueva Valoración Completada: ${formData.userEmail}`;
                const emailHtmlBody = `
                    <h1>Nueva Valoración de Negocio Completada</h1>
                    <p>El usuario con email <strong>${formData.userEmail || 'N/A'}</strong> ha completado el cuestionario.</p>
                    <ul>
                        <li><strong>Etapa Calculada:</strong> ${results.stage || 'N/A'}</li>
                        <li><strong>Valoración Estimada:</strong> ${results.estimatedValuation?.toLocaleString() || 'N/A'}</li>
                        <li><strong>Email:</strong> ${formData.userEmail || 'N/A'}</li>
                        <li><strong>Fecha:</strong> ${new Date().toLocaleString()}</li>
                        ${submissionId ? `<li><strong>ID en DB:</strong> ${submissionId}</li>` : ''}
                    </ul>
                    <p>Puedes ver los detalles completos en la base de datos.</p>
                `;
                const { data: emailData, error: emailError } = await resend.emails.send({
                    from: notificationFrom,
                    to: notificationRecipient,
                    subject: emailSubject,
                    html: emailHtmlBody,
                });
                if (emailError) {
                    console.error("Resend API Error:", emailError);
                } else {
                    console.log("Resend email sent successfully. ID:", emailData?.id);
                    resendSuccess = true;
                }
            } catch (error) { console.error("Error sending email via Resend:", error); }
        } else { console.warn("Skipping Resend notification: Missing Resend API Key, recipient, or sender address."); }

        // --- 4. Devolver respuesta de éxito al frontend ---
        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                message: 'Submission processed!',
                submissionId: submissionId,
                activeCampaignSynced: activeCampaignSuccess,
                notificationSent: resendSuccess
            }),
        };

    } catch (error) {
        console.error('Error in submit-valuation handler:', error);
        let errorMessage = 'Failed to save submission.';
        if (error instanceof SyntaxError) { errorMessage = 'Invalid data format received.' }
        else if (error.message) { errorMessage = error.message; }
        // Determinar status code más específico
        const statusCode = error.message?.includes('Incomplete data') || error.pgcode ? 400 : 500;
        return {
            statusCode,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, error: errorMessage }),
        };
    }
};

//export { handler }; // Descomenta si usas export nombrado en lugar de default