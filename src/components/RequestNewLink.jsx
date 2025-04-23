// src/components/RequestNewLink.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Para volver al inicio
import { getFunctionsBaseUrl } from '../utils/urlHelpers'; // Importar helper

function RequestNewLink() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' }); // type: 'success' o 'error'

    const handleSubmit = async (event) => {
        event.preventDefault(); // Evitar recarga de página
        setIsLoading(true);
        setFeedback({ type: '', message: '' }); // Limpiar feedback anterior

        // Validación simple de email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
            setIsLoading(false);
            return;
        }

        const functionsBase = getFunctionsBaseUrl();
        const functionUrl = `${functionsBase}/.netlify/functions/request-new-link`;

        try {
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                 // Usar el mensaje del backend si existe, o uno genérico
                 throw new Error(result.error || 'Could not process request. Please try again.');
            }

            // Éxito (mostrar mensaje genérico del backend)
            setFeedback({ type: 'success', message: result.message });
            setEmail(''); // Limpiar input en éxito

        } catch (error) {
            console.error("Error requesting new link:", error);
            setFeedback({ type: 'error', message: error.message || 'An unexpected network error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="request-new-link-container" style={styles.container}>
            <h2>Request New Continuation Link</h2>
            <p>If you lost the email with your continuation link, enter the email address you originally used below. We'll send a new link if an incomplete assessment is found.</p>

            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                    <label htmlFor="email-request" style={styles.label}>Your Email Address:</label>
                    <input
                        type="email"
                        id="email-request"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        style={styles.input}
                        placeholder="Enter your email"
                    />
                </div>

                {feedback.message && (
                    <div style={{ ...styles.feedback, ...(feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess) }}>
                        {feedback.message}
                    </div>
                )}

                <button type="submit" disabled={isLoading} style={styles.button}>
                    {isLoading ? 'Sending...' : 'Send New Link'}
                </button>
            </form>

            <div style={styles.backLink}>
                <Link to="/">Back to Start</Link>
            </div>
        </div>
    );
}

// Estilos básicos (puedes moverlos a tu CSS)
const styles = {
    container: { maxWidth: '500px', margin: '2rem auto', padding: '2rem', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center' },
    form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    inputGroup: { textAlign: 'left' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' },
    input: { width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
    feedback: { padding: '0.8rem', borderRadius: '4px', marginTop: '1rem', marginBottom: '1rem' },
    feedbackSuccess: { backgroundColor: '#e6ffed', color: '#006400', border: '1px solid #b7ebc0' },
    feedbackError: { backgroundColor: '#fff0f0', color: '#d8000c', border: '1px solid #ffbaba' },
    button: { padding: '0.8rem 1.5rem', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem', backgroundColor: '#007bff', color: 'white' },
    backLink: { marginTop: '1.5rem' }
};


export default RequestNewLink;