// src/components/AdminLogin.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
// Asegúrate que la ruta a tu contexto Supabase sea correcta
import { SupabaseContext } from '../context/SupabaseProvider';

function AdminLogin() {
    // --- Hooks y Contexto ---
    // Obtener el cliente Supabase del contexto (el configurado en main.jsx)
    const supabase = useContext(SupabaseContext);
    // Hook para navegar a otras rutas después del login
    const navigate = useNavigate();
    // Estados locales para manejar los inputs, el estado de carga y los errores
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Función para Manejar el Envío del Formulario ---
    const handleLogin = async (event) => {
        event.preventDefault(); // Evitar que la página se recargue
        setLoading(true);      // Indicar que estamos procesando
        setError(null);        // Limpiar errores anteriores

        // Verificar que el cliente Supabase esté disponible
        if (!supabase) {
            setError("Supabase client is not available. Check SupabaseProvider.");
            setLoading(false);
            return;
        }

        try {
            // --- Llamada a Supabase Auth para iniciar sesión ---
            console.log(`Attempting login for ${email}...`);
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email,       // El email ingresado
                password: password, // La contraseña ingresada
            });

            // Si Supabase devuelve un error al intentar iniciar sesión
            if (signInError) {
                throw signInError; // Lanza el error para que lo capture el catch
            }

            // Si no hubo error, el inicio de sesión fue exitoso
            console.log("Login successful!");
            // Redirigir al usuario a la página principal del panel de admin
            // Nota: La protección REAL de esa página se hace con ProtectedRoute
            navigate('/admin/submissions');

        } catch (error) {
            // Capturar errores (ya sea de Supabase o de la red)
            console.error("Login error:", error.message);
            setError(`Login failed: ${error.message}`); // Mostrar mensaje de error al usuario
        } finally {
            // Esto se ejecuta siempre, haya habido error o no
            setLoading(false); // Dejar de mostrar el estado de carga
        }
    };

    // --- Renderizado del Componente (JSX) ---
    return (
        <div className="admin-login-container"> {/* Puedes añadir estilos CSS */}
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label htmlFor="admin-email">Email:</label>
                    <input
                        type="email"
                        id="admin-email" // Usar id único
                        value={email}
                        // Actualizar el estado 'email' cuando el usuario escribe
                        onChange={(e) => setEmail(e.target.value)}
                        required // Campo obligatorio
                        disabled={loading} // Deshabilitar mientras carga
                        placeholder="admin@example.com"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="admin-password">Password:</label>
                    <input
                        type="password"
                        id="admin-password" // Usar id único
                        value={password}
                        // Actualizar el estado 'password' cuando el usuario escribe
                        onChange={(e) => setPassword(e.target.value)}
                        required // Campo obligatorio
                        disabled={loading} // Deshabilitar mientras carga
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {/* Cambiar texto del botón si está cargando */}
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                {/* Mostrar mensaje de error si existe */}
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
}

export default AdminLogin;