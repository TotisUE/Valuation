// src/context/SupabaseProvider.jsx
import React, { createContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Crear el Contexto ---
// Esto crea un objeto Context que los componentes pueden usar para suscribirse.
// Le damos un valor inicial de 'undefined' para poder verificar si se está usando
// fuera de un Provider.
export const SupabaseContext = createContext(undefined);

// --- Crear el Componente Proveedor ---
// Este componente envolverá a nuestra aplicación (o partes de ella).
export const SupabaseProvider = ({ children }) => {
    // Estado para guardar la instancia del cliente Supabase
    const [supabase, setSupabase] = useState(null);
    // Estado para indicar si la inicialización está completa
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Este efecto se ejecuta una vez cuando el componente se monta
        console.log("SupabaseProvider: Initializing Supabase client...");

        // --- Obtener credenciales de las variables de entorno ---
        // Vite expone variables que empiezan con VITE_ a través de import.meta.env
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // Verificar que las variables estén definidas
        if (!supabaseUrl || !supabaseAnonKey) {
            console.error("SupabaseProvider: Supabase URL or Anon Key is missing in environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).");
            setLoading(false); // Terminar carga (con error)
            return; // Detener la inicialización
        }

        try {
            // --- Crear la instancia del cliente Supabase ---
            // Usamos la URL y la Clave ANÓNIMA (segura para el frontend)
            const client = createClient(supabaseUrl, supabaseAnonKey);
            setSupabase(client); // Guardar la instancia creada en el estado
            console.log("SupabaseProvider: Supabase client initialized successfully.");
        } catch (error) {
            console.error("SupabaseProvider: Error initializing Supabase client:", error);
        } finally {
            setLoading(false); // Marcar que la inicialización (o intento) terminó
        }

    // El array vacío [] asegura que el efecto se ejecute solo al montar
    }, []);

    // --- Renderizado del Proveedor ---
    // Mientras inicializa, podrías mostrar un mensaje de carga global
    if (loading) {
        return <div>Loading Supabase...</div>; // O un spinner, etc.
    }

    // Una vez inicializado (o fallido), renderiza el Context.Provider
    // El 'value' del provider es la instancia del cliente Supabase (o null si falló)
    // Cualquier componente hijo dentro de este Provider podrá acceder a este 'value'
    // usando useContext(SupabaseContext)
    return (
        <SupabaseContext.Provider value={supabase}>
            {children} {/* Renderiza los componentes hijos (en nuestro caso, será <App />) */}
        </SupabaseContext.Provider>
    );
};

// Nota: No exportamos 'useState' o 'useEffect' de aquí, solo el Context y el Provider.