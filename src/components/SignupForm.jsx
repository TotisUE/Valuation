// src/components/SignupForm.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseContext } from '../context/SupabaseProvider'; // Asegúrate que la ruta sea correcta

function SignupForm() {
    const supabase = useContext(SupabaseContext); // Obtener supabase del contexto
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Es buena práctica tener confirmación de contraseña en el UI
    const [confirmPassword, setConfirmPassword] = useState(''); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    const handleSignup = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setMessage('');

        if (!supabase) {
            setError("Supabase client is not available. Please try again later.");
            setLoading(false);
            return;
        }

        // Validación de UI para confirmación de contraseña
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        // Supabase por defecto ya valida longitud mínima de contraseña (6 caracteres).
        // Si quieres una validación más compleja en el frontend, puedes añadirla aquí.

        try {
const { data, error: signUpError } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      // Esta URL debe estar en tu lista de "Additional Redirect URLs" en Supabase
      // Puedes hacerla dinámica para que funcione tanto en local como en producción:
      emailRedirectTo: `${window.location.origin}/login`, // o '/assessment', o '/'
    }
});

            if (signUpError) {
                throw signUpError; // Lanza el error para que el bloque catch lo maneje
            }

            // La estructura de 'data' después de signUp es { user, session }
            // user: El objeto del usuario creado.
            // session: Será null si la confirmación de email está habilitada y el usuario aún no ha confirmado.
            //          Tendrá valor si la confirmación está deshabilitada O si el usuario se registra y la auto-confirmación está activa (menos común).

            if (data.user && data.session === null) {
                 // Este es el caso más común con la confirmación de email habilitada
                 setMessage("Signup successful! Please check your email to confirm your account. The link will be valid for a limited time.");
                 // Opcional: Limpiar campos o deshabilitar el formulario
                 setEmail('');
                 setPassword('');
                 setConfirmPassword('');
            } else if (data.user && data.session) {
                 // Esto ocurre si la confirmación de email está DESHABILITADA en Supabase
                 // o si por alguna razón Supabase considera al usuario ya confirmado y logueado.
                 setMessage("Signup successful! You are now logged in.");
                 navigate('/'); // Redirige a la página principal o dashboard
            } else if (!data.user && !data.session && !signUpError) {
                 // Este caso es menos común si no hubo error.
                 // Podría ser que signUp no devolvió un usuario (ej., si la cuenta ya existe y la confirmación está desactivada, no se reloguea).
                 // El error de "User already registered" debería ser capturado por signUpError.
                 setError("Could not complete signup. Please check if you already have an account or try again.");
            }
            // Si `data.user` es null y `signUpError` también es null, es una situación ambigua.
            // Supabase suele devolver un error si el usuario ya existe.

        } catch (error) {
            console.error("Detailed signup error:", error);
            if (error.message.includes("User already registered") || (error.status === 400 && error.message.includes("already exists"))) {
                setError("This email is already registered. Please try logging in or use a different email.");
            } else if (error.message.includes("Password should be at least 6 characters")) {
                setError("Password should be at least 6 characters long.");
            } else if (error.message.includes("To signup, please provide your email")) { // Ejemplo de otro error común
                setError("Please provide a valid email address.");
            }
            else {
                setError(`Signup failed: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container" style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{textAlign: 'center', marginBottom: '20px'}}>Create Your Account</h2>
            <form onSubmit={handleSignup}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="signup-email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                    <input
                        type="email"
                        id="signup-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }}
                        placeholder="you@example.com"
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="signup-password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
                    <input
                        type="password"
                        id="signup-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength="6"
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }}
                        placeholder="At least 6 characters"
                    />
                </div>
                {/* Campo de Confirmar Contraseña */}
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="signup-confirm-password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Confirm Password:</label>
                    <input
                        type="password"
                        id="signup-confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength="6"
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }}
                        placeholder="Re-enter your password"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                >
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
                {error && <p style={{ color: 'red', marginTop: '15px', textAlign: 'center' }}>{error}</p>}
                {message && <p style={{ color: 'green', marginTop: '15px', textAlign: 'center' }}>{message}</p>}
                <p style={{ marginTop: '20px', textAlign: 'center' }}>
                    Already have an account? <a href="/login" style={{color: '#007bff', textDecoration: 'none'}}>Login here</a>
                </p>
            </form>
        </div>
    );
}

export default SignupForm;