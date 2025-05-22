// src/components/MultiStepForm.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScoringAreas, initialScores } from '../scoringAreas';
import {
    sections as allAppSections, // Renombrado para claridad
    getQuestionsForStep,
    calculateMaxPossibleScore,
    getValuationParameters,
    calculateMaxScoreForArea,
    getQuestionsDataArray, // Para inicializar formData
} from '../questions';
import { getSaleToDeliveryProcessQuestions } from '../sections-data/saleToDeliveryQuestions';
import Step from './Step';
import ProgressIndicator from './ProgressIndicator';
import Navigation from './Navigation';
import ResultsDisplay from './results/ResultsDisplay';
import { getFunctionsBaseUrl } from '../utils/urlHelpers';

const LOCAL_STORAGE_KEY = 'valuationFormData';
const LOCAL_STORAGE_STEP_KEY = 'valuationFormStep';

// Helper para inicializar el formData con todas las valueKeys
const initializeFullFormData = () => {
    const allQuestions = getQuestionsDataArray(); // Obtiene TODAS las preguntas definidas
    const initialFormState = {};
    allQuestions.forEach(q => {
        // Inicializar según el tipo de pregunta para evitar problemas con controlled inputs
        if (q.type === 'number') {
            initialFormState[q.valueKey] = null;
        } else if (q.type === 'mcq' || q.type === 'select' || q.type === 'select_dependent') {
            initialFormState[q.valueKey] = ''; // Para selects y radios, un string vacío es un buen default
        } else { // text, textarea, email
            initialFormState[q.valueKey] = '';
        }
    });

    // Añadir campos que no son directamente de preguntas pero se usan en el estado
    initialFormState.ebitdaAdjustments = 0; // Valor por defecto específico
    initialFormState.assessmentId = null;
    
    // Puedes añadir otros campos por defecto si los tienes y no vienen de `allQuestions`
    // Ejemplo: currentRevenue, grossProfit, ebitda si no estuvieran como preguntas
    // pero en tu caso, ya están definidos como preguntas, así que `allQuestions` debería cubrirlos.

    // Asegurar que campos cruciales de perfil tengan un default si no están en `allQuestions` (aunque deberían)
    const profileDefaults = {
        userEmail: '', ownerRole: '', naicsSector: '', naicsSubSector: '',
        employeeCount: null, locationState: '', locationZip: '',
        revenueSourceBalance: '', customerTypeBalance: '', currentRevenue: null,
        grossProfit: null, ebitda: null
    };

    return { ...profileDefaults, ...initialFormState }; // Fusionar, dando prioridad a los de `allQuestions`
};


function MultiStepForm({ initialFormData: initialFormDataProp = null }) { // Renombrar prop para claridad

    const [formData, setFormData] = useState(() => {
        console.log("MultiStepForm: Initializing formData state...");
        const baseStructure = initializeFullFormData(); // Usa la nueva función helper

        if (initialFormDataProp) {
            console.log("MultiStepForm: Initializing with initialFormDataProp:", initialFormDataProp);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
            return { ...baseStructure, ...initialFormDataProp };
        }

        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        let dataFromStorage = {};
        if (savedData) {
            try {
                dataFromStorage = JSON.parse(savedData);
                if (typeof dataFromStorage !== 'object' || dataFromStorage === null) dataFromStorage = {};
                console.log("MultiStepForm: Data loaded from localStorage:", dataFromStorage);
            } catch (error) {
                console.error("MultiStepForm: Error parsing localStorage data", error);
                dataFromStorage = {};
            }
        }

        let finalInitialState = { ...baseStructure, ...dataFromStorage };

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const emailFromUrl = params.get('email');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailFromUrl && emailRegex.test(emailFromUrl)) {
                console.log(`MultiStepForm: Overwriting userEmail with validated URL email: ${emailFromUrl}`);
                finalInitialState.userEmail = emailFromUrl;
            }
        }
        console.log("MultiStepForm: Final initial formData state:", finalInitialState);
        return finalInitialState;
    });

    const visibleSections = useMemo(() => {
        return allAppSections;
}, [allAppSections]);

    const TOTAL_STEPS = visibleSections.length;

    const [currentStep, setCurrentStep] = useState(() => {
        if (initialFormDataProp) return 0;
        const savedStep = localStorage.getItem(LOCAL_STORAGE_STEP_KEY);
        const initialStep = savedStep ? parseInt(savedStep, 10) : 0;
        const maxValidStep = TOTAL_STEPS > 0 ? TOTAL_STEPS -1 : 0;
        return !isNaN(initialStep) && initialStep >= 0 && initialStep <= maxValidStep ? initialStep : 0;
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const [errors, setErrors] = useState({});
    const [sectors, setSectors] = useState([]);
    const [subSectors, setSubSectors] = useState([]);
    const [isSubSectorsLoading, setIsSubSectorsLoading] = useState(false);
    const [isSendingLink, setIsSendingLink] = useState(false);
    const [sendLinkResult, setSendLinkResult] = useState({ status: 'idle', message: '' });

    // useEffect para ajustar currentStep si TOTAL_STEPS cambia (ej. por isOwner)
    useEffect(() => {
        if (TOTAL_STEPS > 0 && currentStep >= TOTAL_STEPS) {
            setCurrentStep(TOTAL_STEPS - 1);
        } else if (TOTAL_STEPS === 0 && currentStep !== 0) {
            setCurrentStep(0);
        }
    }, [TOTAL_STEPS, currentStep]);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
    }, [formData]);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_STEP_KEY, currentStep.toString());
        window.scrollTo(0, 0);
    }, [currentStep]);

    // useEffects para NAICS (sin cambios)
    useEffect(() => { /* ... tu fetchNaicsData ... */ 
        const fetchNaicsData = async () => {
            setIsSubSectorsLoading(true);
            setSectors([]);
            setSubSectors([]);
            try {
                const response = await fetch('/naics-data/all_naics_data.json');
                if (!response.ok) throw new Error(`HTTP error ${response.status} fetching all_naics_data.json`);
                const allData = await response.json();
                if (Array.isArray(allData)) {
                    setSectors(allData);
                    if (formData.naicsSector) {
                        const selectedSectorData = allData.find(s => s.name === formData.naicsSector);
                        if (selectedSectorData && Array.isArray(selectedSectorData.subSectors)) {
                            setSubSectors(selectedSectorData.subSectors);
                        } else {
                            setSubSectors([]);
                        }
                    }
                } else { setSectors([]); }
            } catch (error) { console.error("Error fetching NAICS data:", error); setSectors([]); setSubSectors([]); }
            finally { setIsSubSectorsLoading(false); }
        };
        fetchNaicsData();
    }, [formData.naicsSector]); // Dependencia añadida para recargar subsectores si el sector inicial viene de localStorage

    useEffect(() => {
        if (!formData.naicsSector || sectors.length === 0) { 
            if (formData.naicsSubSector !== '') setFormData(prev => ({...prev, naicsSubSector: ''})); // Resetear subsector
            setSubSectors([]); 
            return; 
        }
        const selectedSectorData = sectors.find(s => s.name === formData.naicsSector);
        if (selectedSectorData && Array.isArray(selectedSectorData.subSectors)) {
            setSubSectors(selectedSectorData.subSectors);
        } else { 
            if (formData.naicsSubSector !== '') setFormData(prev => ({...prev, naicsSubSector: ''})); // Resetear subsector
            setSubSectors([]); 
        }
    }, [formData.naicsSector, sectors]); // No es necesario setFormData como dependencia aquí si solo actualiza subSectors
    

    const calculateScores = useCallback((formDataToScore) => { /* ... tu función sin cambios ... */
        const scores = initialScores ? { ...initialScores } : {};
        const allQuestionsFromMainForm = getQuestionsDataArray(); // Obtener todas las preguntas
        // Filtrar solo las preguntas que tienen scoringArea y NO son de S2D (S2D se calcula aparte)
        const qualitativeQuestionsForMainValuation = allQuestionsFromMainForm.filter(q => 
            q.scoringArea && 
            typeof ScoringAreas === 'object' && 
            Object.values(ScoringAreas).includes(q.scoringArea) &&
            !q.id.startsWith('s2d_') // Excluir preguntas S2D del cálculo de valoración principal
        );

        qualitativeQuestionsForMainValuation.forEach(question => {
            const answer = formDataToScore[question.valueKey];
            const area = question.scoringArea;
            if (answer && area && question.type === 'mcq' && scores.hasOwnProperty(area) && Array.isArray(question.options)) {
                const selectedOption = question.options.find(opt => opt.text === answer); // Asume que guardas el texto de la opción
                if (selectedOption && typeof selectedOption.score === 'number') { 
                    scores[area] += selectedOption.score; 
                }
            }
        });
        return scores;
    }, [allAppSections, initialScores, ScoringAreas]); // allAppSections para getQuestionsForStep indirectamente

    const generateImprovementRoadmap = useCallback((scores, stage, currentFormData) => { /* ... tu función sin cambios, pero asegúrate que usa los scores correctos ... */ 
        // Esta función usa los 'scores' de la valoración principal
        const roadmapItems = [];
        const numberOfAreasToShow = 3;
        const stageToUrlMap = { /* ... */ };
        const fallbackUrl = 'https://www.acquisition.com/training/stabilize';
        const targetUrl = stageToUrlMap[stage] || fallbackUrl;
        const roadmapContent = { /* ... tu roadmapContent ... */ };

        if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0) return [];
        if (!currentFormData || typeof currentFormData !== 'object') return [];

        let executeConditionalLogic = false;
        const marketingAreaKey = ScoringAreas.MARKETING;
        const marketingScore = scores[marketingAreaKey] || 0;
        const maxMarketingScore = calculateMaxScoreForArea(marketingAreaKey);
        const marketingScorePercent = maxMarketingScore > 0 ? marketingScore / maxMarketingScore : 0;
        const revenueBalance = currentFormData.revenueSourceBalance;
        const directSalesRevenueBalances = [
            "Mostly/All Direct (>80% Direct Revenue)",
            "Primarily Direct (approx. 60-80% Direct Revenue)",
            "Roughly Balanced Mix (approx. 40-60% Direct Revenue)"
        ];
        if (marketingScorePercent < 0.80 && directSalesRevenueBalances.includes(revenueBalance)) {
            executeConditionalLogic = true;
        }
        
        if (executeConditionalLogic) { /* ... tu lógica condicional del roadmap ... */ }
        else { /* ... tu lógica original del roadmap ... */ }
        return roadmapItems;
    }, [ScoringAreas, formData.revenueSourceBalance]); // Ajustar dependencias


    const currentSectionName = visibleSections[currentStep];
    const currentQuestions = useMemo(() => {
        if (currentSectionName === undefined) return [];
        const allDefinedQuestions = getQuestionsDataArray();
        if (!Array.isArray(allDefinedQuestions)) return [];
        return allDefinedQuestions.filter(q => q.section === currentSectionName);
    }, [currentSectionName, visibleSections]); // Añadir visibleSections

    const handleChange = useCallback((event) => {
        const { name, value, type } = event.target;
        let processedValue = value;

        if (type === 'number') {
            processedValue = value === '' ? null : parseFloat(value);
            if (isNaN(processedValue)) processedValue = null;
        }
        
        // Para MCQ, el 'value' ya es la letra ("a", "b") o el texto, según Step.jsx
        // Tu Step.jsx para MCQ del form principal usa option.text
        // Si las preguntas S2D (que también usan Step.jsx ahora) tienen option.value diferente a option.text,
        // necesitas asegurarte de que handleChange pueda manejar ambos o que Step.jsx sea consistente.
        // Por ahora, asumimos que Step.jsx pasa lo que handleChange espera.

        setFormData(prevData => {
            const newFormData = { ...prevData, [name]: processedValue };
            return newFormData;
        });

        if (errors[name]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]); // Removido setIsOwner de dependencias, ya que se llama dentro y depende de 'value'

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        setSubmissionResult(null);
        setCalculationResult(null);
        setErrors({});
        let localCalcResult = {};

        try {
            // VALIDACIONES (currentRevenue, ebitda si isOwner, naicsSector, naicsSubSector)
            if (!formData.userEmail) throw new Error("User email is required for submission.");
            if (formData.currentRevenue === null || formData.currentRevenue === undefined) {throw new Error("Current Revenue is required.");}
            if (!formData.naicsSector || !formData.naicsSubSector) throw new Error("Industry Sector and Sub-Sector are required.");

            // --- CÁLCULOS ORIGINALES (para valoración general) ---
            const adjEbitda = (formData.ebitda || 0) + (formData.ebitdaAdjustments || 0);
            const valuationParams = getValuationParameters(adjEbitda, formData.naicsSector, formData.naicsSubSector);
            const { stage, baseMultiple, maxMultiple } = valuationParams;
            const originalScores = calculateScores(formData);
            const maxPossibleOriginal = calculateMaxPossibleScore();
            const originalScorePercentage = maxPossibleOriginal > 0 ? (Object.values(originalScores).reduce((sum, s) => sum + (s || 0), 0) / maxPossibleOriginal) : 0;
            const clampedOriginalScorePercentage = Math.max(0, Math.min(1, originalScorePercentage));
            const finalMultiple = baseMultiple + (maxMultiple - baseMultiple) * clampedOriginalScorePercentage;
            const estimatedValuation = adjEbitda >= 0 ? Math.round(adjEbitda * finalMultiple) : 0;
            const roadmapData = generateImprovementRoadmap(originalScores, stage, formData);

            // --- INICIO: CÁLCULO DE SCORES S2D ---
            let s2d_processMaturityScore = 0;
            let s2d_ownerIndependenceScore = 0;
            let s2d_clientExperienceOptimizationScore = 0;
            let s2d_resourceAllocationEffectivenessScore = 0;
            
            const s2dQuestionDefinitions = getSaleToDeliveryProcessQuestions(allAppSections[1]);
            const clientExperienceValueKeys = ["s2d_q3_process", "s2d_q2_process", "s2d_q5_process"];
            const resourceAllocationValueKeys = ["s2d_q6_process", "s2d_q4_process", "s2d_q7_process"];
            const s2d_detailedAnswers = { clientExperience: {}, resourceAllocation: {} };

            s2dQuestionDefinitions.forEach(q => {
                const answerValue = formData[q.valueKey]; // Las respuestas S2D están en el formData principal
                if (answerValue && q.options && q.type === 'mcq') {
                    const selectedOption = q.options.find(opt => opt.value === answerValue); // ASUME que S2D MCQs guardan 'option.value'
                    if (selectedOption && typeof selectedOption.score === 'number') {
                        let qKey = q.id.split('_')[1];
                        if (q.id.includes('_process')) {
                            s2d_processMaturityScore += selectedOption.score;
                            if (clientExperienceValueKeys.includes(q.valueKey) && qKey) {
                                s2d_clientExperienceOptimizationScore += selectedOption.score;
                                s2d_detailedAnswers.clientExperience[qKey] = { questionText: q.text, answerText: selectedOption.text, score: selectedOption.score };
                            }
                            if (resourceAllocationValueKeys.includes(q.valueKey) && qKey) {
                                s2d_resourceAllocationEffectivenessScore += selectedOption.score;
                                s2d_detailedAnswers.resourceAllocation[qKey] = { questionText: q.text, answerText: selectedOption.text, score: selectedOption.score };
                            }
                        } else if (q.id.includes('_owner')) {
                            s2d_ownerIndependenceScore += selectedOption.score;
                        }
                    }
                }
            });
            // --- FIN: CÁLCULO DE SCORES S2D ---

            localCalcResult = {
                stage, adjEbitda, baseMultiple, maxMultiple, finalMultiple, estimatedValuation,
                scores: originalScores, scorePercentage: clampedOriginalScorePercentage,
                roadmap: roadmapData,
                s2d_productName: formData.s2d_productName,
                s2d_productDescription: formData.s2d_productDescription,
                s2d_productRevenue: formData.s2d_productRevenue,
                s2d_processMaturityScore,
                s2d_ownerIndependenceScore,
                s2d_clientExperienceOptimizationScore,
                s2d_resourceAllocationEffectivenessScore,
                s2d_detailedAnswers,
                // s2d_all_answers: s2dQuestionDefinitions.reduce((obj, q) => ({...obj, [q.valueKey]: formData[q.valueKey]}), {})
            };
            
            console.log("[MultiStepForm] handleSubmit - localCalcResult (incluye S2D):", localCalcResult);

            const payloadToSend = { formData, results: localCalcResult };
            const functionsBase = getFunctionsBaseUrl();
            const functionUrl = `${functionsBase}/.netlify/functions/submit-valuation`;
            const response = await fetch(functionUrl, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadToSend)
            });
            const resultText = await response.text();
            const result = JSON.parse(resultText);
            if (!response.ok || !result.success) throw new Error(result.error || 'Backend processing failed.');

            setCalculationResult(localCalcResult);
            setSubmissionResult({ success: true, message: result.message || "Submission processed!" });
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);

        } catch (error) { 
           console.error("[MultiStepForm] handleSubmit Error:", error.message, error.stack); 
           setSubmissionResult({ success: false, message: `Submission Failed: ${error.message}` });
           setCalculationResult(null);
        } finally {
            setIsSubmitting(false);
        }
    }, [
        formData,calculateScores, generateImprovementRoadmap, 
        allAppSections, errors, // Asegurar que allAppSections esté si se usa para obtener el nombre de la sección S2D
        // No necesitas getSaleToDeliveryProcessQuestions en dependencias
    ]);

    const handleNext = useCallback(() => { /* ... tu función sin cambios ... */
        const questionsToValidate = currentQuestions;
        const stepErrors = {};
        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        questionsToValidate.forEach(q => {
            const value = formData[q.valueKey];
            let isEmptyOrInvalid = false;
            if (q.type === 'number') {
                isEmptyOrInvalid = (value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || isNaN(Number(value))) && value !== 0;
            } else {
                isEmptyOrInvalid = value == null || (typeof value === 'string' && value.trim() === '');
            }
            if (q.required && isEmptyOrInvalid) {
                stepErrors[q.valueKey] = `${q.text || 'This field'} is required.`;
                isValid = false;
            } else if (q.type === 'email' && value && !emailRegex.test(value)) {
                stepErrors[q.valueKey] = "Invalid email format.";
                isValid = false;
            }
        });
        setErrors(stepErrors);
        if (isValid) {
            if (currentStep < TOTAL_STEPS - 1) {
                setCurrentStep(prevStep => prevStep + 1);
            } else {
                handleSubmit();
            }
        }
    }, [currentStep, TOTAL_STEPS, currentQuestions, formData, handleSubmit, errors]); // Añadir errors

    const handlePrevious = useCallback(() => { /* ... tu función sin cambios ... */
        if (currentStep > 0) {
            setCurrentStep(prevStep => prevStep - 1);
            setErrors({});
        }
    }, [currentStep]);

    const handleStartOver = useCallback(() => { /* ... tu función sin cambios ... */
        setSubmissionResult(null);
        setCalculationResult(null);
        setCurrentStep(0);
        // REINICIALIZAR formData CON LA ESTRUCTURA COMPLETA
        setFormData(initializeFullFormData()); 
        setErrors({});
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
    }, []); // No necesita dependencias si initializeFullFormData es pura y no depende de props/estado

    const handleBackToEdit = useCallback(() => { /* ... tu función sin cambios ... */
        setSubmissionResult(null);
        setCalculationResult(null);
    }, []);

    const handleSaveAndSendLink = useCallback(async () => { /* ... tu función sin cambios ... */
        setIsSendingLink(true);
        setSendLinkResult({ status: 'idle', message: '' });
        if (!formData.userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
            setSendLinkResult({ status: 'error', message: 'Please enter a valid client email first.' });
            setIsSendingLink(false);
            return;
        }
        const functionsBase = getFunctionsBaseUrl();
        const functionsPath = '/.netlify/functions';
        try {
            const savePayload = { assessment_id: formData.assessmentId || null, userEmail: formData.userEmail, formData: formData };
            const saveUrl = `${functionsBase}${functionsPath}/save-partial-assessment`;
            const saveResponse = await fetch(saveUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(savePayload) });
            if (!saveResponse.ok) { const errorText = await saveResponse.text(); throw new Error(`Save progress failed (Status ${saveResponse.status}): ${errorText.substring(0,150)}`); }
            const saveResult = await saveResponse.json();
            if (!saveResult.success || !saveResult.assessment_id) throw new Error(saveResult.error || 'Failed to save progress or get ID.');
            
            const currentAssessmentId = saveResult.assessment_id;
            setFormData(prev => ({ ...prev, assessmentId: currentAssessmentId })); // Guardar ID

            const sendPayload = { assessment_id: currentAssessmentId, userEmail: formData.userEmail };
            const sendUrl = `${functionsBase}${functionsPath}/send-continuation-link`;
            const sendResponse = await fetch(sendUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sendPayload) });
            if (!sendResponse.ok) { const errorText = await sendResponse.text(); throw new Error(`Send link failed (Status ${sendResponse.status}): ${errorText.substring(0,150)}`); }
            const sendResult = await sendResponse.json();
            if (!sendResult.success) throw new Error(sendResult.error || 'Failed to send link.');
            setSendLinkResult({ status: 'success', message: `Continuation link sent to ${formData.userEmail}` });
        } catch (error) {
            setSendLinkResult({ status: 'error', message: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsSendingLink(false);
        }
    }, [formData]); // formData es la dependencia principal aquí

    // --- Conditional Rendering Logic & Main Form Render ---
    if (submissionResult && submissionResult.success && calculationResult) {
        // ... tu JSX para ResultsDisplay sin cambios ...
        return ( <ResultsDisplay calculationResult={calculationResult} onStartOver={handleStartOver} onBackToEdit={handleBackToEdit} consultantCalendlyLink={"https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview"} userEmail={formData?.userEmail} formData={formData} /> );
    } else if (submissionResult && !submissionResult.success) {
        // ... tu JSX para error de sumisión sin cambios ...
         return ( <div className="submission-result error"><h2>Submission Error</h2><p>{submissionResult.message}</p><div style={{textAlign: 'center', marginTop: '20px'}}><button type="button" onClick={() => setSubmissionResult(null)}>Back to Form</button></div></div> );
    }

    return (
        <div className="multi-step-form">
            {/* ... tu JSX para ProgressIndicator, Step, Navigation sin cambios ... */}
            <ProgressIndicator currentStep={currentStep + 1} totalSteps={TOTAL_STEPS} sections={visibleSections} />
            <form onSubmit={(e) => e.preventDefault()}>
            <Step
                key={currentSectionName || currentStep}
                stepIndex={currentStep}
                questions={currentQuestions}
                formData={formData}
                handleChange={handleChange}
                sectionTitle={currentSectionName}
                errors={errors}
                dynamicOptions={{ sectors, subSectors }}
                isSubSectorsLoading={isSubSectorsLoading}
            />
            <Navigation
                currentStep={currentStep}
                totalSteps={TOTAL_STEPS}
                onPrevious={handlePrevious}
                onNext={handleNext}
                isSubmitting={isSubmitting}
                onSaveAndSendLink={handleSaveAndSendLink}
                isSendingLink={isSendingLink}
                sendLinkResult={sendLinkResult}
            />
            </form>
        </div>
    );
}

export default MultiStepForm;