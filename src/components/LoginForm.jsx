// src/components/LoginForm.jsx
import React, { useState } from 'react'; // No necesitamos useContext aquí para el bypass
import { useNavigate } from 'react-router-dom';
// No necesitamos SupabaseContext aquí si el bypass siempre está activo
// import { SupabaseContext } from '../context/SupabaseProvider';

// --- ¡¡¡VARIABLE DE BYPASS SOLO PARA DESARROLLO!!! ---
const DEV_BYPASS_LOGIN = true; // ASEGÚRATE QUE ESTÉ EN TRUE
// ----------------------------------------------------

function LoginForm() {
    // const supabase = useContext(SupabaseContext); // No necesario para bypass
    const navigate = useNavigate();
    // Pre-llenar los campos si el bypass está activo
    const [email, setEmail] = useState(DEV_BYPASS_LOGIN ? 'bypass@dev.com' : '');
    const [password, setPassword] = useState(DEV_BYPASS_LOGIN ? 'bypass' : '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // No debería haber errores con el bypass

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        if (DEV_BYPASS_LOGIN) {
            console.warn("LoginForm: !!! DEVELOPMENT LOGIN BYPASS ENABLED !!!");
            await new Promise(resolve => setTimeout(resolve, 300)); // Simular carga
            
            console.log("Bypass Login successful! Setting localStorage item and navigating to /");
            localStorage.setItem('devBypassUserLoggedIn', 'true'); // ESTO ES CLAVE

            navigate('/');
            setLoading(false);
            return;
        }
        
        // Lógica de login real (no se ejecutará si DEV_BYPASS_LOGIN es true)
        // Si necesitaras login real, esta parte se activaría poniendo DEV_BYPASS_LOGIN = false
        // y necesitarías el SupabaseContext y la llamada a supabase.auth.signInWithPassword()
        console.error("LoginForm: Real login logic executed, but DEV_BYPASS_LOGIN is expected to be true for this setup.");
        setError("Bypass is off. Real login not fully implemented in this bypass-focused version.");
        setLoading(false);
    };

    return (
        <div className="login-container" style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Login (Dev Bypass Mode)</h2>
            {DEV_BYPASS_LOGIN && <p style={{color: 'orange', fontWeight: 'bold'}}>DEVELOPMENT BYPASS ACTIVE</p>}
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="login-email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
                    <input
                        type="email"
                        id="login-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="login-password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
                    <input
                        type="password"
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {loading ? 'Logging in...' : 'Login (Bypass)'}
                </button>
                {/* No deberíamos ver errores de login de Supabase en modo bypass */}
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                {/* Puedes quitar el enlace de Signup si no lo vas a usar en modo bypass */}
                <p style={{ marginTop: '15px', textAlign: 'center' }}>
                     <a href="/signup">Sign up here (if needed)</a>
                </p>
            </form>
        </div>
    );
}

export default LoginForm;


