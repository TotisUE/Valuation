// src/components/AssessmentContinuation.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import MultiStepForm from './MultiStepForm';
import { getFunctionsBaseUrl } from '../utils/urlHelpers';


function AssessmentContinuation() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assessmentData, setAssessmentData] = useState(null);
    const [isValidToken, setIsValidToken] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Continuation token is missing from the URL.');
            setIsLoading(false);
            return;
        }

        const verifyAndFetchData = async () => {
            setIsLoading(true);
            setError(null);
            setAssessmentData(null);
            setIsValidToken(false);

            // Obtiene la base: http://localhost:8888 en DEV, '' en PROD
            const functionsBase = getFunctionsBaseUrl();
            // Define el path común de las funciones
            const functionsPath = '/.netlify/functions';

            try {
                // --- Paso A: Verificar el token ---
                // Construye la URL completa CORRECTAMENTE
                const verifyUrl = `${functionsBase}${functionsPath}/verify-continuation-token?token=${token}`;
                console.log(`AssessmentContinuation: Verifying token...`);
                console.log(`AssessmentContinuation: Attempting to fetch: ${verifyUrl}`); // Log con la URL correcta
                const verifyResponse = await fetch(verifyUrl); // Usa la URL construida

                // ---> Añadimos manejo de errores de RED antes de .json() <---
                if (!verifyResponse.ok) {
                     // Intenta leer el cuerpo como texto para ver el error HTML si lo hay
                     const errorText = await verifyResponse.text();
                     console.error(`Network response was not ok (${verifyResponse.status}): ${errorText.substring(0, 100)}...`); // Loguea parte del error
                     throw new Error(`Token verification request failed with status ${verifyResponse.status}.`);
                }
                // ---> FIN manejo de errores <---

                const verifyResult = await verifyResponse.json(); // Ahora sí esperamos JSON

                if (!verifyResult.success || !verifyResult.valid) { // Asumiendo que tu func devuelve success:true
                    console.error("Token verification logic failed:", verifyResult);
                    throw new Error(verifyResult.error || 'Invalid or expired token.');
                }

                const assessmentId = verifyResult.assessment_id;
                console.log(`AssessmentContinuation: Token valid for assessment ID: ${assessmentId}`);
                setIsValidToken(true);

                // --- Paso B: Obtener los datos de la valoración ---
                const dataUrl = `${functionsBase}${functionsPath}/get-assessment-data?id=${assessmentId}`; // Construye URL completa
                console.log(`AssessmentContinuation: Fetching data for assessment ID: ${assessmentId}`);
                console.log(`AssessmentContinuation: Fetching data from: ${dataUrl}`);
                const dataResponse = await fetch(dataUrl);

                // ---> Añadimos manejo de errores de RED <---
                if (!dataResponse.ok) {
                    const errorText = await dataResponse.text();
                    console.error(`Network response was not ok (${dataResponse.status}): ${errorText.substring(0, 100)}...`);
                    throw new Error(`Get assessment data request failed with status ${dataResponse.status}.`);
                }
                // ---> FIN manejo de errores <---

                const dataResult = await dataResponse.json();

                if (!dataResult.success) { // Asumiendo que tu func devuelve success:true
                    console.error("Failed to fetch assessment data:", dataResult);
                    throw new Error(dataResult.error || 'Could not retrieve assessment data.');
                }

                console.log(`AssessmentContinuation: Assessment data fetched successfully.`);
                setAssessmentData(dataResult.data || {});

            } catch (err) {
                console.error("Error during assessment continuation:", err);
                // Si el error es de SyntaxError por intentar parsear HTML, el log adicional de !response.ok debería dar más info
                setError(err.message || 'An unexpected error occurred.');
                setIsValidToken(false);
            } finally {
                setIsLoading(false);
            }
        };

        verifyAndFetchData();

    }, [token]);
    console.log(`AssessmentContinuation: Checking render conditions - isLoading: ${isLoading}, error: ${error}, isValidToken: ${isValidToken}, assessmentData:`, assessmentData);
    // --- Renderizado Condicional (Sin cambios) ---
    if (isLoading) {        console.log("AssessmentContinuation: Rendering Loading State");
        return (
            <div>
                <h2>Loading Assessment...</h2>
                <p>Verifying your continuation link. Please wait.</p>
            </div>
        );
    }
    if (error) {console.log("AssessmentContinuation: Rendering Error State");
        return (
            <div>
                <h2>Error Loading Assessment</h2>
                <p>Could not load your assessment. Reason: {error}</p>
                <p>Please check the link or contact support.</p>
            </div>
        );
    }
    if (assessmentData) {
        console.log("AssessmentContinuation: Rendering MultiStepForm with initial data:", assessmentData);
       // ¡IMPORTANTE! Aún necesitamos modificar MultiStepForm (Paso 5)
       return <MultiStepForm initialFormData={assessmentData} />;
   }

   // Si llegamos aquí, algo salió mal O el token era inválido desde el principio
   // (aunque el caso de token inválido debería haber establecido 'error')
   console.warn("AssessmentContinuation: Reached final fallback state (redirecting).");
   // Podrías mostrar un mensaje más específico aquí si 'isValidToken' es false pero no hay 'error'
   // if (!isValidToken && !error) {
   //    return <div><h2>Invalid Link</h2><p>The continuation link appears to be invalid.</p></div>
   // }
   return <Navigate to="/" replace />; // Redirigir como fallback seguro
}

export default AssessmentContinuation;