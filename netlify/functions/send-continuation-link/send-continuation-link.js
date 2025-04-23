// netlify/functions/send-continuation-link/send-continuation-link.js

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

// --- Configuración ---
const TOKEN_EXPIRY_DAYS = 7;
const MAGIC_LINK_BASE_URL = process.env.VITE_APP_BASE_URL || process.env.URL || 'http://localhost:5173'; // URL base del frontend

// --- Cabeceras CORS comunes ---
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export const handler = async (event) => {
    console.log("--- send-continuation-link function invoked ---");

    // --- MANEJO DE CORS PREFLIGHT (OPTIONS) ---
    if (event.httpMethod === 'OPTIONS') {
        console.log(`OPTIONS request received for ${event.path}`);
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }
    // --- FIN MANEJO OPTIONS ---

    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: { ...corsHeaders, 'Allow': 'POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    // --- Leer Variables de Entorno ---
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFromAddress = process.env.NOTIFICATION_EMAIL_FROM;

    // --- Validaciones de Variables de Entorno ---
    if (!supabaseUrl || !supabaseServiceRoleKey) { /* ... manejo de error ... */ return { statusCode: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Server configuration error (DB).' }) }; }
    if (!resendApiKey) { /* ... manejo de error ... */ return { statusCode: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Server configuration error (Email API Key).' }) }; }
    if (!emailFromAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFromAddress)) { /* ... manejo de error ... */ return { statusCode: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Server configuration error (Email From Address).' }) }; }

    // --- Inicializar Clientes ---
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const resend = new Resend(resendApiKey);

    try {
        const payload = JSON.parse(event.body);
        const assessment_id = payload?.assessment_id;
        const userEmail = payload?.userEmail;

        // --- Validación del Payload ---
        if (!assessment_id || !userEmail) { /* ... manejo de error ... */ return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Missing required data (assessment ID or email).' }) }; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) { /* ... manejo de error ... */ return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Invalid recipient email format.' }) }; }

        // --- 1. Verificar que la valoración exista ---
        // ... (código de verificación existente sin cambios) ...
        console.log(`Verifying existence of assessment ID: ${assessment_id}`);
        const { data: assessmentData, error: assessmentError } = await supabase.from('submissions').select('id, user_email').eq('id', assessment_id).single();
        if (assessmentError || !assessmentData) { /* ... manejo de error ... */ const sc = (assessmentError && assessmentError.code === 'PGRST116') ? 404 : 500; const msg = sc === 404 ? 'Assessment not found.' : `DB Error: ${assessmentError?.message || 'Unknown'}`; return { statusCode: sc, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: msg }) }; }
        if (assessmentData.user_email !== userEmail) { /* ... manejo de error ... */ return { statusCode: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Email mismatch for the given assessment.' }) }; }


        // --- 2. Generar Token Seguro ---
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

        // --- 3. Guardar Token en Supabase ---
        // ... (código de guardado existente sin cambios) ...
        console.log(`Saving token for assessment ${assessment_id}`);
        const { error: tokenInsertError } = await supabase.from('magic_links').insert({ assessment_id, token, email: userEmail, expires_at: expiresAt.toISOString() });
        if (tokenInsertError) { /* ... manejo de error ... */ throw new Error(`Database Error saving token: ${tokenInsertError.message}`); }


        // --- 4. Construir el Magic Link ---
        const continuationLink = `${MAGIC_LINK_BASE_URL}/assessment/continue?token=${token}`;
        console.log(`Constructed Magic Link: ${continuationLink}`); // Verificar que se construye bien

        // --- 5. Enviar Email con Resend ---
        const emailSubject = "Continue Your Business Valuation";
        const emailHtmlBody = `
            <!DOCTYPE html><html><head><title>${emailSubject}</title></head>
            <body style="font-family: sans-serif;">
            <h1>Continue Your Business Valuation</h1>
            <p>Hello,</p>
            <p>Thank you for starting the business valuation process with us. Your progress has been saved.</p>
            <p>Click the link below to securely continue filling out the questionnaire from where you left off. This link is valid for ${TOKEN_EXPIRY_DAYS} days and can only be used once.</p>
            <p style="margin: 20px 0;">
              <a href="${continuationLink}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
                <strong>Continue Valuation Assessment</strong>
              </a>
            </p>
            <p>If you did not request this, please ignore this email.</p>
            <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
            <p><a href="${continuationLink}">${continuationLink}</a></p>
            <br>
            <p>Best regards,<br>The Acquira Team</p>
            </body></html>
        `;

        // +++ AÑADIR LOG DETALLADO DEL CUERPO HTML +++
        console.log("--- Preparing to send email ---");
        console.log("To:", userEmail);
        console.log("From:", emailFromAddress);
        console.log("Subject:", emailSubject);
        console.log("HTML Body:", emailHtmlBody); // <-- Este log mostrará el HTML completo
        console.log("--- End Email Details ---");
        // +++ FIN LOG DETALLADO +++

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: emailFromAddress,
            to: userEmail,
            subject: emailSubject,
            html: emailHtmlBody,
        });

        if (emailError) {
            console.error("Resend API Error:", emailError);
            return {
                statusCode: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, error: 'Failed to send continuation email.', details: emailError.message }),
             };
        }

        console.log("Resend email sent successfully. ID:", emailData?.id);

        // --- Respuesta de Éxito Total ---
        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                message: 'Continuation link sent successfully.'
            }),
        };

    } catch (error) {
        console.error('Error in send-continuation-link handler:', error);
        let errorMessage = 'Failed to send continuation link.';
        if (error instanceof SyntaxError) { errorMessage = 'Invalid data format received.' }
        else if (error.message) { errorMessage = error.message; }
        const statusCode = error.message?.includes('Database') ? 500 : (error.message?.includes('email format') || error.message?.includes('Missing required data') ? 400 : 500);
        return {
            statusCode,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, error: errorMessage }),
        };
    }
};