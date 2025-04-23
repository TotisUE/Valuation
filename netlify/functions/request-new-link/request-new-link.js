// netlify/functions/request-new-link/request-new-link.js

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

// --- Configuración (Reutilizada de send-continuation-link) ---
const TOKEN_EXPIRY_DAYS = 7;
const MAGIC_LINK_BASE_URL = process.env.VITE_APP_BASE_URL || process.env.URL || 'http://localhost:5173';

// --- Cabeceras CORS comunes ---
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export const handler = async (event) => {
    console.log("--- request-new-link function invoked ---");

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
    if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey || !emailFromAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFromAddress)) {
        console.error('Server configuration error: Missing essential Env Vars.');
        // Devolver error genérico al cliente, pero loguear detalles en el servidor
        return { statusCode: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Server configuration error.' }) };
    }

    // --- Inicializar Clientes ---
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const resend = new Resend(resendApiKey);

    try {
        const payload = JSON.parse(event.body);
        const userEmail = payload?.email; // Esperamos 'email' en el payload

        // --- Validación del Payload ---
        if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
             console.warn("Invalid or missing email received:", userEmail);
             // Devolver éxito genérico para no revelar si el email es inválido
             return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, message: 'If an account exists for this email, a link has been sent.' }) };
        }

        console.log(`Request received for email: ${userEmail}`);

        // --- 1. Buscar la valoración INCOMPLETA más reciente para este email ---
        const { data: submission, error: submissionError } = await supabase
            .from('submissions')
            .select('id') // Solo necesitamos el ID
            .eq('user_email', userEmail)
            .eq('is_complete', false) // ¡IMPORTANTE: Buscar solo incompletas!
            .order('created_at', { ascending: false }) // La más reciente primero
            .limit(1) // Solo queremos una
            .maybeSingle(); // Devuelve null si no se encuentra, en lugar de error

        if (submissionError) {
            console.error(`Database error searching for submission for ${userEmail}:`, submissionError);
            // Devolver error genérico interno
            throw new Error(`Database error searching submission: ${submissionError.message}`);
        }

        // --- 2. Si NO se encuentra valoración incompleta, devolver éxito genérico ---
        if (!submission) {
            console.log(`No incomplete submission found for ${userEmail}. Sending generic success response.`);
            return {
                statusCode: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: true, message: 'If an account exists for this email, a link has been sent.' })
            };
        }

        // --- 3. Si se encuentra, proceder a generar y enviar NUEVO link ---
        const assessment_id = submission.id;
        console.log(`Found incomplete submission ID ${assessment_id} for ${userEmail}. Proceeding to send new link.`);

        // --- 3a. Generar Token Seguro ---
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

        // --- 3b. Guardar NUEVO Token en Supabase ---
        // NOTA: Esto puede generar múltiples tokens válidos para la misma valoración si se solicita varias veces.
        // Podríamos añadir lógica para invalidar tokens anteriores si fuera necesario.
        console.log(`Saving new token for assessment ${assessment_id}`);
        const { error: tokenInsertError } = await supabase
            .from('magic_links')
            .insert({ assessment_id, token, email: userEmail, expires_at: expiresAt.toISOString() });

        if (tokenInsertError) {
             console.error(`Database error saving new token for ${userEmail} (assessment ${assessment_id}):`, tokenInsertError);
            throw new Error(`Database Error saving token: ${tokenInsertError.message}`);
        }

        // --- 3c. Construir el Magic Link ---
        const continuationLink = `${MAGIC_LINK_BASE_URL}/assessment/continue?token=${token}`;
        console.log(`Constructed New Magic Link: ${continuationLink}`);

        // --- 3d. Enviar Email con Resend ---
        const emailSubject = "Your Business Valuation Continuation Link";
        const emailHtmlBody = `
             <!DOCTYPE html><html><head><title>${emailSubject}</title></head>
             <body style="font-family: sans-serif;">
             <h1>Continue Your Business Valuation</h1>
             <p>Hello,</p>
             <p>You requested a new link to continue your business valuation. Your previous link may no longer be valid.</p>
             <p>Click the link below to securely continue filling out the questionnaire from where you left off. This new link is valid for ${TOKEN_EXPIRY_DAYS} days and can only be used once.</p>
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

        console.log(`Attempting to send NEW continuation email to ${userEmail} from ${emailFromAddress}`);
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: emailFromAddress,
            to: userEmail,
            subject: emailSubject,
            html: emailHtmlBody,
        });

        if (emailError) {
            console.error("Resend API Error sending new link:", emailError);
            // Devolver un error genérico interno, no el detalle de Resend al cliente
             throw new Error(`Email Service Error: ${emailError.message}`);
        }

        console.log("Resend new link email sent successfully. ID:", emailData?.id);

        // --- Respuesta de Éxito (Genérica) ---
        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                message: 'If an account exists for this email, a link has been sent.' // Mensaje genérico
            }),
        };

    } catch (error) {
        console.error('Error in request-new-link handler:', error);
        // Devolver siempre un error genérico al cliente en caso de fallo inesperado
        return {
            statusCode: 500, // Error interno del servidor
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, error: 'An internal error occurred. Please try again later.' }),
        };
    }
};