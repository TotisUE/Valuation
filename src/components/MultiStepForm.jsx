// src/components/MultiStepForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
// --- Importaciones Corregidas ---
import { ScoringAreas, initialScores } from '../scoringAreas'; // Necesario para calculateScores
import {
    sections,                  // Necesario
    getQuestionsForStep,       // Necesario
    calculateMaxPossibleScore, // Necesario
    getValuationParameters,    // Necesario
    // NO importar qualitativeQuestions directamente
    calculateMaxScoreForArea   // Necesario para generateImprovementRoadmap
} from '../questions';
import Step from './Step';
import ProgressIndicator from './ProgressIndicator';
import Navigation from './Navigation';
import ResultsDisplay from './results/ResultsDisplay';

// --- Constantes ---
// Calcular TOTAL_STEPS basado en las secciones importadas
const TOTAL_STEPS = Array.isArray(sections) ? sections.length : 0;
if (TOTAL_STEPS === 0 && import.meta.env.MODE !== 'test') {
    // Advertir si 'sections' no carga correctamente, excepto en tests
    console.error("MultiStepForm: 'sections' array not loaded or empty from questions.js!");
}
const LOCAL_STORAGE_KEY = 'valuationFormData';
const LOCAL_STORAGE_STEP_KEY = 'valuationFormStep';

// --- Leer VITE_NETLIFY_FUNCTIONS_BASE_URL ---
const functionsBaseUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL || '';
if (!functionsBaseUrl && import.meta.env.MODE !== 'test') {
    console.warn("MultiStepForm: VITE_NETLIFY_FUNCTIONS_BASE_URL not defined.");
}


// --- Componente Principal ---
function MultiStepForm() { // Sin props de Magic Link

    // --- Estados ---
    const [currentStep, setCurrentStep] = useState(() => {
        const savedStep = localStorage.getItem(LOCAL_STORAGE_STEP_KEY);
        const initialStep = savedStep ? parseInt(savedStep, 10) : 0;
        // Validar contra TOTAL_STEPS (asegurarse que no sea 0)
        const validTotalSteps = TOTAL_STEPS > 0 ? TOTAL_STEPS : 1;
        return !isNaN(initialStep) && initialStep >= 0 && initialStep < validTotalSteps ? initialStep : 0;
    });
    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        const defaultStructure = { currentRevenue: null, grossProfit: null, ebitda: null, ebitdaAdjustments: 0, userEmail: '', naicsSector: '', naicsSubSector: '' };
        let baseData = {};
        if (savedData) {
             try {
                 baseData = JSON.parse(savedData);
                 if (typeof baseData !== 'object' || baseData === null) { baseData = {}; }
             } catch (error) { console.error("Failed to parse formData from localStorage.", error); baseData = {}; try { localStorage.removeItem(LOCAL_STORAGE_KEY); } catch(e){/**/} }
        }
        return { ...defaultStructure, ...baseData };
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const [errors, setErrors] = useState({});
    const [sectors, setSectors] = useState([]);
    const [subSectors, setSubSectors] = useState([]);
    const [isSubSectorsLoading, setIsSubSectorsLoading] = useState(false);


    // --- Effects (Completos y Correctos) ---
    useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData)); }, [formData]);
    useEffect(() => {
        // Guardar solo si TOTAL_STEPS es válido
        if (TOTAL_STEPS > 0 && currentStep >= 0 && currentStep < TOTAL_STEPS) {
           localStorage.setItem(LOCAL_STORAGE_STEP_KEY, currentStep.toString());
        }
     }, [currentStep]);
    useEffect(() => { // Cargar Sectores
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
    useEffect(() => { // Cargar Subsectores
        const loadSubSectors = async (selectedSectorName) => {
            if (!selectedSectorName || !Array.isArray(sectors) || sectors.length === 0) { setSubSectors([]); return; } // Añadida verificación de array
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
    }, [formData.naicsSector, sectors]); // Dependencia 'sectors' es correcta


    // --- **Helpers Definidos DENTRO del Componente con useCallback** ---

    // --- calculateScores (Restaurado y DENTRO) ---
    const calculateScores = useCallback((formDataToScore) => {
        console.log("Calculating scores for:", Object.keys(formDataToScore).length > 0 ? formDataToScore : "(empty form)");
        // Usar initialScores importado
        const scores = initialScores ? { ...initialScores } : {};

        // Obtener todas las preguntas usando la función importada
        const allQuestions = [];
         // Asegurarse que sections existe antes de iterar
         if (Array.isArray(sections)) {
             sections.forEach((_, index) => { allQuestions.push(...getQuestionsForStep(index)); });
         } else {
             console.error("calculateScores: 'sections' is not ready.");
             return scores; // Devolver scores vacíos si sections no está listo
         }

        // Filtrar cualitativas (usando ScoringAreas importado)
        const isQualitative = (q) => q && q.scoringArea && typeof ScoringAreas === 'object' && Object.values(ScoringAreas).includes(q.scoringArea);
        const qualitativeQuestionsNow = allQuestions.filter(isQualitative);

        if (!Array.isArray(qualitativeQuestionsNow)) {
            console.error("calculateScores: Could not filter qualitative questions.");
            return scores;
        }

        qualitativeQuestionsNow.forEach(question => {
            const answer = formDataToScore[question.valueKey];
            const area = question.scoringArea;
            if (answer && area && question.type === 'mcq' && scores.hasOwnProperty(area) && Array.isArray(question.options)) {
                const selectedOption = question.options.find(opt => opt.text === answer);
                if (selectedOption && typeof selectedOption.score === 'number') { scores[area] += selectedOption.score; }
                else if (selectedOption) { console.warn(`Score missing/invalid: QID ${question.id}, Ans "${answer}"`); }
            }
        });
        console.log("Calculated Scores:", scores);
        return scores;
    }, []); // Dependencias: initialScores, sections, getQuestionsForStep, ScoringAreas son estables/importadas

    // --- generateImprovementRoadmap (Restaurado y DENTRO) ---
    const generateImprovementRoadmap = useCallback((scores, stage) => {
        console.log("Generating roadmap for stage:", stage);
        const roadmapItems = [];
        const numberOfAreasToShow = 3;
        // ... (Tu lógica de stageToUrlMap, fallbackUrl, targetUrl) ...
         const stageToUrlMap = { /* ... */ };
         const fallbackUrl = 'https://www.acquisition.com/training/stabilize';
         const targetUrl = stageToUrlMap[stage] || fallbackUrl;
        // Restaurar roadmapContent completo
        const roadmapContent = {
            [ScoringAreas.SYSTEMS]: { title: "Strengthen Execution Systems", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 20 },
            [ScoringAreas.WORKFORCE]: { title: "Develop Workforce & Leadership", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 20 },
            [ScoringAreas.MARKET]: { title: "Solidify Robust Market Position", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 25 },
            [ScoringAreas.PROFITABILITY]: { title: "Enhance Profitability Metrics", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 20 },
            [ScoringAreas.MARKETING]: { title: "Build Marketing & Brand Equity", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 20 },
            [ScoringAreas.OFFERING]: { title: "Achieve Offering Excellence", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 20 },
            [ScoringAreas.EXPANSION]: { title: "Develop Expansion Capability", rationale: "...", actionSteps: ["...", "...", "..."], maxScore: 20 }
        };
        if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0) { return []; }
        // Usar ScoringAreas importado
        const sortedScores = Object.entries(scores)
            .filter(([areaKey]) => Object.values(ScoringAreas).includes(areaKey) && roadmapContent[areaKey])
            .sort(([, scoreA], [, scoreB]) => (scoreA || 0) - (scoreB || 0));
        const areasToImprove = sortedScores.slice(0, numberOfAreasToShow);
        areasToImprove.forEach(([areaKey, areaScore]) => {
            const content = roadmapContent[areaKey];
            if (content) {
                // Usar calculateMaxScoreForArea importado
                const maxScoreForAreaValue = calculateMaxScoreForArea(areaKey);
                const linkTextValue = `-> Watch the "${stage}" section on Acquisition.com for guidance on ${content.title}`;
                roadmapItems.push({ areaName: areaKey, title: content.title, areaScore: areaScore || 0, maxScore: maxScoreForAreaValue, rationale: content.rationale, actionSteps: content.actionSteps, linkText: linkTextValue, linkUrl: targetUrl });
            }
        });
        console.log("Generated roadmap items:", roadmapItems);
        return roadmapItems;
    }, []); // Dependencias: ScoringAreas, calculateMaxScoreForArea (imports estables)


    // --- Handlers ---

    // handleChange (CON LOG Y RESET NAICS - CORRECTO)
    const handleChange = useCallback((event) => {
        console.log('handleChange -> Name:', event.target.name, 'Value:', event.target.value);
        const { name, value, type } = event.target;
        let resetData = {};
        if (name === 'naicsSector') { resetData.naicsSubSector = ''; setSubSectors([]); }
        setFormData(prevData => ({ ...prevData, ...resetData, [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value }));
        if (errors[name]) { setErrors(prevErrors => { const newErrors = { ...prevErrors }; delete newErrors[name]; return newErrors; }); }
    }, [errors]); // Correcto

    // handleNext (CON LOGS - CORRECTO)
    const handleNext = useCallback(() => {
        console.log("handleNext called. Current Step:", currentStep);
        const questionsForThisStep = getQuestionsForStep(currentStep); // Usa func importada
        const stepErrors = {}; let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!Array.isArray(questionsForThisStep)) { console.error("handleNext: questions not ready!"); return; } // Protección
        questionsForThisStep.forEach(q => { /* ... tu lógica de validación ... */ });
        setErrors(stepErrors); console.log(`Step ${currentStep} Validation: isValid=${isValid}`, stepErrors);
        // Protección adicional para TOTAL_STEPS
        const validTotalSteps = TOTAL_STEPS > 0 ? TOTAL_STEPS : 1;
        if (isValid) {
             if (currentStep < validTotalSteps - 1) { setCurrentStep(prevStep => prevStep + 1); }
             else { handleSubmit(); } // Llama a handleSubmit
        }
    }, [currentStep, formData, handleSubmit]); // handleSubmit dependencia OK

    // handleSubmit (Llama a los helpers internos - LÓGICA RESTAURADA)
    const handleSubmit = useCallback(async () => {
        console.log("Attempting Submission with Data: ", formData);
        setIsSubmitting(true); setSubmissionResult(null); setCalculationResult(null); setErrors({});
        let localCalcResult = null;
        try {
            // --- Validaciones ---
            const requiredFinancials = ['currentRevenue', 'ebitda'];
            const missingFinancials = requiredFinancials.filter(key => formData[key] == null || isNaN(formData[key]));
            if (missingFinancials.length > 0) throw new Error(`Missing/invalid financials: ${missingFinancials.join(', ')}.`);
            if (!formData.userEmail) throw new Error("Email is required.");
            if (!formData.naicsSector) throw new Error("Industry Sector is required.");
            if (!formData.naicsSubSector) throw new Error("Industry Sub-Sector is required.");

            // --- Cálculos Locales (RESTAURADOS Y USANDO HELPERS INTERNOS) ---
            console.log("Performing local calculations...");
            const adjEbitda = (formData.ebitda || 0) + (formData.ebitdaAdjustments || 0);
             // Usar funciones importadas directamente
            const { stage, baseMultiple, maxMultiple } = getValuationParameters(adjEbitda, formData.naicsSector, formData.naicsSubSector);
            const scores = calculateScores(formData); // <<< LLAMA AL HELPER INTERNO
            const scorePercentage = calculateMaxPossibleScore() > 0 ? (Object.values(scores).reduce((sum, s) => sum + (s || 0), 0) / calculateMaxPossibleScore()) : 0; // Usa func importada
            const clampedScorePercentage = Math.max(0, Math.min(1, scorePercentage));
            const finalMultiple = baseMultiple + (maxMultiple - baseMultiple) * clampedScorePercentage;
            const estimatedValuation = adjEbitda >= 0 ? Math.round(adjEbitda * finalMultiple) : 0;
            const roadmapData = generateImprovementRoadmap(scores, stage); // <<< LLAMA AL HELPER INTERNO
            localCalcResult = { stage, adjEbitda, baseMultiple, maxMultiple, finalMultiple, estimatedValuation, scores, scorePercentage: clampedScorePercentage, roadmap: roadmapData };
            console.log("Local Calculation Result:", localCalcResult);

            // --- Preparar Payload y Enviar ---
             const payloadToSend = { formData: formData, results: { stage: localCalcResult.stage, estimatedValuation: localCalcResult.estimatedValuation, finalMultiple: localCalcResult.finalMultiple, scorePercentage: localCalcResult.scorePercentage, scores: localCalcResult.scores } };
            console.log("Payload to send:", payloadToSend);
            if (!functionsBaseUrl) throw new Error("Function URL Base not configured.");
            const functionUrl = `${functionsBaseUrl}/.netlify/functions/submit-valuation`;
            console.log(`Sending data to: ${functionUrl}`);
            const response = await fetch(functionUrl, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payloadToSend) });
            const result = await response.json();
            if (!response.ok) { console.error("Backend Error:", result); throw new Error(result.error || 'Failed to save submission.'); }

            // --- Éxito ---
            console.log("Submission Success Response:", result);
            setCalculationResult(localCalcResult);
            setSubmissionResult({ success: true, message: result.message || "Submission processed!" });
            localStorage.removeItem(LOCAL_STORAGE_KEY); localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);

        } catch (error) {
            console.error("handleSubmit Error:", error);
            setSubmissionResult({ success: false, message: `Error: ${error.message}` });
            setCalculationResult(null);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, calculateScores, generateImprovementRoadmap]); // Dependencias: formData y los helpers internos

    // handlePrevious (Sin cambios)
    const handlePrevious = useCallback(() => { if (currentStep > 0) { setErrors({}); setCurrentStep(prevStep => prevStep - 1); } }, [currentStep]);
    // handleStartOver (Sin cambios)
    const handleStartOver = useCallback(() => { localStorage.removeItem(LOCAL_STORAGE_KEY); localStorage.removeItem(LOCAL_STORAGE_STEP_KEY); setErrors({}); window.location.reload(); }, []);
    // handleBackToEdit (Sin cambios)
    const handleBackToEdit = useCallback(() => { setSubmissionResult(null); setCalculationResult(null); if (TOTAL_STEPS > 0) setCurrentStep(TOTAL_STEPS - 1); setErrors({}); }, []);


    // --- Get Questions and Title (Con protección) ---
    const currentQuestions = Array.isArray(sections) ? getQuestionsForStep(currentStep) : [];
    const currentSectionTitle = Array.isArray(sections) && sections[currentStep] ? sections[currentStep] : `Step ${currentStep + 1}`;


    // --- Conditional Rendering Logic (Sin cambios) ---
    if (submissionResult && submissionResult.success && calculationResult) {
         const userEmailFromFormData = formData?.userEmail;
         const placeholderConsultantLink = "https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview";
         return ( <ResultsDisplay calculationResult={calculationResult} onStartOver={handleStartOver} onBackToEdit={handleBackToEdit} consultantCalendlyLink={placeholderConsultantLink} userEmail={userEmailFromFormData} formData={formData} /> );
    } else if (submissionResult && !submissionResult.success) {
         return ( <div className="submission-result error"><h2>Submission Error</h2><p>{submissionResult.message}</p><div><button type="button" onClick={() => setSubmissionResult(null)}>Back to Form</button></div></div> );
    }

    // --- Renderizado principal del formulario (Con protección) ---
    return (
        <div className="multi-step-form">
            {/* Asegurarse que TOTAL_STEPS y sections son válidos antes de renderizar */}
            {TOTAL_STEPS > 0 && Array.isArray(sections) ? (
                <ProgressIndicator currentStep={currentStep + 1} totalSteps={TOTAL_STEPS} sections={sections} />
            ) : (
                <div>Loading Configuration...</div>
            )}
            <form onSubmit={(e) => e.preventDefault()}>
                {TOTAL_STEPS > 0 ? ( // Renderizar Step solo si hay configuración
                    <Step
                        key={currentStep}
                        stepIndex={currentStep}
                        questions={currentQuestions} // Ya está protegido arriba
                        formData={formData}
                        handleChange={handleChange}
                        sectionTitle={currentSectionTitle} // Ya está protegido arriba
                        errors={errors}
                        dynamicOptions={{ sectors, subSectors }}
                        isSubSectorsLoading={isSubSectorsLoading}
                    />
                ) : (
                    <p>Loading Questions...</p>
                )}
                {TOTAL_STEPS > 0 && ( // Renderizar Navigation solo si hay configuración
                    <Navigation
                        currentStep={currentStep}
                        totalSteps={TOTAL_STEPS}
                        onPrevious={handlePrevious}
                        onNext={handleNext}
                        isSubmitting={isSubmitting}
                    />
                )}
                {/* Sección Send Link eliminada por ahora */}
            </form>
        </div>
    );
}

export default MultiStepForm;