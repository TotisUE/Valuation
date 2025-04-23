import React, { useState, useEffect, useCallback } from 'react';
import { ScoringAreas, initialScores } from '../scoringAreas';
import { sections, getQuestionsForStep, calculateMaxPossibleScore, getValuationParameters, calculateMaxScoreForArea } from '../questions';
import Step from './Step';
import ProgressIndicator from './ProgressIndicator';
import Navigation from './Navigation';
import ResultsDisplay from './results/ResultsDisplay';
import { getFunctionsBaseUrl } from '../utils/urlHelpers';

// --- Constantes ---
const TOTAL_STEPS = sections.length;
const LOCAL_STORAGE_KEY = 'valuationFormData';
const LOCAL_STORAGE_STEP_KEY = 'valuationFormStep';

// --- Leer VITE_NETLIFY_FUNCTIONS_BASE_URL ---
// La variable a nivel de módulo se elimina o comenta, ya que la lógica ahora está en handleSubmit
// const functionsBaseUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL || '';

// VVV--- EL BLOQUE if HUÉRFANO HA SIDO ELIMINADO/COMENTADO ---VVV
/*
if (!functionsBaseUrl && import.meta.env.MODE !== 'test') {
    console.warn("MultiStepForm: VITE_NETLIFY_FUNCTIONS_BASE_URL not defined.");
}
*/
// ^^^--- FIN BLOQUE ELIMINADO/COMENTADO ---^^^

// --- Componente Principal ---
function MultiStepForm({ initialFormData = null }) { // Sin props de Magic Link por ahora

    // --- Estados (Completos) ---
    const [currentStep, setCurrentStep] = useState(() => {
        if (initialFormData) {
            console.log("MultiStepForm: Received initialFormData, starting at step 0.");
            localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
            return 0; // CORRECCIÓN: Simplemente devolver 0
        }
        const savedStep = localStorage.getItem(LOCAL_STORAGE_STEP_KEY);
        const initialStep = savedStep ? parseInt(savedStep, 10) : 0;
        return !isNaN(initialStep) && initialStep >= 0 && initialStep < TOTAL_STEPS ? initialStep : 0;
    });
    const [formData, setFormData] = useState(() => {
        if (initialFormData) {
            console.log("MultiStepForm: Initializing state with initialFormData:", initialFormData);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            const defaultStructure = { currentRevenue: null, grossProfit: null, ebitda: null, ebitdaAdjustments: 0, userEmail: '', naicsSector: '', naicsSubSector: '' };
            return { ...defaultStructure, ...initialFormData };
        }
        console.log("MultiStepForm: Initializing state from localStorage (if available).");
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        const defaultStructure = { currentRevenue: null, grossProfit: null, ebitda: null, ebitdaAdjustments: 0, userEmail: '', naicsSector: '', naicsSubSector: '' };
        let baseData = {};
        if (savedData) { try { baseData = JSON.parse(savedData); if (typeof baseData !== 'object' || baseData === null) { baseData = {}; } } catch (error) { /* Ignorar error de parseo */ } }
        return { ...defaultStructure, ...baseData };
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const [errors, setErrors] = useState({});
    const [sectors, setSectors] = useState([]);
    const [subSectors, setSubSectors] = useState([]);
    const [isSubSectorsLoading, setIsSubSectorsLoading] = useState(false);
    const [isSendingLink, setIsSendingLink] = useState(false); // Nuevo estado
const [sendLinkResult, setSendLinkResult] = useState({ status: 'idle', message: '' }); // Para feedback


    // --- Effects (Completos - NAICS Refactorizados) ---
    useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData)); }, [formData]);
    useEffect(() => { localStorage.setItem(LOCAL_STORAGE_STEP_KEY, currentStep.toString()); }, [currentStep]);

    useEffect(() => {
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
                            console.warn(`Subsectors not found for initially selected sector: ${formData.naicsSector}`);
                            setSubSectors([]);
                        }
                    }
                } else { console.error("NAICS data is not an array:", allData); setSectors([]); }
            } catch (error) { console.error("Error fetching NAICS data:", error); setSectors([]); setSubSectors([]); }
            finally { setIsSubSectorsLoading(false); }
        };
        fetchNaicsData();
    }, []);

    useEffect(() => {
        if (!formData.naicsSector || sectors.length === 0) { setSubSectors([]); return; }
        const selectedSectorData = sectors.find(s => s.name === formData.naicsSector);
        if (selectedSectorData && Array.isArray(selectedSectorData.subSectors)) {
            setSubSectors(selectedSectorData.subSectors);
        } else { console.warn(`Subsectors not found for selected sector: ${formData.naicsSector}`); setSubSectors([]); }
    }, [formData.naicsSector, sectors]);


    // --- **Helpers Definidos DENTRO del Componente con useCallback** ---

    const calculateScores = useCallback((formDataToScore) => {
        // console.log("Calculating scores for:", Object.keys(formDataToScore).length > 0 ? formDataToScore : "(empty)");
        const scores = initialScores ? { ...initialScores } : {};
        const allQuestions = [];
        sections.forEach((_, index) => { allQuestions.push(...getQuestionsForStep(index)); });
        const isQualitative = (q) => q && q.scoringArea && typeof ScoringAreas === 'object' && Object.values(ScoringAreas).includes(q.scoringArea);
        const qualitativeQuestionsNow = allQuestions.filter(isQualitative);
        if (!Array.isArray(qualitativeQuestionsNow)) { console.error("calculateScores: Could not get qualitative questions."); return scores; }
        qualitativeQuestionsNow.forEach(question => {
            const answer = formDataToScore[question.valueKey];
            const area = question.scoringArea;
            if (answer && area && question.type === 'mcq' && scores.hasOwnProperty(area) && Array.isArray(question.options)) {
                const selectedOption = question.options.find(opt => opt.text === answer);
                if (selectedOption && typeof selectedOption.score === 'number') { scores[area] += selectedOption.score; }
                else if (selectedOption) { console.warn(`Score missing/invalid: QID ${question.id}, Ans "${answer}"`); }
            }
        });
        // console.log("Calculated Scores:", scores);
        return scores;
    }, []); // Quitado [sections, getQuestionsForStep] ya que vienen de import

    const generateImprovementRoadmap = useCallback((scores, stage) => {
        // console.log("Generating roadmap for stage:", stage);
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
        const roadmapContent = {
            [ScoringAreas.SYSTEMS]: { title: "Strengthen Execution Systems", rationale: "Robust systems reduce errors, increase efficiency, and make the business less dependent on key individuals, directly increasing its operational stability and attractiveness to buyers.", actionSteps: ["Document your most critical client delivery or operational process using a Standard Operating Procedure (SOP) template.","Implement a simple checklist for a key quality control point in your workflow.","Identify one repetitive manual task and research software (e.g., CRM, project management tool) that could potentially automate it."], maxScore: 20 },
            [ScoringAreas.WORKFORCE]: { title: "Develop Workforce & Leadership", rationale: "A strong, autonomous management team and clear accountability structures reduce owner dependency, a key risk factor that lowers business value. Engaged, well-managed teams are also more productive.", actionSteps: ["Define the Top 3 Key Performance Indicators (KPIs) for one key role (besides your own).","Hold a dedicated meeting with your key team member(s) to discuss their roles, responsibilities, and how their performance links to business goals.","Identify one key task currently only you perform and create a plan to delegate it within the next quarter."], maxScore: 20 },
            [ScoringAreas.MARKET]: { title: "Solidify Robust Market Position", rationale: "Operating in a growing market with a diversified customer base and a strong competitive position reduces risk and signals significant future potential, boosting valuation multiples.", actionSteps: ["Calculate the percentage of revenue coming from your top 3 customers over the last 12 months.","Clearly write down your Unique Selling Proposition (USP): What makes you different and better than your top 2 competitors?","Research and document the estimated size (TAM) and growth rate of your primary market niche."], maxScore: 25 },
            [ScoringAreas.PROFITABILITY]: { title: "Enhance Profitability Metrics", rationale: "Consistent, predictable, and healthy profit margins are fundamental to business valuation. Higher, more reliable profits directly translate to a higher business value.", actionSteps: ["Review your pricing structure for your main product/service – when was it last updated compared to competitors and costs?","Identify your top 2-3 sources of recurring revenue (or brainstorm ways to create some).","Implement a simple monthly review of your Profit & Loss statement, focusing on Gross Profit Margin trends."], maxScore: 20 },
            [ScoringAreas.MARKETING]: { title: "Build Marketing & Brand Equity", rationale: "A strong offering combined with an effective sales process ensures customer value is delivered and captured efficiently, maximizing growth and profitability.",actionSteps: ["Map your current sales process stages from lead generation to closed deal.","Identify key conversion metrics for each stage (e.g., lead-to-opportunity rate, opportunity-to-close rate).","Review customer feedback (from off1/NPS) to identify areas for offering improvement."], maxScore: 20 },
            [ScoringAreas.OFFERING_SALES]: { title: "Improve Offering & Sales Effectiveness", rationale: "High customer satisfaction, strong differentiation, and consistent quality build reputation and recurring revenue, reducing churn and supporting premium pricing – all positive valuation factors.", actionSteps: ["Implement a simple customer feedback mechanism (e.g., a 1-question post-service email survey or using Net Promoter Score - NPS).","Map out your core service/product delivery process and identify one key step where quality could be improved or standardized.","Analyze your top competitor's main offering – list 2 things they do well and 1 thing your offering does better."], maxScore: 20 },
            [ScoringAreas.EXPANSION]: { title: "Develop Expansion Capability", rationale: "Demonstrating the ability to scale operations into new markets, services, or partnerships significantly increases perceived future value and strategic options for potential acquirers.", actionSteps: ["Outline the basic steps required to launch your service/product in a new neighboring city or region.","Identify one potential strategic partner (e.g., a complementary business) and brainstorm 2 ways you could collaborate.","Assess your current team/systems: What would be the biggest bottleneck if demand doubled next month?"], maxScore: 20 }
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
                roadmapItems.push({ areaName: areaKey, title: content.title, areaScore: areaScore || 0, maxScore: maxScoreForArea, rationale: content.rationale, actionSteps: content.actionSteps, linkText: linkText, linkUrl: targetUrl });
            }
        });
        // console.log("Generated roadmap items:", roadmapItems);
        return roadmapItems;
     // Quitado [calculateMaxScoreForArea] ya que viene de import
    }, []);


    // --- Handlers ---

    const handleChange = useCallback((event) => {
        // console.log('handleChange -> Name:', event.target.name, 'Value:', event.target.value);
        const { name, value, type } = event.target;
        let resetData = {};
        if (name === 'naicsSector') { resetData.naicsSubSector = ''; setSubSectors([]); }
        setFormData(prevData => ({ ...prevData, ...resetData, [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value }));
        if (errors[name]) { setErrors(prevErrors => { const newErrors = { ...prevErrors }; delete newErrors[name]; return newErrors; }); }
    }, [errors]); // Dependencia correcta

    const handleSubmit = useCallback(async () => {
        console.log("handleSubmit: Iniciando...");
        setIsSubmitting(true);
        setSubmissionResult(null);
        setCalculationResult(null);
        setErrors({});
        let localCalcResult = null;

        try {
            console.log("handleSubmit: Dentro del try, antes de validaciones.");
            // --- Validaciones ---
            if (!formData || !formData.userEmail) throw new Error("Internal Error: formData or userEmail missing before validation.");
            const requiredFinancials = ['currentRevenue', 'ebitda'];
            const missingFinancials = requiredFinancials.filter(key => formData[key] == null || isNaN(formData[key]));
            if (missingFinancials.length > 0) throw new Error(`Missing/invalid financials: ${missingFinancials.join(', ')}.`);
            if (!formData.naicsSector) throw new Error("Industry Sector is required.");
            if (!formData.naicsSubSector) throw new Error("Industry Sub-Sector is required.");
            console.log("handleSubmit: Validaciones pasadas.");

            // --- Cálculos ---
            console.log("handleSubmit: Preparando para calcular adjEbitda...");
            if (typeof formData.ebitda === 'undefined' || typeof formData.ebitdaAdjustments === 'undefined') {
                 throw new Error("Internal Error: formData.ebitda or ebitdaAdjustments undefined before adjEbitda calc.");
            }
            const adjEbitda = (formData.ebitda || 0) + (formData.ebitdaAdjustments || 0);
            console.log("handleSubmit: adjEbitda calculado =", adjEbitda);

            console.log("handleSubmit: Preparando para llamar a getValuationParameters...");
            if (typeof getValuationParameters !== 'function') throw new Error("Internal Error: getValuationParameters is not a function.");
            const valuationParams = getValuationParameters(adjEbitda, formData.naicsSector, formData.naicsSubSector);
            console.log("handleSubmit: getValuationParameters ejecutado. Resultado:", valuationParams);
            if (!valuationParams || typeof valuationParams.stage === 'undefined') throw new Error("getValuationParameters did not return expected structure.");
            const { stage, baseMultiple, maxMultiple } = valuationParams;

            console.log("handleSubmit: Preparando para llamar a calculateScores...");
            if (typeof calculateScores !== 'function') throw new Error("Internal Error: calculateScores is not a function.");
            const scores = calculateScores(formData);
            console.log("handleSubmit: calculateScores ejecutado. Resultado:", scores);
            if (!scores || typeof scores !== 'object') throw new Error("calculateScores did not return a valid object.");

            console.log("handleSubmit: Preparando para calcular scorePercentage...");
            const maxPossible = calculateMaxPossibleScore();
            const scorePercentage = maxPossible > 0 ? (Object.values(scores).reduce((sum, s) => sum + (s || 0), 0) / maxPossible) : 0;
            const clampedScorePercentage = Math.max(0, Math.min(1, scorePercentage));
            const finalMultiple = baseMultiple + (maxMultiple - baseMultiple) * clampedScorePercentage;
            const estimatedValuation = adjEbitda >= 0 ? Math.round(adjEbitda * finalMultiple) : 0;

            console.log("handleSubmit: Preparando para llamar a generateImprovementRoadmap...");
            if (typeof generateImprovementRoadmap !== 'function') throw new Error("Internal Error: generateImprovementRoadmap is not a function.");
            const roadmapData = generateImprovementRoadmap(scores, stage);
            console.log("handleSubmit: generateImprovementRoadmap ejecutado. Resultado:", roadmapData);

            localCalcResult = { stage, adjEbitda, baseMultiple, maxMultiple, finalMultiple, estimatedValuation, scores, scorePercentage: clampedScorePercentage, roadmap: roadmapData };
            console.log("handleSubmit: localCalcResult final asignado:", localCalcResult);

            // --- Preparar Payload y Enviar ---
            const payloadToSend = { formData: formData, results: localCalcResult };
            console.log("handleSubmit: Payload preparado:", payloadToSend);

            // --- LÓGICA CONDICIONAL PARA functionUrl ---
            let functionUrl;
            const functionPath = '/.netlify/functions/submit-valuation';

            if (import.meta.env.DEV) {
                const devBaseUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL || '';
                // console.log("handleSubmit [DEV]: Leyendo VITE_NETLIFY_FUNCTIONS_BASE_URL para devBaseUrl:", devBaseUrl); // Log opcional para dev
                if (!devBaseUrl) {
                    console.error("handleSubmit [DEV]: VITE_NETLIFY_FUNCTIONS_BASE_URL no definida en .env para desarrollo local!");
                    throw new Error("Function URL Base not configured for local development in .env file.");
                }
                functionUrl = `${devBaseUrl}${functionPath}`;
            } else {
                functionUrl = functionPath;
                // console.log("handleSubmit [PROD]: Usando ruta relativa para producción."); // Log opcional para prod
            }
            // console.log(`handleSubmit: URL final de la función: ${functionUrl}`); // Log opcional

            console.log("handleSubmit: Intentando JSON.stringify(payloadToSend)...");
            let requestBody = JSON.stringify(payloadToSend);
            // console.log("handleSubmit: JSON.stringify exitoso. Longitud:", requestBody.length); // Log opcional

            console.log("handleSubmit: Preparando para llamar a fetch...");

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestBody
            });
            console.log("handleSubmit: Respuesta fetch recibida, status:", response.status);

            console.log("handleSubmit: Intentando leer respuesta como texto...");
            const responseText = await response.text();
            console.log("handleSubmit: Respuesta como TEXTO:", responseText);

            console.log("handleSubmit: Intentando parsear texto como JSON...");
            const result = JSON.parse(responseText);
            console.log("handleSubmit: Respuesta parseada a JSON:", result);

            if (!result || result.success !== true) {
                 console.error("handleSubmit: Error lógico o de backend detectado en la respuesta parseada:", result);
                 throw new Error(result.error || 'Backend processing failed or returned unexpected format.');
            }

            // --- Éxito ---
            console.log("handleSubmit: Éxito en backend:", result);

            console.log("handleSubmit: Intentando actualizar estado con setCalculationResult...");
            setCalculationResult(localCalcResult);
            console.log("handleSubmit: setCalculationResult llamado.");

            console.log("handleSubmit: Intentando actualizar estado con setSubmissionResult...");
            setSubmissionResult({ success: true, message: result.message || "Submission processed!" });
            console.log("handleSubmit: setSubmissionResult llamado.");

            console.log("handleSubmit: Intentando limpiar localStorage...");
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
            console.log("handleSubmit: localStorage limpiado.");

            console.log("handleSubmit: Actualizaciones de estado de éxito completadas.");

        } catch (error) {
            console.error("handleSubmit: ERROR en bloque catch:", error.message);
            setSubmissionResult({ success: false, message: `Submission Failed: ${error.message}` });
            setCalculationResult(null);
        } finally {
            console.log("handleSubmit: Bloque finally ejecutado.");
            setIsSubmitting(false);
        }
    // Limpiadas dependencias innecesarias de importaciones directas
    }, [formData, calculateScores, generateImprovementRoadmap]);

    // handleNext (Usa handleSubmit)
    const handleNext = useCallback(() => {
        // console.log("handleNext called. Current Step:", currentStep);
        const questionsForThisStep = getQuestionsForStep(currentStep);
        const stepErrors = {}; let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        questionsForThisStep.forEach(q => {
            const value = formData[q.valueKey]; let isEmpty = value == null || value === '' || (typeof value === 'number' && isNaN(value));
            if (q.valueKey === 'ebitdaAdjustments' && value === 0) { isEmpty = false; }
            if (q.required && isEmpty) { stepErrors[q.valueKey] = true; isValid = false; }
            else if (q.type === 'email' && value && !emailRegex.test(value)) { stepErrors[q.valueKey] = true; isValid = false; }
        });
        setErrors(stepErrors); // console.log(`Step ${currentStep} Validation: isValid=${isValid}`, stepErrors);
        if (isValid) {
            if (currentStep < TOTAL_STEPS - 1) { setCurrentStep(prevStep => prevStep + 1); }
            else { handleSubmit(); }
        }
    }, [currentStep, formData, handleSubmit, getQuestionsForStep]); // Añadido getQuestionsForStep

    const handlePrevious = useCallback(() => {
      if (currentStep > 0) {
          setCurrentStep(prevStep => prevStep - 1);
          setErrors({});
      }
  }, [currentStep]);

  const handleStartOver = useCallback(() => {
    // console.log("handleStartOver called");
    setSubmissionResult(null);
    setCalculationResult(null);
    setCurrentStep(0);
    const defaultStructure = { currentRevenue: null, grossProfit: null, ebitda: null, ebitdaAdjustments: 0, userEmail: '', naicsSector: '', naicsSubSector: '' };
    setFormData(defaultStructure);
    setErrors({});
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
}, []);

const handleBackToEdit = useCallback(() => {
  // console.log("handleBackToEdit called");
  setSubmissionResult(null);
  setCalculationResult(null);
}, []);

// --- Nuevo Handler ---
const handleSaveAndSendLink = useCallback(async () => {
    console.log("handleSaveAndSendLink: Iniciando...");
    setIsSendingLink(true);
    setSendLinkResult({ status: 'idle', message: '' }); // Resetear feedback

    // --- Validación rápida: ¿Tenemos email? ---
    if (!formData.userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
        console.warn("handleSaveAndSendLink: Email inválido o faltante en formData.");
        setSendLinkResult({ status: 'error', message: 'Please enter a valid client email first.' });
        setIsSendingLink(false);
        return;
    }

    // Obtener base de URL de funciones
    const functionsBase = getFunctionsBaseUrl(); // Usa la función helper que ya tenemos
    const functionsPath = '/.netlify/functions';
    let currentAssessmentId = null; // Necesitaremos el ID

    try {
        // --- Paso 1: Guardar Progreso (Upsert) ---
        // Necesitamos saber si ya existe un ID para esta sesión.
        // Por ahora, asumimos que si no está en formData, no existe.
        // Una mejor approche sería guardar el ID en el estado cuando se crea/guarda por primera vez.
        // Simplificación: Lo pasamos como null, save-partial se encargará de crear/actualizar
        // y devolverá el ID correcto.
        console.log("handleSaveAndSendLink: Saving partial assessment...");
        const savePayload = {
            assessment_id: formData.assessmentId || null, // ¿Guardamos el ID en formData? Si no, enviar null
            userEmail: formData.userEmail,
            formData: formData
        };
        const saveUrl = `${functionsBase}${functionsPath}/save-partial-assessment`;
        const saveResponse = await fetch(saveUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(savePayload)
        });

        if (!saveResponse.ok) {
            const errorText = await saveResponse.text(); // Leer error si no es OK
            throw new Error(`Failed to save progress (Status ${saveResponse.status}): ${errorText.substring(0,150)}`);
        }

        const saveResult = await saveResponse.json();
        if (!saveResult.success || !saveResult.assessment_id) {
            throw new Error(saveResult.error || 'Failed to save progress or get assessment ID.');
        }

        currentAssessmentId = saveResult.assessment_id;
        console.log(`handleSaveAndSendLink: Progress saved. Assessment ID: ${currentAssessmentId}`);
        // Opcional: Guardar el ID en el estado formData para futuras llamadas
        // setFormData(prev => ({ ...prev, assessmentId: currentAssessmentId }));

        // --- Paso 2: Enviar el Link ---
        console.log("handleSaveAndSendLink: Sending continuation link...");
        const sendPayload = {
            assessment_id: currentAssessmentId,
            userEmail: formData.userEmail
        };
        const sendUrl = `${functionsBase}${functionsPath}/send-continuation-link`;
        const sendResponse = await fetch(sendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sendPayload)
        });

         if (!sendResponse.ok) {
            const errorText = await sendResponse.text();
            throw new Error(`Failed to send link (Status ${sendResponse.status}): ${errorText.substring(0,150)}`);
        }

        const sendResult = await sendResponse.json();
        if (!sendResult.success) {
            throw new Error(sendResult.error || 'Failed to send continuation link.');
        }

        // --- Éxito Total ---
        console.log("handleSaveAndSendLink: Link sent successfully.");
        setSendLinkResult({ status: 'success', message: `Continuation link sent to ${formData.userEmail}` });

    } catch (error) {
        console.error("handleSaveAndSendLink: ERROR:", error);
        setSendLinkResult({ status: 'error', message: error.message || 'An unexpected error occurred.' });
    } finally {
        setIsSendingLink(false); // Terminar estado de carga
    }

}, [formData]);
    // --- Get Questions and Title ---
    // Movido getQuestionsForStep aquí para asegurar que se llame con el currentStep actualizado
    const currentQuestions = getQuestionsForStep(currentStep);
    const currentSectionTitle = sections[currentStep];


    // --- Conditional Rendering Logic ---
    if (submissionResult && submissionResult.success && calculationResult) {
        const userEmailFromFormData = formData?.userEmail;
        const placeholderConsultantLink = "https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview";
        return ( <ResultsDisplay calculationResult={calculationResult} onStartOver={handleStartOver} onBackToEdit={handleBackToEdit} consultantCalendlyLink={placeholderConsultantLink} userEmail={userEmailFromFormData} formData={formData} /> );
    } else if (submissionResult && !submissionResult.success) {
         return ( <div className="submission-result error"><h2>Submission Error</h2><p>{submissionResult.message}</p><div style={{ /*...*/ }}><button type="button" onClick={() => setSubmissionResult(null)}>Back to Form</button></div></div> );
    }

    // --- Renderizado principal del formulario ---
    return (
        <div className="multi-step-form">
            <ProgressIndicator currentStep={currentStep + 1} totalSteps={TOTAL_STEPS} sections={sections} />
            <form onSubmit={(e) => e.preventDefault()}>
                <Step
                    key={currentStep} // Usar currentStep como key puede ser problemático si reutilizas steps, mejor un ID único si es posible
                    stepIndex={currentStep}
                    questions={currentQuestions} // Usa las questions obtenidas arriba
                    formData={formData}
                    handleChange={handleChange}
                    sectionTitle={currentSectionTitle} // Usa el title obtenido arriba
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