// netlify/functions/get-submissions-list.js (VERSIÓN CORREGIDA - v2)
import { createClient } from '@supabase/supabase-js';

// --- Leer Variables de Entorno (Nombres de TU .env) ---
// Leemos las variables aquí, pero las validaremos DENTRO del handler.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAILS_STRING = process.env.ADMIN_EMAILS || '';

// --- Procesar Lista de Admins (Esto sí puede quedar fuera) ---
const ALLOWED_ADMIN_EMAILS = ADMIN_EMAILS_STRING.split(',')
    .map(email => email.trim())
    .filter(Boolean);

// --- La Función Handler de Netlify ---
// Toda la lógica de inicialización y verificación se mueve aquí dentro.
export const handler = async (event, context) => {

    // --- 1. Validar Variables de Entorno Críticas ---
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error("[get-submissions-list] ERROR CRÍTICO: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidas en el entorno de la función.");
        return {
            statusCode: 500,
            body: 'Internal Server Error: Missing Supabase configuration on the server.'
        };
    }

    // --- 2. Inicializar Cliente Supabase Admin (DENTRO del handler) ---
    let supabaseAdmin;
    try {
        supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
         console.log("[get-submissions-list] Supabase Admin client initialized successfully inside handler.");
    } catch (initError) {
        console.error("[get-submissions-list] ERROR CRÍTICO: Falló la inicialización de Supabase Admin Client:", initError);
        return {
            statusCode: 500,
            body: 'Internal Server Error: Failed to initialize Supabase connection.'
        };
    }

    // --- 3. Verificar Método HTTP ---
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // --- 4. Autenticación y Autorización ---
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        console.warn("[get-submissions-list] No token provided.");
        return { statusCode: 401, body: 'Unauthorized: No token provided' };
    }

    let userEmail = null;
    try {
        console.log("[get-submissions-list] Verifying token...");
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError) {
            console.error("[get-submissions-list] Error verifying token:", userError.message);
            return { statusCode: 401, body: `Unauthorized: ${userError.message}` };
        }
        if (!user) {
            console.warn("[get-submissions-list] Token valid but no user found.");
            return { statusCode: 401, body: 'Unauthorized: Invalid token' };
        }
        userEmail = user.email;
        console.log(`[get-submissions-list] Token valid for user: ${userEmail}`);

        // Comprobación de autorización
        if (!ALLOWED_ADMIN_EMAILS.includes(userEmail)) {
            console.warn(`[get-submissions-list] User ${userEmail} is NOT an authorized admin.`);
            return { statusCode: 403, body: 'Forbidden: User is not an administrator' };
        }
        console.log(`[get-submissions-list] User ${userEmail} IS an authorized admin.`);

    } catch (error) {
        console.error('[get-submissions-list] Unexpected error during auth check:', error);
        return { statusCode: 500, body: 'Internal Server Error during authentication' };
    }

    // --- 5. Obtener Datos de Supabase ---
    try {
        console.log(`[get-submissions-list] Fetching submissions from database...`);
        const { data, error } = await supabaseAdmin
            .from('submissions')
            .select('id, created_at, user_email, stage, estimated_valuation, is_complete') // Columnas necesarias
            .eq('is_complete', true) // Solo completadas
            .order('created_at', { ascending: false }); // Más recientes primero

        if (error) {
            console.error('[get-submissions-list] Supabase query error:', error.message);
            throw error; // Lanzar para el catch general
        }

        console.log(`[get-submissions-list] Successfully fetched ${data?.length || 0} submissions.`);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data || []),
        };

    } catch (error) {
        console.error('[get-submissions-list] Error fetching data from Supabase:', error.message);
        return { statusCode: 500, body: `Internal Server Error: ${error.message}` };
    }
};