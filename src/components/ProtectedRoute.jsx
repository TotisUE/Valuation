// src/components/ProtectedRoute.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
// Asegúrate que la ruta a tu contexto Supabase sea correcta
import { SupabaseContext } from '../context/SupabaseProvider';

// Este componente envuelve a otros componentes (sus "children")
// y solo los muestra si el usuario está autenticado.
// Si no, redirige a la página de login.
function ProtectedRoute({ children }) {
    const supabase = useContext(SupabaseContext);
    // Estado para saber si ya se verificó la sesión inicial
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    // Estado para guardar la sesión actual del usuario (o null si no hay)
    const [session, setSession] = useState(null);

    useEffect(() => {
        // --- Función para verificar la sesión actual ---
        const checkSession = async () => {
            if (!supabase) return; // Salir si supabase no está listo

            console.log("ProtectedRoute: Checking initial session...");
            // Intenta obtener la sesión actual (puede estar en localStorage)
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession); // Guarda la sesión (o null) en el estado
            setIsLoadingSession(false); // Marca que la verificación inicial terminó
            console.log("ProtectedRoute: Initial session check complete. Session:", currentSession ? 'Exists' : 'Null');
        };

        checkSession(); // Llama a la función al montar el componente

        // --- Escuchar Cambios de Autenticación ---
        // Esto es importante si el usuario inicia/cierra sesión en otra pestaña
        console.log("ProtectedRoute: Setting up auth state change listener...");
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log(`ProtectedRoute: Auth state changed. New session:`, session ? 'Exists' : 'Null');
            setSession(session); // Actualiza el estado de la sesión
            // Podríamos querer volver a poner isLoadingSession a true brevemente aquí,
            // pero para simplificar, asumimos que el cambio es rápido.
             if (isLoadingSession) {
                 setIsLoadingSession(false); // Asegurarse de quitar el loading si aún estaba
             }
        });

        // --- Limpieza al Desmontar ---
        // Es importante desuscribirse del listener cuando el componente se quita
        return () => {
            if (authListener?.subscription) {
                 console.log("ProtectedRoute: Unsubscribing from auth state changes.");
                 authListener.subscription.unsubscribe();
            }
        };
        // Ejecutar este efecto solo una vez al montar (y limpiar al desmontar)
    }, [supabase, isLoadingSession]); // Dependencias del efecto


    // --- Lógica de Renderizado Condicional ---

    // 1. Mientras se verifica la sesión inicial, mostrar un mensaje de carga
    if (isLoadingSession) {
        console.log("ProtectedRoute: Rendering loading state...");
        return <div>Loading authentication status...</div>; // O un spinner, etc.
    }

    // 2. Si la carga terminó y HAY sesión, renderizar el componente hijo
    if (!isLoadingSession && session) {
        console.log("ProtectedRoute: Rendering children (authenticated).");
        return children; // 'children' es el componente que envolvimos (ej. <AdminSubmissionsPage />)
    }

    // 3. Si la carga terminó y NO hay sesión, redirigir a la página de login
    if (!isLoadingSession && !session) {
        console.log("ProtectedRoute: Redirecting to /login (unauthenticated).");
        // Usa el componente Navigate de react-router-dom para redirigir
        // 'replace' evita que la página protegida quede en el historial del navegador
        return <Navigate to="/login" replace />;
    }

     // Como fallback (no debería llegar aquí si la lógica anterior es correcta)
     return null;
}

export default ProtectedRoute;