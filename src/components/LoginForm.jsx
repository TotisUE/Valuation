// src/components/LoginForm.jsx
import React, { useState, useContext } from 'react'; // useContext ahora es necesario
import { useNavigate } from 'react-router-dom';
import { SupabaseContext } from '../context/SupabaseProvider'; // Asegúrate que la ruta sea correcta

// --- DESHABILITAR O ELIMINAR LA VARIABLE DE BYPASS ---
const DEV_BYPASS_LOGIN = false; // Poner a false para login real
// ----------------------------------------------------

function LoginForm() {
    const supabase = useContext(SupabaseContext); // Usar el contexto para obtener supabase
    const navigate = useNavigate();
    
    // Ya no pre-llenar los campos si el bypass está desactivado
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); // Para mensajes de éxito o informativos

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setMessage('');

        if (DEV_BYPASS_LOGIN) { // Esta rama ya no se ejecutará si DEV_BYPASS_LOGIN es false
            console.warn("LoginForm: !!! DEVELOPMENT LOGIN BYPASS STILL ACTIVE (SHOULD BE FALSE) !!!");
            // ... (lógica de bypass que se puede eliminar si ya no se necesita) ...
            setLoading(false);
            return;
        }

        // --- LÓGICA DE LOGIN REAL CON SUPABASE ---
        if (!supabase) {
            setError("Supabase client is not available. Please try again later.");
            setLoading(false);
            return;
        }

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (signInError) {
                throw signInError; // Lanza el error para que el bloque catch lo maneje
            }

            // Si el inicio de sesión es exitoso, data.user y data.session tendrán valores.
            if (data.user && data.session) {
                setMessage("Login successful! Redirecting...");
                console.log("Login successful, user:", data.user);
                
                // Tu SupabaseProvider o AuthContext debería detectar este cambio de sesión
                // y actualizar el estado global del usuario.
                // La redirección puede ocurrir debido a rutas protegidas que ahora permiten el acceso,
                // o puedes navegar explícitamente.
                navigate('/'); // Redirigir a la página principal o dashboard
                // O a la ruta desde la que el usuario intentó acceder si usas `location.state` de React Router
            } else {
                // Este caso es menos común si signInWithPassword no da error pero no devuelve user/session.
                // Podría ser si el usuario necesita confirmar su email y aún no lo ha hecho.
                // Aunque signInWithPassword debería dar un error específico para "Email not confirmed".
                setError("Login failed. Please check your credentials. If you recently signed up, ensure your email is confirmed.");
            }

        } catch (error) {
            console.error("Login error:", error);
            if (error.message.includes("Invalid login credentials")) {
                setError("Invalid email or password. Please try again.");
            } else if (error.message.includes("Email not confirmed")) {
                setError("Please confirm your email address before logging in. Check your inbox for a confirmation link.");
            } else {
                setError(`Login failed: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{textAlign: 'center', marginBottom: '20px'}}>Login to Your Account</h2>
            {DEV_BYPASS_LOGIN && <p style={{color: 'orange', fontWeight: 'bold', textAlign: 'center'}}>DEVELOPMENT BYPASS ACTIVE</p>}
            
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="login-email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                    <input
                        type="email"
                        id="login-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required // Hacerlo requerido para login real
                        disabled={loading || DEV_BYPASS_LOGIN} // Deshabilitar si el bypass estuviera activo
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }}
                        placeholder="you@example.com"
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="login-password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
                    <input
                        type="password"
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required // Hacerlo requerido para login real
                        disabled={loading || DEV_BYPASS_LOGIN} // Deshabilitar si el bypass estuviera activo
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }}
                        placeholder="Your password"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || DEV_BYPASS_LOGIN} // Deshabilitar si el bypass estuviera activo
                    style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                {error && <p style={{ color: 'red', marginTop: '15px', textAlign: 'center' }}>{error}</p>}
                {message && <p style={{ color: 'green', marginTop: '15px', textAlign: 'center' }}>{message}</p>}
                
                {/* Enlaces útiles */}
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p>
                        Don't have an account? <a href="/signup" style={{color: '#007bff', textDecoration: 'none'}}>Sign up here</a>
                    </p>
                    {/* Podrías añadir un enlace de "Forgot Password?" aquí más adelante */}
                    {/* <p>
                        <a href="/forgot-password" style={{color: '#007bff', textDecoration: 'none', fontSize: '0.9em'}}>Forgot your password?</a>
                    </p> */}
                </div>
            </form>
        </div>
    );
}

export default LoginForm;