// src/components/MultiStepForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ScoringAreas, initialScores } from '../scoringAreas';
import {
    sections, getQuestionsForStep, calculateMaxPossibleScore,
    getValuationParameters, qualitativeQuestions,
    calculateMaxScoreForArea
// No se importa nada de NAICS desde questions.js
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
// Necesario para la llamada a submit-valuation
const functionsBaseUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL || '';
if (!functionsBaseUrl && import.meta.env.MODE !== 'test') {
    console.warn("MultiStepForm: VITE_NETLIFY_FUNCTIONS_BASE_URL not defined. API calls might fail.");
}

// --- Helper: calculateScores (Tu código original) ---
function calculateScores(formData) {
    const scores = initialScores ? { ...initialScores } : {};
    if (!Array.isArray(qualitativeQuestions)) {
        console.error("qualitativeQuestions is not an array or is undefined.");
        return scores;
    }
    qualitativeQuestions.forEach(question => {
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

// --- Helper: generateImprovementRoadmap (Tu código original) ---
function generateImprovementRoadmap(scores, stage) {
    console.log("Generating roadmap for stage:", stage); // Log útil
    const roadmapItems = [];
    const numberOfAreasToShow = 3;
    const stageToUrlMap = {
        "Pre-Revenue / Negative EBITDA": 'https://www.acquisition.com/training/improvise', "Startup": 'https://www.acquisition.com/training/monetize',
        "Mature Start-up": 'https://www.acquisition.com/training/stabilize', "Grow-up": 'https://www.acquisition.com/training/prioritize',
        "Mature Grow-up": 'https://www.acquisition.com/training/productize', "Scale Up": 'https://www.acquisition.com/training/optimize',
        "Mature Scaleup": 'https://www.acquisition.com/training/specialize',
    };
    const fallbackUrl = 'https://www.acquisition.com/training/stabilize';
    const targetUrl = stageToUrlMap[stage] || fallbackUrl;
    const roadmapContent = { /* ... Tu contenido completo ... */
        [ScoringAreas.SYSTEMS]: { title: "Strengthen Execution Systems", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 20 },
        [ScoringAreas.WORKFORCE]: { title: "Develop Workforce & Leadership", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 20 },
        [ScoringAreas.MARKET]: { title: "Solidify Robust Market Position", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 25 },
        [ScoringAreas.PROFITABILITY]: { title: "Enhance Profitability Metrics", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 20 },
        [ScoringAreas.MARKETING]: { title: "Build Marketing & Brand Equity", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 20 },
        [ScoringAreas.OFFERING]: { title: "Achieve Offering Excellence", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 20 },
        [ScoringAreas.EXPANSION]: { title: "Develop Expansion Capability", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 20 }
    };

    if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0) { return []; }
    const sortedScores = Object.entries(scores)
        .filter(([areaKey]) => Object.values(ScoringAreas).includes(areaKey) && roadmapContent[areaKey])
        .sort(([, scoreA], [, scoreB]) => (scoreA || 0) - (scoreB || 0));
    const areasToImprove = sortedScores.slice(0, numberOfAreasToShow);

    areasToImprove.forEach(([areaKey, areaScore]) => {
        const content = roadmapContent[areaKey];
        if (content) {
            const maxScoreForArea = calculateMaxScoreForArea(areaKey);
            const linkText = `-> Watch the "${stage}" section on Acquisition.com for guidance on ${content.title}`;
            roadmapItems.push({
                areaName: areaKey, title: content.title, areaScore: areaScore || 0,
                maxScore: maxScoreForArea, rationale: content.rationale,
                actionSteps: content.actionSteps, linkText: linkText, linkUrl: targetUrl
            });
        }
    });
    // console.log("Generated roadmap items:", roadmapItems);
    return roadmapItems;
}

// --- Componente Principal ---
// Removidas props initialFormData, initialSubmissionId por ahora
function MultiStepForm() {

    // --- Estados ---
    const [currentStep, setCurrentStep] = useState(() => {
        const savedStep = localStorage.getItem(LOCAL_STORAGE_STEP_KEY);
        const initialStep = savedStep ? parseInt(savedStep, 10) : 0;
        return !isNaN(initialStep) && initialStep >= 0 && initialStep < TOTAL_STEPS ? initialStep : 0;
    });

    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        let baseData = {};
        const defaultStructure = { currentRevenue: null, grossProfit: null, ebitda: null, ebitdaAdjustments: 0, userEmail: '', naicsSector: '', naicsSubSector: '' };
        if (savedData) {
            try {
                baseData = JSON.parse(savedData);
                if (typeof baseData !== 'object' || baseData === null) { baseData = {}; }
            } catch (error) {
                console.error("Failed to parse formData from localStorage.", error); baseData = {};
                try { localStorage.removeItem(LOCAL_STORAGE_KEY); } catch (e) {/**/}
            }
        }
        return { ...defaultStructure, ...baseData };
    });

    // Estados estándar
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const [errors, setErrors] = useState({});

    // Estados para NAICS (Necesarios para la carga dinámica)
    const [sectors, setSectors] = useState([]);
    const [subSectors, setSubSectors] = useState([]);
    const [isSubSectorsLoading, setIsSubSectorsLoading] = useState(false);


    // --- Effects ---
    // Guardar formData en localStorage
    useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData)); }, [formData]);
    // Guardar currentStep en localStorage
    useEffect(() => {
        if(currentStep >= 0 && currentStep < TOTAL_STEPS) {
           localStorage.setItem(LOCAL_STORAGE_STEP_KEY, currentStep.toString());
        }
     }, [currentStep]);

    // Cargar Sectores NAICS
    useEffect(() => {
        const fetchSectors = async () => {
            try {
                const response = await fetch('/naics-data/sectors.json');
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                const data = await response.json();
                if (Array.isArray(data)) { setSectors(data); }
                else { console.error("Sectors data not an array"); setSectors([]); }
            } catch (error) { console.error("Error fetching sectors:", error); setSectors([]); }
        };
        fetchSectors();
    }, []);

    // Cargar Subsectores NAICS
    useEffect(() => {
        const loadSubSectors = async (selectedSectorName) => {
            if (!selectedSectorName || sectors.length === 0) { setSubSectors([]); return; }
            const selectedSector = sectors.find(s => s.name === selectedSectorName);
            if (!selectedSector || !selectedSector.subSectorFile) {
                console.warn(`No subSectorFile for: "${selectedSectorName}"`);
                setSubSectors([]); setIsSubSectorsLoading(false); return;
            }
            setIsSubSectorsLoading(true); setSubSectors([]);
            const subSectorFilePath = `/naics-data/${selectedSector.subSectorFile}`;
            try {
                const response = await fetch(subSectorFilePath);
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                const data = await response.json();
                if (Array.isArray(data)) { setSubSectors(data); }
                else { console.error("Sub-sectors data not an array"); setSubSectors([]); }
            } catch (error) { console.error(`Error fetching sub-sectors ${subSectorFilePath}:`, error); setSubSectors([]); }
            finally { setIsSubSectorsLoading(false); }
        };
        loadSubSectors(formData.naicsSector);
    }, [formData.naicsSector, sectors]);


    // --- Handlers ---

    // --- handleChange (Restaurado a la versión original TUYA, pero con el reset de subsector) ---
     const handleChange = useCallback((event) => {
        // --- CONSOLE LOG PARA DEPURAR ---
        console.log('handleChange -> Name:', event.target.name, 'Value:', event.target.value);
        // --- FIN CONSOLE LOG ---

        const { name, value, type } = event.target;
        let resetData = {};

        // Lógica de reset NAICS (IMPORTANTE MANTENER)
        if (name === 'naicsSector') {
            resetData.naicsSubSector = '';
            setSubSectors([]); // Limpiar opciones
        }

        setFormData(prevData => {
            const newData = {
                ...prevData,
                ...resetData,
                [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value
            };
             // console.log('New formData state:', newData); // Descomentar si es necesario
            return newData;
        });

        // Limpiar error específico si existe
        if (errors[name]) {
             console.log(`Clearing error for ${name}`);
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]); // Solo 'errors' como dependencia si no llamas a otros setters directamente


    // --- handleNext (Restaurado a TU versión original, SIN cambios aquí) ---
    const handleNext = useCallback(() => {
        console.log("handleNext called. Current Step:", currentStep); // Log útil
        const questionsForThisStep = getQuestionsForStep(currentStep);
        const stepErrors = {};
        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        questionsForThisStep.forEach(question => {
            const value = formData[question.valueKey];
             let isEmpty = value == null || value === '' || (typeof value === 'number' && isNaN(value));
             // Ajuste para que 0 en addbacks (no requerido) no cuente como vacío
             if (question.valueKey === 'ebitdaAdjustments' && value === 0) { isEmpty = false; }

            if (question.required && isEmpty) {
                stepErrors[question.valueKey] = true; isValid = false;
            } else if (question.type === 'email' && value && !emailRegex.test(value)) { // Validar formato email si tiene valor
                 stepErrors[question.valueKey] = true; isValid = false;
            }
        });

        setErrors(stepErrors); // Actualizar errores
        console.log(`Step ${currentStep} Validation: isValid=${isValid}`, stepErrors);

        if (isValid) {
            if (currentStep < TOTAL_STEPS - 1) {
                setCurrentStep(prevStep => prevStep + 1);
                // Considera NO limpiar errores aquí (setErrors({})) por si el usuario vuelve atrás
            } else {
                handleSubmit(); // Llama a handleSubmit
            }
        }
    }, [currentStep, formData, handleSubmit]); // Dependencias correctas

    // --- handleSubmit (Restaurado a TU versión original, SIN cambios aquí) ---
    const handleSubmit = useCallback(async () => {
        console.log("Attempting Submission with Data: ", formData);
        setIsSubmitting(true);
        setSubmissionResult(null);
        setCalculationResult(null);
        setErrors({}); // Limpiar errores al intentar enviar
        let localCalcResult = null;
        try {
            // Validaciones (las tuyas originales)
            const requiredFinancials = ['currentRevenue', 'ebitda'];
            const missingFinancials = requiredFinancials.filter(key => formData[key] == null || isNaN(formData[key]));
            if (missingFinancials.length > 0) throw new Error(`Missing/invalid financials: ${missingFinancials.join(', ')}.`);
            if (!formData.userEmail) throw new Error("Email is required.");
            if (!formData.naicsSector) throw new Error("Industry Sector is required.");
            if (!formData.naicsSubSector) throw new Error("Industry Sub-Sector is required.");

            // Cálculos Locales (los tuyos originales)
            console.log("Performing local calculations...");
            const adjEbitda = (formData.ebitda || 0) + (formData.ebitdaAdjustments || 0);
            const { stage, baseMultiple, maxMultiple } = getValuationParameters(adjEbitda, formData.naicsSector, formData.naicsSubSector);
            const scores = calculateScores(formData);
            const scorePercentage = calculateMaxPossibleScore() > 0 ? (Object.values(scores).reduce((sum, s) => sum + (s || 0), 0) / calculateMaxPossibleScore()) : 0;
            const clampedScorePercentage = Math.max(0, Math.min(1, scorePercentage));
            const finalMultiple = baseMultiple + (maxMultiple - baseMultiple) * clampedScorePercentage;
            const estimatedValuation = adjEbitda >= 0 ? Math.round(adjEbitda * finalMultiple) : 0;
            const roadmapData = generateImprovementRoadmap(scores, stage);
            localCalcResult = { stage, adjEbitda, baseMultiple, maxMultiple, finalMultiple, estimatedValuation, scores, scorePercentage: clampedScorePercentage, roadmap: roadmapData };

            // Preparar Payload y Enviar (tu lógica original)
            const payloadToSend = { formData: formData, results: { /* ...resultados clave... */ } };
            console.log("Payload to send:", payloadToSend);

             // --- Usar URL absoluta ---
             if (!functionsBaseUrl) throw new Error("Function URL Base is not configured.");
             const functionUrl = `${functionsBaseUrl}/.netlify/functions/submit-valuation`;
             console.log(`Sending data to: ${functionUrl}`);

            const response = await fetch(functionUrl, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payloadToSend) });
            const result = await response.json();
            if (!response.ok) { console.error("Backend Error:", result); throw new Error(result.error || 'Failed to save submission.'); }

            // Éxito (tu lógica original)
            console.log("Submission Success Response:", result);
            setCalculationResult(localCalcResult);
            setSubmissionResult({ success: true, message: result.message || "Submission processed!" });
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);

        } catch (error) {
            console.error("handleSubmit Error:", error);
            setSubmissionResult({ success: false, message: `Error: ${error.message}` });
            setCalculationResult(null); // Asegurar que no se muestren resultados si hay error
        } finally {
            setIsSubmitting(false);
        }
        // --- ELIMINADA LA LLAMADA FETCH DUPLICADA ---
    }, [formData]); // Quitar submissionId de dependencias por ahora


    // --- handlePrevious (Restaurado a TU versión original) ---
    const handlePrevious = useCallback(() => {
        if (currentStep > 0) {
            setErrors({}); // Limpiar errores al ir atrás es buena idea
            setCurrentStep(prevStep => prevStep - 1);
        }
    }, [currentStep]);

    // --- handleStartOver (Restaurado a TU versión original) ---
    const handleStartOver = useCallback(() => {
        console.log("Starting over: Clearing local storage and reloading.");
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
        setErrors({});
        window.location.reload(); // Simple y efectivo
    }, []);

    // --- handleBackToEdit (Restaurado a TU versión original) ---
    const handleBackToEdit = useCallback(() => {
        console.log("Returning to edit...");
        setSubmissionResult(null);
        setCalculationResult(null);
        // Ir al último paso para editar
        setCurrentStep(TOTAL_STEPS > 0 ? TOTAL_STEPS - 1 : 0);
        setErrors({});
    }, []); // TOTAL_STEPS es constante, no necesita dependencia


    // --- Get Questions and Title (Sin cambios) ---
    const currentQuestions = getQuestionsForStep(currentStep);
    const currentSectionTitle = sections[currentStep];


    // --- Conditional Rendering Logic (Restaurado a TU versión original) ---
    if (submissionResult && submissionResult.success && calculationResult) {
        const userEmailFromFormData = formData?.userEmail; // Correcto
        const placeholderConsultantLink = "https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview"; // Correcto
        return (
           <ResultsDisplay
               calculationResult={calculationResult}
               onStartOver={handleStartOver}
               onBackToEdit={handleBackToEdit}
               consultantCalendlyLink={placeholderConsultantLink}
               userEmail={userEmailFromFormData}
               formData={formData} // Pasar formData para el PDF
           />
        );
     }
     else if (submissionResult && !submissionResult.success) {
         return (
              <div className="submission-result error">
                 <h2>Submission Error</h2>
                 <p>{submissionResult.message}</p>
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      {/* Botón para volver al formulario en lugar de revisar respuestas */}
                      <button type="button" onClick={() => setSubmissionResult(null)}>
                          Back to Form
                      </button>
                  </div>
             </div>
         );
     }

    // --- Renderizado principal del formulario (Restaurado a TU versión original) ---
    // Incluyendo la estructura y pasando las props CORRECTAS a Step y Navigation
    return (
        <div className="multi-step-form">
            <ProgressIndicator currentStep={currentStep + 1} totalSteps={TOTAL_STEPS} sections={sections} />
            <form onSubmit={(e) => e.preventDefault()}>
                <Step
                    key={currentStep}
                    stepIndex={currentStep}
                    questions={currentQuestions}
                    formData={formData}
                    handleChange={handleChange} // <<< Pasando el handler correcto
                    sectionTitle={currentSectionTitle}
                    errors={errors}
                    // --- Props para NAICS ---
                    dynamicOptions={{ sectors, subSectors }}
                    isSubSectorsLoading={isSubSectorsLoading}
                />
                <Navigation
                    currentStep={currentStep}
                    totalSteps={TOTAL_STEPS}
                    onPrevious={handlePrevious} // <<< Pasando el handler correcto
                    onNext={handleNext}         // <<< Pasando el handler correcto
                    isSubmitting={isSubmitting}   // <<< Pasando el estado correcto
                />
                 {/* --- ELIMINADA la sección del botón Send Link por ahora --- */}
                 {/* Puedes volver a añadirla más tarde si es necesario */}
            </form>
        </div>
    );
}

export default MultiStepForm;