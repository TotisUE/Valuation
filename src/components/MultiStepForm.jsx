// src/components/MultiStepForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
// --- MODIFICACIÓN: Importar explícitamente questionsData y ScoringAreas si calculateScores los necesita ---
import { ScoringAreas, initialScores } from '../scoringAreas';
import {
    sections, getQuestionsForStep, calculateMaxPossibleScore,
    getValuationParameters, questionsData, // <<< Importar questionsData
    calculateMaxScoreForArea
// NO importar qualitativeQuestions
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
const functionsBaseUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL || '';
if (!functionsBaseUrl && import.meta.env.MODE !== 'test') {
    console.warn("MultiStepForm: VITE_NETLIFY_FUNCTIONS_BASE_URL not defined. API calls might fail.");
}

// --- Helper: calculateScores (MODIFICADO: Filtra internamente) ---
function calculateScores(formData) {
    const scores = initialScores ? { ...initialScores } : {};

    // Definir la lógica de filtro aquí (depende de ScoringAreas y questionsData)
    const isQualitative = (q) => q && q.scoringArea && typeof ScoringAreas === 'object' && Object.values(ScoringAreas).includes(q.scoringArea);
    const qualitativeQuestionsNow = Array.isArray(questionsData) ? questionsData.filter(isQualitative) : []; // Filtrar aquí

    if (!Array.isArray(qualitativeQuestionsNow)) {
        console.error("calculateScores: Could not filter qualitative questions.");
        return scores; // Devolver scores vacíos si falla el filtro
    }

    qualitativeQuestionsNow.forEach(question => { // Usar la variable filtrada localmente
        const answer = formData[question.valueKey];
        const area = question.scoringArea;
        if (answer && area && question.type === 'mcq' && scores.hasOwnProperty(area) && Array.isArray(question.options)) {
            const selectedOption = question.options.find(opt => opt.text === answer);
            if (selectedOption && typeof selectedOption.score === 'number') { scores[area] += selectedOption.score; }
            else if (selectedOption) { console.warn(`Score missing/invalid: QID ${question.id}, Ans "${answer}"`); }
        }
    });
    // console.log("Calculated Scores:", scores);
    return scores;
}


// --- Helper: generateImprovementRoadmap (Sin cambios necesarios aquí) ---
function generateImprovementRoadmap(scores, stage) {
    // ... (Tu código original está bien, ya usa calculateMaxScoreForArea que fue corregido) ...
    return []; // Placeholder si eliminaste el código original
}

// --- Componente Principal ---
// Eliminadas props initialFormData/initialSubmissionId para simplificar por ahora
function MultiStepForm() {

    // --- Estados ---
    const [currentStep, setCurrentStep] = useState(() => { /* ... Tu lógica localStorage ... */ return 0; });
    const [formData, setFormData] = useState(() => { /* ... Tu lógica localStorage ... */ return {}; });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const [errors, setErrors] = useState({});
    const [sectors, setSectors] = useState([]);
    const [subSectors, setSubSectors] = useState([]);
    const [isSubSectorsLoading, setIsSubSectorsLoading] = useState(false);


    // --- Effects (Sin cambios lógicos necesarios aquí) ---
    useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData)); }, [formData]);
    useEffect(() => { localStorage.setItem(LOCAL_STORAGE_STEP_KEY, currentStep.toString()); }, [currentStep]);
    useEffect(() => { /* ... fetchSectors ... */ }, []);
    useEffect(() => { /* ... loadSubSectors ... */ }, [formData.naicsSector, sectors]);


    // --- Handlers ---

    // handleChange (CON LOG Y RESET NAICS - CORRECTO)
    const handleChange = useCallback((event) => {
        console.log('handleChange -> Name:', event.target.name, 'Value:', event.target.value); // <<< MANTENER LOG
        const { name, value, type } = event.target;
        let resetData = {};
        if (name === 'naicsSector') {
            resetData.naicsSubSector = '';
            setSubSectors([]);
        }
        setFormData(prevData => ({
            ...prevData, ...resetData,
            [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value
        }));
        if (errors[name]) {
            setErrors(prevErrors => { const newErrors = { ...prevErrors }; delete newErrors[name]; return newErrors; });
        }
    }, [errors]); // Correcto

    // handleNext (CON LOGS - CORRECTO)
    const handleNext = useCallback(() => {
        console.log("handleNext called. Current Step:", currentStep);
        const questionsForThisStep = getQuestionsForStep(currentStep);
        const stepErrors = {};
        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        questionsForThisStep.forEach(question => {
             const value = formData[question.valueKey];
             let isEmpty = value == null || value === '' || (typeof value === 'number' && isNaN(value));
             if (question.valueKey === 'ebitdaAdjustments' && value === 0) { isEmpty = false; }
             if (question.required && isEmpty) { stepErrors[question.valueKey] = true; isValid = false; }
             else if (question.type === 'email' && value && !emailRegex.test(value)) { stepErrors[question.valueKey] = true; isValid = false; }
        });
        setErrors(stepErrors);
        console.log(`Step ${currentStep} Validation: isValid=${isValid}`, stepErrors);
        if (isValid) {
            if (currentStep < TOTAL_STEPS - 1) { setCurrentStep(prevStep => prevStep + 1); }
            else { handleSubmit(); }
        }
    }, [currentStep, formData, handleSubmit]);

    // handleSubmit (SIN CAMBIOS INTERNOS)
    const handleSubmit = useCallback(async () => {
        // ... (Tu lógica original para calcular y enviar a submit-valuation) ...
         console.log("Attempting Submission with Data: ", formData);
         setIsSubmitting(true);
         // ... resto de tu try/catch/finally ...
    }, [formData]); // Quitar submissionId de dependencias

    // handlePrevious (SIN CAMBIOS INTERNOS)
    const handlePrevious = useCallback(() => {
        if (currentStep > 0) {
            setErrors({});
            setCurrentStep(prevStep => prevStep - 1);
        }
    }, [currentStep]);

    // handleStartOver (SIN CAMBIOS INTERNOS)
    const handleStartOver = useCallback(() => { /* ... tu lógica ... */ }, []);

    // handleBackToEdit (SIN CAMBIOS INTERNOS)
    const handleBackToEdit = useCallback(() => { /* ... tu lógica ... */ }, []);


    // --- Get Questions and Title (Sin cambios) ---
    const currentQuestions = getQuestionsForStep(currentStep);
    const currentSectionTitle = sections[currentStep];


    // --- Conditional Rendering Logic (Sin cambios) ---
    if (submissionResult && submissionResult.success && calculationResult) {
        /* ... Render ResultsDisplay ... */
        return ( <ResultsDisplay calculationResult={calculationResult} /* ... */ /> );
    } else if (submissionResult && !submissionResult.success) {
        /* ... Render Submission Error ... */
         return ( <div className="submission-result error"> /* ... */ </div>);
    }

    // --- Renderizado principal del formulario ---
    return (
        <div className="multi-step-form">
            <ProgressIndicator currentStep={currentStep + 1} totalSteps={TOTAL_STEPS} sections={sections} />
            <form onSubmit={(e) => e.preventDefault()}>
                <Step
                    key={currentStep}
                    stepIndex={currentStep}
                    questions={currentQuestions}
                    formData={formData}
                    handleChange={handleChange} // <<< Pasar handleChange
                    sectionTitle={currentSectionTitle}
                    errors={errors}
                    dynamicOptions={{ sectors, subSectors }} // <<< Pasar Opciones NAICS
                    isSubSectorsLoading={isSubSectorsLoading} // <<< Pasar Estado Carga NAICS
                />
                <Navigation
                    currentStep={currentStep}
                    totalSteps={TOTAL_STEPS}
                    onPrevious={handlePrevious} // <<< Pasar handlePrevious
                    onNext={handleNext}         // <<< Pasar handleNext
                    isSubmitting={isSubmitting}   // <<< Pasar isSubmitting
                />
                 {/* Eliminada la sección del botón Send Link por simplicidad */}
            </form>
        </div>
    );
}

export default MultiStepForm;