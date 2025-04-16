// netlify/functions/submit-valuation.js

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
// --- RESEND --- Importar Resend
import { Resend } from 'resend';
import { ScoringAreas } from '../../src/scoringAreas.js'; // Ruta CORREGIDA (dos niveles arriba, luego a src)
// Helper ActiveCampaign (sin cambios)
async function activeCampaignApiCall(apiUrl, apiKey, endpoint, method = 'GET', body = null) {
  // ... código del helper igual ...
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
    if (!response.ok && response.status !== 422) {
        const errorText = await response.text();
        console.error(`ActiveCampaign API Error (${response.status}) on ${endpoint}: ${errorText}`);
        throw new Error(`ActiveCampaign API Error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
     if (data.errors) {
        console.error(`ActiveCampaign Validation Error on ${endpoint}:`, data.errors);
     }
     if (response.status === 422) {
         console.warn(`ActiveCampaign potential issue on ${endpoint} (Status 422):`, data);
     }
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }), headers: { 'Allow': 'POST' } };
  }

  // --- Leer TODAS las variables de entorno ---
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const activeCampaignApiUrl = process.env.ACTIVECAMPAIGN_API_URL;
  const activeCampaignApiKey = process.env.ACTIVECAMPAIGN_API_KEY;
  // --- RESEND --- Leer variables de Resend
  const resendApiKey = process.env.RESEND_API_KEY;
  const notificationRecipient = process.env.NOTIFICATION_EMAIL_RECIPIENT;
  const notificationFrom = process.env.NOTIFICATION_EMAIL_FROM;

  // Validar variables esenciales
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase Env Vars missing');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server config error (Supabase).' }) };
  }
  // --- RESEND --- Validar variables de Resend (necesitamos todas para enviar)
  if (!resendApiKey || !notificationRecipient || !notificationFrom) {
      console.warn('Resend Env Vars missing. Skipping email notification.');
      // No hacemos que sea un error fatal si faltan las de Resend
  }
  if (!activeCampaignApiUrl || !activeCampaignApiKey) {
    console.warn('ActiveCampaign Env Vars missing. Skipping AC sync.');
  }

  // Inicializar clientes
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  // --- RESEND --- Inicializar Resend si tenemos la clave
  const resend = resendApiKey ? new Resend(resendApiKey) : null;

  try {
    // Parsear payload
    const payload = JSON.parse(event.body);
    const formData = payload.formData;
    const results = payload.results;

    // <<< CORRECCIÓN 1: Extraer scores >>>
    const scores = results?.scores;

    // <<< CORRECCIÓN 2: Añadir !scores a la validación >>>
    if (!formData || !formData.userEmail || !results || !results.stage || !scores) {
        throw new Error("Incomplete data received (missing formData, userEmail, results, stage, or scores)");
    }
    console.log("Received Payload:", payload);
    console.log("Extracted Scores:", scores); // Log para verificar

    // <<< CORRECCIÓN 3: Definir getMaxScore aquí >>>
    const getMaxScore = (areaName) => {
      // Si es Market, Profitability U Offering, el máximo es 25
      if (areaName === ScoringAreas.MARKET ||
          areaName === ScoringAreas.PROFITABILITY ||
          areaName === ScoringAreas.MARKETING ||
          areaName === ScoringAreas.OFFERING) { // <-- AÑADIR ESTA CONDICIÓN
          return 25;
      }
      // Para todas las demás, es 20
      return 20;
  };

    // --- 1. Insertar en Supabase ---
    const dataToInsert = {
      user_email: formData.userEmail,
      form_data: formData,
      stage: results.stage,
      estimated_valuation: results.estimatedValuation,
      final_multiple: results.finalMultiple,
      score_percentage: results.scorePercentage,

      // --- NUEVO: Scores por Área (Ahora 'scores' está definido) ---
      score_expansion: `${scores[ScoringAreas.EXPANSION] ?? 0} / ${getMaxScore(ScoringAreas.EXPANSION)}`,
      score_marketing_brand: `${scores[ScoringAreas.MARKETING] ?? 0} / ${getMaxScore(ScoringAreas.MARKETING)}`,
      score_profitability: `${scores[ScoringAreas.PROFITABILITY] ?? 0} / ${getMaxScore(ScoringAreas.PROFITABILITY)}`,
      score_offering: `${scores[ScoringAreas.OFFERING] ?? 0} / ${getMaxScore(ScoringAreas.OFFERING)}`,
      score_workforce: `${scores[ScoringAreas.WORKFORCE] ?? 0} / ${getMaxScore(ScoringAreas.WORKFORCE)}`,
      score_systems: `${scores[ScoringAreas.SYSTEMS] ?? 0} / ${getMaxScore(ScoringAreas.SYSTEMS)}`,
      score_market: `${scores[ScoringAreas.MARKET] ?? 0} / ${getMaxScore(ScoringAreas.MARKET)}`,
    };
    console.log("Data to Insert into Supabase:", dataToInsert);

    const { data: insertedData, error: insertError } = await supabase
      .from('submissions')
      .insert([dataToInsert])
      .select();

    if (insertError) {
      console.error('Supabase Insert Error:', insertError);
       // Intenta dar un mensaje más específico si es posible
       let dbErrorMessage = insertError.message;
       if (insertError.details) dbErrorMessage += ` Details: ${insertError.details}`;
       if (insertError.hint) dbErrorMessage += ` Hint: ${insertError.hint}`;
       throw new Error(`Database Error: ${dbErrorMessage}`);
    }
    console.log('Supabase Insert Success:', insertedData);
    const submissionId = insertedData?.[0]?.id;


    // --- 2. Integración con ActiveCampaign ---
    let activeCampaignSuccess = false;
    const stageForTag = results.stage;
    const emailForAC = formData.userEmail;

    if (activeCampaignApiUrl && activeCampaignApiKey && emailForAC && stageForTag) {
        // ... (Código de ActiveCampaign sin cambios) ...
         console.log(`Attempting ActiveCampaign sync for ${emailForAC} with stage ${stageForTag}`);
      try {
        // a) Crear/Actualizar contacto
        const contactPayload = { contact: { email: emailForAC /*, firstName: formData.firstName ... */ } };
        console.log("AC Payload (Sync Contact):", contactPayload);
        const syncResponse = await activeCampaignApiCall(activeCampaignApiUrl, activeCampaignApiKey, 'contact/sync', 'POST', contactPayload);

        if (syncResponse?.contact) {
            const contactId = syncResponse.contact.id;
            console.log(`ActiveCampaign contact synced (ID: ${contactId})`);

            // b) Construir nombre etiqueta
            const tagName = `Valuation-Stage-${stageForTag.replace(/[\s/]+/g, '-')}`;
            console.log(`Looking for AC Tag: ${tagName}`);

            // c) Buscar ID etiqueta
            const tagsResponse = await activeCampaignApiCall(activeCampaignApiUrl, activeCampaignApiKey, `tags?search=${encodeURIComponent(tagName)}`);
            const foundTag = tagsResponse?.tags?.find(t => t.tag === tagName);

            if (foundTag) {
                const tagId = foundTag.id;
                console.log(`Found AC Tag ID: ${tagId}`);

                // d) Añadir etiqueta
                const tagPayload = { contactTag: { contact: contactId, tag: tagId } };
                console.log("AC Payload (Add Tag):", tagPayload);
                const tagAddResponse = await activeCampaignApiCall(activeCampaignApiUrl, activeCampaignApiKey, 'contactTags', 'POST', tagPayload);

                if (tagAddResponse?.contactTag) {
                    console.log(`ActiveCampaign Tag successfully added to contact ${contactId}`);
                    activeCampaignSuccess = true;
                } else { console.warn("ActiveCampaign Add Tag response issue:", tagAddResponse); }
            } else { console.warn(`ActiveCampaign Tag "${tagName}" not found.`); }
        } else { console.warn("ActiveCampaign Sync Contact response issue:", syncResponse); }
      } catch (acError) { console.error("Error during ActiveCampaign processing, but continuing..."); }

    } else { console.warn("Skipping ActiveCampaign sync: Missing credentials, email, or stage."); }


    // --- 3. RESEND --- Enviar Notificación Interna ---
    let resendSuccess = false;
    if (resend && notificationRecipient && notificationFrom) { // Verificar si resend está inicializado y tenemos destinatario/remitente
        console.log(`Attempting to send internal notification email via Resend to ${notificationRecipient}`);
        try {
            const emailSubject = `Nueva Valoración Completada: ${formData.userEmail}`;
            const emailHtmlBody = `
                <h1>Nueva Valoración de Negocio Completada</h1>
                <p>El usuario con email <strong>${formData.userEmail}</strong> ha completado el cuestionario.</p>
                <ul>
                    <li><strong>Etapa Calculada:</strong> ${results.stage || 'N/A'}</li>
                    <li><strong>Valoración Estimada:</strong> ${results.estimatedValuation?.toLocaleString() || 'N/A'}</li>
                    <li><strong>Email:</strong> ${formData.userEmail}</li>
                    <li><strong>Fecha:</strong> ${new Date().toLocaleString()}</li>
                    ${submissionId ? `<li><strong>ID en DB:</strong> ${submissionId}</li>` : ''}
                </ul>
                <p>Puedes ver los detalles completos en la base de datos o contactar al usuario.</p>
            `;

            const { data: emailData, error: emailError } = await resend.emails.send({
                from: notificationFrom, // Ej: 'Valuation Tool <noreply@tudominioverificado.com>'
                to: notificationRecipient, // La dirección interna configurada
                subject: emailSubject,
                html: emailHtmlBody,
            });

            if (emailError) {
                console.error("Resend API Error:", emailError);
                // No lanzar error fatal
            } else {
                console.log("Resend email sent successfully:", emailData);
                resendSuccess = true;
            }
        } catch (error) {
            console.error("Error sending email via Resend:", error);
            // No lanzar error fatal
        }
    } else {
         console.warn("Skipping Resend notification: Missing Resend API Key, recipient, or sender address.");
    }
    // --- FIN RESEND ---


    // --- 4. Devolver respuesta de éxito al frontend ---
    return {
      statusCode: 200,
      headers: { /* ... CORS headers ... */
         "Access-Control-Allow-Origin": "*",
         "Access-Control-Allow-Headers": "Content-Type",
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
          success: true,
          message: 'Submission processed!', // Mensaje genérico
          submissionId: submissionId,
          activeCampaignSynced: activeCampaignSuccess,
          notificationSent: resendSuccess // Informar si se envió la notificación
       }),
    };

  } catch (error) {
     // ... (Manejo de errores sin cambios) ...
       console.error('Error in submit-valuation handler:', error);
    let errorMessage = 'Failed to save submission.';
     if (error instanceof SyntaxError){ errorMessage = 'Invalid data format received.' }
     else if (error.message){ errorMessage = error.message; } // Usar mensaje de error lanzado
    return {
      statusCode: error.pgcode ? 400 : 500, // Error de DB podría ser 400, otros 500
      headers: { /* ... CORS headers ... */
         "Access-Control-Allow-Origin": "*",
         "Access-Control-Allow-Headers": "Content-Type",
         "Content-Type": "application/json"
       },
      body: JSON.stringify({ success: false, error: errorMessage }),
    };
  }
};

export { handler };