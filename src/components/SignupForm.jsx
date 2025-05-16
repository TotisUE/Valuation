// src/components/SignupForm.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseContext } from '../context/SupabaseProvider'; // Asegúrate que la ruta sea correcta

function SignupForm() {
    const supabase = useContext(SupabaseContext);
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                  // Opcional: si quieres que Supabase envíe un email de confirmación
                  // y especifica a dónde redirigir después de que hagan clic en el enlace del email.
                  // emailRedirectTo: `${window.location.origin}/login`,
                }
            });

            if (signUpError) {
                throw signUpError;
            }

            // Si la confirmación de email está habilitada en Supabase,
            // data.session será null hasta que el usuario confirme.
            if (data.user && !data.session===null) {
                 setMessage("Signup successful! Please check your email to confirm your account.");
                 // Podrías limpiar los campos o deshabilitar el botón aquí
            } else if (data.user && data.session) {
                 // Si la confirmación no es necesaria o ya está logueado
                 setMessage("Signup successful! You are now logged in.");
                 // Decide a dónde navegar, por ejemplo, a la página principal o a un dashboard
                 navigate('/');
            } else if (!data.user && !data.session) {
                // Esto puede ocurrir si el usuario ya existe
                setError("Could not complete signup. The user may already exist or another issue occurred.");
            }

        } catch (error) {
            console.error("Signup error:", error.message);
            // Personaliza mensajes de error comunes de Supabase
            if (error.message.includes("User already registered")) {
                setError("This email is already registered. Please try logging in.");
            } else if (error.message.includes("Password should be at least 6 characters")) {
                setError("Password should be at least 6 characters long.");
            } else {
                setError(`Signup failed: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container" style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Create Account</h2>
            <form onSubmit={handleSignup}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="signup-email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
                    <input
                        type="email"
                        id="signup-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        placeholder="you@example.com"
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="signup-password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
                    <input
                        type="password"
                        id="signup-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength="6" // Supabase requiere 6 caracteres por defecto
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        placeholder="At least 6 characters"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
                <p style={{ marginTop: '15px', textAlign: 'center' }}>
                    Already have an account? <a href="/login">Login here</a>
                </p>
            </form>
        </div>
    );
}

export default SignupForm;

