// src/components/MultiStepForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ScoringAreas, initialScores } from '../scoringAreas';
import {
    sections, getQuestionsForStep, calculateMaxPossibleScore,
    getValuationParameters, qualitativeQuestions,
    calculateMaxScoreForArea
// Ya no se importa nada relacionado con NAICS options desde aquí
} from '../questions';
import Step from './Step';
import ProgressIndicator from './ProgressIndicator';
import Navigation from './Navigation';
import ResultsDisplay from './results/ResultsDisplay';

// --- Constantes ---
const TOTAL_STEPS = sections.length;
const LOCAL_STORAGE_KEY = 'valuationFormData';
const LOCAL_STORAGE_STEP_KEY = 'valuationFormStep';

// --- Leer VITE_NETLIFY_FUNCTIONS_BASE_URL ---
// Necesario para las llamadas a las funciones Netlify
const functionsBaseUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL || '';
if (!functionsBaseUrl && import.meta.env.MODE !== 'test') { // Evitar warning en tests
    console.warn("VITE_NETLIFY_FUNCTIONS_BASE_URL is not defined. API calls might fail.");
}

// --- Helper: calculateScores (Sin cambios) ---
function calculateScores(formData) { /* ... Tu código ... */ return {}; }

// --- Helper: generateImprovementRoadmap (Sin cambios) ---
function generateImprovementRoadmap(scores, stage) { /* ... Tu código ... */ return []; }

// --- Componente Principal ---
function MultiStepForm({ initialFormData, initialSubmissionId }) {

    // --- Estados ---
    const [currentStep, setCurrentStep] = useState(() => { /* ... Tu lógica con initialFormData ... */ return 0;});
    const [formData, setFormData] = useState(() => { /* ... Tu lógica con initialFormData y localStorage ... */ return {}; });
    const [submissionId, setSubmissionId] = useState(initialSubmissionId || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const [errors, setErrors] = useState({});
    // Estados para NAICS (Correctos)
    const [sectors, setSectors] = useState([]);
    const [subSectors, setSubSectors] = useState([]);
    const [isSubSectorsLoading, setIsSubSectorsLoading] = useState(false);

    // --- !! AÑADIR ESTADOS PARA handleSendContinuationLink !! ---
    const [isSendingLink, setIsSendingLink] = useState(false);
    const [sendLinkStatus, setSendLinkStatus] = useState({ message: '', error: false });
    // --- Fin Estados Añadidos ---


    // --- Effects ---
    // useEffects para localStorage (Correctos)
    useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData)); }, [formData]);
    useEffect(() => { if (!initialFormData) { /* ... guardar currentStep ... */ } }, [currentStep, initialFormData]);
    // useEffect para cargar Sectores (Correcto)
    useEffect(() => { /* ... fetchSectors ... */ }, []);
    // useEffect para cargar Subsectores (Correcto)
    useEffect(() => { /* ... loadSubSectors ... */ }, [formData.naicsSector, sectors]);


    // --- Handlers ---

    // handleChange (Modificado para resetear subsector - Correcto)
    const handleChange = useCallback((event) => { /* ... Tu lógica ... */ }, [errors]);

    // handleSubmit (Modificado para enviar ID - Correcto)
    const handleSubmit = useCallback(async () => { /* ... Tu lógica ... */ }, [formData, submissionId]);

    // handleNext (Correcto)
    const handleNext = useCallback(() => { /* ... Tu lógica ... */ }, [currentStep, formData, handleSubmit]);

    // handlePrevious (Correcto)
    const handlePrevious = useCallback(() => { /* ... Tu lógica ... */ }, [currentStep]);

    // handleStartOver (Correcto - incluye setSubmissionId(null))
    const handleStartOver = useCallback(() => { /* ... Tu lógica ... */ }, []);

    // handleBackToEdit (Correcto)
    const handleBackToEdit = useCallback(() => { /* ... Tu lógica ... */ }, []);


    // --- !!! AÑADIR LA DEFINICIÓN DE handleSendContinuationLink !!! ---
    const handleSendContinuationLink = useCallback(async () => {
        // Validar email
        if (!formData.userEmail) {
            setSendLinkStatus({ message: 'Please ensure the user email is filled before sending a link.', error: true });
            return;
        }
        // Evitar doble clic
        if (isSendingLink) return;

        setIsSendingLink(true);
        setSendLinkStatus({ message: 'Saving progress and sending link...', error: false });

        let currentIdToUse = submissionId; // Usar ID del estado si existe

        // Validar URL base
        if (!functionsBaseUrl) {
            console.error("VITE_NETLIFY_FUNCTIONS_BASE_URL is not defined!");
            setSendLinkStatus({ message: 'Error: Server configuration issue (URL missing).', error: true });
            setIsSendingLink(false);
            return;
         }

        try {
            // 1. Guardar progreso (siempre bueno para asegurar estado más reciente)
            console.log("Saving partial data before sending link...", formData);
            const saveFunctionUrl = `${functionsBaseUrl}/.netlify/functions/save-partial-assessment`;
            const saveResponse = await fetch(saveFunctionUrl, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ formData, userEmail: formData.userEmail }) // Enviar formData actual
             });
            const saveData = await saveResponse.json();
            if (!saveResponse.ok || !saveData.success) {
                throw new Error(saveData.error || 'Failed to save progress.');
            }
            // Usar el ID devuelto, sea nuevo o el actualizado
            currentIdToUse = saveData.submissionId;
            setSubmissionId(currentIdToUse); // Actualizar ID en estado local
            console.log(`Partial data saved/updated. Submission ID: ${currentIdToUse}`);

            // 2. Enviar el link usando el ID obtenido/confirmado
            if (!currentIdToUse) throw new Error("Could not determine submission ID.");
            console.log(`Requesting continuation link for submission ID: ${currentIdToUse}`);
            const sendLinkFunctionUrl = `${functionsBaseUrl}/.netlify/functions/send-continuation-link`;
            const sendLinkResponse = await fetch(sendLinkFunctionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId: currentIdToUse }) // Pasar el ID correcto
            });
            const sendLinkData = await sendLinkResponse.json();
            if (!sendLinkResponse.ok || !sendLinkData.success) {
                throw new Error(sendLinkData.error || 'Failed to send continuation link.');
            }
            setSendLinkStatus({ message: 'Continuation link sent successfully!', error: false });

        } catch (error) {
            console.error("handleSendContinuationLink Error:", error);
            setSendLinkStatus({ message: `Error: ${error.message}`, error: true });
        } finally {
            setIsSendingLink(false);
        }
    }, [formData, submissionId, isSendingLink]); // Dependencias correctas (setters de estado no son estrictamente necesarios en deps)
    // --- FIN DE LA FUNCIÓN handleSendContinuationLink ---


    // --- Get Questions and Title (Sin cambios) ---
    const currentQuestions = getQuestionsForStep(currentStep);
    const currentSectionTitle = sections[currentStep];


    // --- Conditional Rendering Logic (Sin cambios) ---
    if (submissionResult && submissionResult.success && calculationResult) {
        const userEmailFromFormData = formData?.userEmail; // Mantener esto aquí
        return ( <ResultsDisplay calculationResult={calculationResult} /* ... tus otras props ... */ /> );
    } else if (submissionResult && !submissionResult.success) {
        return ( <div className="submission-result error"><h2>Submission Error</h2><p>{submissionResult.message}</p>{/* ... botón ... */}</div>);
    }

    // --- Renderizado principal del formulario ---
    // Asegurándose que Navigation y la sección del botón Send Link usen las funciones/estados correctos
    return (
        <div className="multi-step-form">
            <ProgressIndicator currentStep={currentStep + 1} totalSteps={TOTAL_STEPS} sections={sections} />
            <form onSubmit={(e) => e.preventDefault()}>
                <Step
                    key={currentStep}
                    stepIndex={currentStep}
                    questions={currentQuestions}
                    formData={formData}
                    handleChange={handleChange}
                    sectionTitle={currentSectionTitle}
                    errors={errors}
                    dynamicOptions={{ sectors, subSectors }} // Correcto
                    isSubSectorsLoading={isSubSectorsLoading} // Correcto
                />
                <Navigation
                    currentStep={currentStep}
                    totalSteps={TOTAL_STEPS}
                    onPrevious={handlePrevious} // Correcto
                    onNext={handleNext}         // Correcto
                    isSubmitting={isSubmitting}   // Correcto
                />
                {/* Sección para Enviar Link */}
                {/* Asegúrate que esta sección exista si quieres el botón */}
                <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed #ccc', textAlign: 'center' }}>
                    <p>Need to pause? Send the seller a link to continue later:</p>
                    <button
                        type="button"
                        onClick={handleSendContinuationLink} // --- LLAMADA CORRECTA ---
                        disabled={isSendingLink || !formData.userEmail} // --- ESTADO CORRECTO ---
                        style={{ padding: '8px 15px', cursor: 'pointer' }}
                     >
                        {isSendingLink ? 'Sending...' : 'Send Continuation Link'} {/* --- ESTADO CORRECTO --- */}
                     </button>
                     {sendLinkStatus.message && ( // --- ESTADO CORRECTO ---
                        <p style={{ marginTop: '10px', color: sendLinkStatus.error ? 'red' : 'green', fontSize: '0.9em' }}>
                            {sendLinkStatus.message}
                        </p>
                     )}
                </div>
            </form>
        </div>
    );
} // Fin de MultiStepForm

export default MultiStepForm;