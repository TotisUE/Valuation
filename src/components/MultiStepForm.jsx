// src/components/MultiStepForm.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // MODIFICACIÓN: Añadir useMemo
import { ScoringAreas, initialScores } from '../scoringAreas';
// MODIFICACIÓN: Importar 'sections' como 'allAppSections' para evitar confusión
import { sections as allAppSections, getQuestionsForStep, calculateMaxPossibleScore, getValuationParameters, calculateMaxScoreForArea, getQuestionsDataArray } from '../questions';
import Step from './Step';
import ProgressIndicator from './ProgressIndicator';
import Navigation from './Navigation';
import ResultsDisplay from './results/ResultsDisplay';
import { getFunctionsBaseUrl } from '../utils/urlHelpers';





  // --- Constantes ---
const LOCAL_STORAGE_KEY = 'valuationFormData';
const LOCAL_STORAGE_STEP_KEY = 'valuationFormStep';


// --- Componente Principal ---
function MultiStepForm({ initialFormData = null }) {

    const [formData, setFormData] = useState(() => {
        console.log("MultiStepForm: Initializing formData state...");
        // Define la estructura base incluyendo los nuevos campos

        const defaultStructure = {
            // --- Campos originales existentes ---
            currentRevenue: null, // Movido a paso 0, pero mantener en estado
            grossProfit: null,    // Permanece en paso 8
            ebitda: null,         // Permanece en paso 8
            ebitdaAdjustments: 0, // Permanece en paso 8
            userEmail: '',        // Originalmente en paso 0
            ownerRole: '',        // Originalmente en paso 0
            yearsInvolved: '',    // Originalmente en paso 0
            naicsSector: '',      // Movido a paso 0
            naicsSubSector: '',   // Movido a paso 0
            // --- NUEVOS CAMPOS REQUERIDOS POR ISSUE #27 ---
            employeeCountRange: '',     // NUEVO (Step 0)
            locationState: '',          // NUEVO (Step 0)
            locationZip: '',            // NUEVO (Step 0)
            revenueSourceBalance: '',   // NUEVO (Step 0)
            customerTypeBalance: '',    // NUEVO (Step 0)
            // --- FIN NUEVOS CAMPOS ---
            // ... otros campos existentes que ya tenías ...
            assessmentId: null // Mantener si se usa para save/continue
        };

        if (initialFormData) {
            console.log("MultiStepForm: Initializing with initialFormData prop:", initialFormData);
            localStorage.removeItem(LOCAL_STORAGE_KEY); // Limpiar local si vienen datos iniciales
            localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
             // Fusionar con default para asegurar todos los campos, dando prioridad a initialFormData
            return { ...defaultStructure, ...initialFormData };
        }

        // 2. Leer datos de localStorage (si no hay initialFormData)
        console.log("MultiStepForm: Checking localStorage...");
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        let dataFromStorage = {};
        if (savedData) {
            try {
                dataFromStorage = JSON.parse(savedData);
                if (typeof dataFromStorage !== 'object' || dataFromStorage === null) {
                    dataFromStorage = {}; // Resetear si no es un objeto válido
                }
                 console.log("MultiStepForm: Data loaded from localStorage:", dataFromStorage);
            } catch (error) {
                console.error("MultiStepForm: Error parsing localStorage data", error);
                dataFromStorage = {};
            }
        } else {
             console.log("MultiStepForm: No data found in localStorage.");
        }

        // 3. Leer parámetro 'email' de la URL
        let emailFromUrl = null;
        try {
             // Asegurarse que window está definido (evita errores en SSR si se usara)
             if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                emailFromUrl = params.get('email');
                 if (emailFromUrl) {
                    console.log(`MultiStepForm: Found 'email' parameter in URL: ${emailFromUrl}`);
                 } else {
                    // console.log("MultiStepForm: No 'email' parameter found in URL."); // Log opcional
                 }
            }
        } catch (error) {
             console.error("MultiStepForm: Error reading URL parameters", error);
             emailFromUrl = null;
        }


        // 4. Validar el email de la URL (expresión regular simple)
        let validatedEmailFromUrl = null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex simple
        if (emailFromUrl && emailRegex.test(emailFromUrl)) {
            validatedEmailFromUrl = emailFromUrl;
            console.log(`MultiStepForm: Email from URL (${validatedEmailFromUrl}) is valid.`);
        } else if (emailFromUrl) {
             console.log(`MultiStepForm: Email from URL (${emailFromUrl}) is INVALID.`);
        }

        // 5. Combinar fuentes para el estado inicial
        // Empezar con la estructura por defecto
        let finalInitialState = { ...defaultStructure };
        // Fusionar datos de localStorage
        finalInitialState = { ...finalInitialState, ...dataFromStorage };
         // Si hay un email VÁLIDO de la URL, SOBRESCRIBIR el campo userEmail
        if (validatedEmailFromUrl) {
             console.log(`MultiStepForm: Overwriting userEmail with validated URL email: ${validatedEmailFromUrl}`);
            finalInitialState.userEmail = validatedEmailFromUrl;
        } else if (finalInitialState.userEmail) {
             console.log(`MultiStepForm: Keeping userEmail from localStorage/defaults: ${finalInitialState.userEmail}`);
        } else {
             console.log(`MultiStepForm: No valid email from URL or localStorage. userEmail remains default ('${finalInitialState.userEmail}').`);
        }


        console.log("MultiStepForm: Final initial formData state:", finalInitialState);
        return finalInitialState;
    });
    const [isOwner, setIsOwner] = useState(true); // Asumir dueño inicialmente

const visibleSections = useMemo(() => {
    return allAppSections.filter((sectionName) => {
        if (sectionName === "Your Financials & Industry" && !isOwner) {
            return false;
        }
        return true;
    });
}, [isOwner]); // 'allAppSections' es el array original de questions.js

const TOTAL_STEPS = visibleSections.length;


    const [currentStep, setCurrentStep] = useState(() => {
        if (initialFormData) {
            console.log("MultiStepForm: Received initialFormData, starting at step 0.");
            localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
            return 0;
        }
        const savedStep = localStorage.getItem(LOCAL_STORAGE_STEP_KEY);
        const initialStep = savedStep ? parseInt(savedStep, 10) : 0;
        return !isNaN(initialStep) && initialStep >= 0 && initialStep < TOTAL_STEPS ? initialStep : 0;
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


    // --- Effects (Completos - NAICS Refactorizados) ---
    useEffect(() => {
    if (currentStep >= TOTAL_STEPS && TOTAL_STEPS > 0) { // Añadir TOTAL_STEPS > 0
        setCurrentStep(TOTAL_STEPS - 1);
    } else if (TOTAL_STEPS === 0 && currentStep !== 0) { // Caso extremo si no hay secciones visibles
        setCurrentStep(0);
    }
}, [currentStep, TOTAL_STEPS]);


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
    useEffect(() => {
        // Esta función se ejecutará cada vez que 'currentStep' cambie
        console.log(`MultiStepForm: Step changed to ${currentStep}. Scrolling to top.`);

        // La forma más simple: scroll al inicio de la página
        window.scrollTo(0, 0);

        // Alternativa (si quieres hacer scroll a un elemento específico, como el título del paso):
        // const stepElement = document.getElementById('step-content-container'); // Necesitarías añadir este ID al div que contiene el Step
        // if (stepElement) {
        //     stepElement.scrollIntoView({ behavior: 'smooth' }); // 'smooth' para animación suave
        // }

    }, [currentStep]); 
    // --- **Helpers Definidos DENTRO del Componente con useCallback** ---
    const calculateScores = useCallback((formDataToScore) => {
        // console.log("Calculating scores for:", Object.keys(formDataToScore).length > 0 ? formDataToScore : "(empty)");
        const scores = initialScores ? { ...initialScores } : {};
        const allQuestions = [];
        allAppSections.forEach((_, index) => { allQuestions.push(...getQuestionsForStep(index)); });
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
    }, []); 
    const generateImprovementRoadmap = useCallback((scores, stage, formData) => {
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
  // --- Validación básica de entradas ---
  if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0) {
    console.warn("generateImprovementRoadmap: Scores inválidos o vacíos.");
    return [];
}
 if (!formData || typeof formData !== 'object') {
    console.warn("generateImprovementRoadmap: formData inválido o faltante.");
     return []; // Esencial para la lógica condicional
 }

// ***** INICIO: BLOQUE DE LÓGICA CONDICIONAL FALTANTE REINSERTADO *****
let executeConditionalLogic = false; // Declaración
const marketingAreaKey = ScoringAreas.MARKETING;
const marketingScore = scores[marketingAreaKey] || 0;
const maxMarketingScore = calculateMaxScoreForArea(marketingAreaKey); // Necesitas tener calculateMaxScoreForArea disponible
const marketingScorePercent = maxMarketingScore > 0 ? marketingScore / maxMarketingScore : 0;

const revenueBalance = formData.revenueSourceBalance;
const directSalesRevenueBalances = [
    "Mostly/All Direct (>80% Direct Revenue)",
    "Primarily Direct (approx. 60-80% Direct Revenue)",
    "Roughly Balanced Mix (approx. 40-60% Direct Revenue)"
];

// Verificar la condición de activación
if (marketingScorePercent < 0.80 && directSalesRevenueBalances.includes(revenueBalance)) {
    console.log("generateImprovementRoadmap: CONDICIÓN PRIORIZAR MARKETING CUMPLIDA.");
    executeConditionalLogic = true; // Asignación
} else {
    console.log("generateImprovementRoadmap: Condición marketing no cumplida, usando lógica estándar.");
    // executeConditionalLogic permanece false (su valor inicial)
}
        // --- Construcción del Roadmap ---
        if (executeConditionalLogic) {
            // 1. Añadir Marketing primero
            const marketingContent = roadmapContent[marketingAreaKey];
            if (marketingContent) {
                const linkText = `-> Watch the "${stage}" section on Acquisition.com for guidance on ${marketingContent.title}`;
                roadmapItems.push({
                    areaName: marketingAreaKey,
                    title: marketingContent.title,
                    areaScore: marketingScore,
                    maxScore: maxMarketingScore,
                    rationale: marketingContent.rationale,
                    actionSteps: marketingContent.actionSteps,
                    linkText: linkText,
                    linkUrl: targetUrl
                });
            } else {
                 console.warn("generateImprovementRoadmap: Contenido del roadmap para Marketing no encontrado.");
            }

            // 2. Encontrar las siguientes 2 áreas más bajas (excluyendo Marketing)
            const otherScores = Object.entries(scores)
            .filter(([areaKey]) => areaKey !== marketingAreaKey && Object.values(ScoringAreas).includes(areaKey) && roadmapContent[areaKey])
            .sort(([, scoreA], [, scoreB]) => (scoreA || 0) - (scoreB || 0));
        const nextLowestAreas = otherScores.slice(0, numberOfAreasToShow - 1);

            // 3. Añadir las siguientes 2 áreas al roadmap
            nextLowestAreas.forEach(([areaKey, areaScore]) => {
                const content = roadmapContent[areaKey];
                if (content) {
                    const maxScoreForArea = calculateMaxScoreForArea(areaKey);
                    const linkText = `-> Watch the "${stage}" section on Acquisition.com for guidance on ${content.title}`;
                    roadmapItems.push({
                        areaName: areaKey,
                        title: content.title,
                        areaScore: areaScore || 0,
                        maxScore: maxScoreForArea,
                        rationale: content.rationale,
                        actionSteps: content.actionSteps,
                        linkText: linkText,
                        linkUrl: targetUrl
                    });
                }
            });

        } else {
            // --- Lógica Original: Tomar las 3 áreas con menor puntuación general ---
            const sortedScores = Object.entries(scores)
            .filter(([areaKey]) => Object.values(ScoringAreas).includes(areaKey) && roadmapContent[areaKey])
            .sort(([, scoreA], [, scoreB]) => (scoreA || 0) - (scoreB || 0));
        const areasToImprove = sortedScores.slice(0, numberOfAreasToShow);
        areasToImprove.forEach(([areaKey, areaScore]) => {
            const content = roadmapContent[areaKey];
            if (content) {
                    const maxScoreForArea = calculateMaxScoreForArea(areaKey); // Necesitas calculateMaxScoreForArea
                    const linkText = `-> Watch the "${stage}" section on Acquisition.com for guidance on ${content.title}`;
                    roadmapItems.push({
                        areaName: areaKey,
                        title: content.title,
                        areaScore: areaScore || 0,
                        maxScore: maxScoreForArea,
                        rationale: content.rationale,
                        actionSteps: content.actionSteps,
                        linkText: linkText,
                        linkUrl: targetUrl
                    });
                }
            });
        }
        console.log("Generated roadmap items:", roadmapItems);
        return roadmapItems;
 
    }, [calculateMaxScoreForArea]);

console.log(`[MultiStepForm] Defining currentSectionName. currentStep: ${currentStep}, visibleSections:`, visibleSections);
 const currentSectionName = visibleSections[currentStep];
 console.log("[MultiStepForm] currentSectionName DEFINED AS:", currentSectionName);

 const currentQuestions = useMemo(() => {
     console.log("[MultiStepForm] useMemo for currentQuestions. currentSectionName:", currentSectionName);
     if (currentSectionName === undefined) {
         console.warn("[MultiStepForm] currentSectionName is UNDEFINED in useMemo for currentQuestions. currentStep:", currentStep, "visibleSections:", visibleSections);
         return [];
     }
     const allDefinedQuestions = getQuestionsDataArray();
     if (!Array.isArray(allDefinedQuestions)) {
         console.error("[MultiStepForm] getQuestionsDataArray did not return an array!");
         return [];
     }
     const questions = allDefinedQuestions.filter(q => q.section === currentSectionName);
     console.log(`[MultiStepForm] Questions for ${currentSectionName}:`, questions.length);
     return questions;
 }, [currentSectionName]);


    // --- Handlers ---
    const handleChange = useCallback((event) => {
    const { name, value, type } = event.target;
    let resetData = {};
    if (name === 'naicsSector') {
        resetData.naicsSubSector = '';
        setSubSectors([]); // Esto está bien aquí si setSubSectors es un setter de estado
    }

    setFormData(prevData => {
        const newFormData = {
            ...prevData,
            ...resetData,
            [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value
        };

        // Actualizar isOwner DENTRO del callback de setFormData, usando el 'value' del evento
        if (name === 'ownerRole') {
            setIsOwner(value === 'Owner/Founder');
        }
        return newFormData; // Este return es para el callback de setFormData
    });

    // Limpiar errores para el campo actual
    if (errors[name]) {
        setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
        });
    }
}, [errors, setIsOwner]);


    const handleSubmit = useCallback(async () => {
        console.log("handleSubmit: Iniciando...");
        setIsSubmitting(true);
        setSubmissionResult(null);
        setCalculationResult(null);
        setErrors({});
        let localCalcResult = null;

        try {
            console.log("handleSubmit: Dentro del try, antes de validaciones.");
               console.log("handleSubmit: formData.currentRevenue =", formData.currentRevenue); // <--- AÑADE ESTO
    console.log("handleSubmit: typeof formData.currentRevenue =", typeof formData.currentRevenue); 

            // --- Validaciones ---
            if (!formData || !formData.userEmail) throw new Error("Internal Error: formData or userEmail missing before validation.");
             // === INICIO DE MODIFICACIÓN DE VALIDACIÓN ===
        let requiredFinancials = ['currentRevenue'];
        if (isOwner) { // Solo validar estos si es dueño
            requiredFinancials.push('ebitda');
            // Añade 'grossProfit' aquí si también es un campo requerido de esa sección
            // requiredFinancials.push('grossProfit');
        }
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
            
            if (typeof getValuationParameters !== 'function') throw new Error("Internal Error: getValuationParameters is not a function.");
            const valuationParams = getValuationParameters(adjEbitda, formData.naicsSector, formData.naicsSubSector);
           
            if (!valuationParams || typeof valuationParams.stage === 'undefined') throw new Error("getValuationParameters did not return expected structure.");
            const { stage, baseMultiple, maxMultiple } = valuationParams;

           
            if (typeof calculateScores !== 'function') throw new Error("Internal Error: calculateScores is not a function.");
            const scores = calculateScores(formData);
          
            if (!scores || typeof scores !== 'object') throw new Error("calculateScores did not return a valid object.");

            const maxPossible = calculateMaxPossibleScore();
            const scorePercentage = maxPossible > 0 ? (Object.values(scores).reduce((sum, s) => sum + (s || 0), 0) / maxPossible) : 0;
            const clampedScorePercentage = Math.max(0, Math.min(1, scorePercentage));
            const finalMultiple = baseMultiple + (maxMultiple - baseMultiple) * clampedScorePercentage;
            const estimatedValuation = adjEbitda >= 0 ? Math.round(adjEbitda * finalMultiple) : 0;

            if (typeof generateImprovementRoadmap !== 'function') throw new Error("Internal Error: generateImprovementRoadmap is not a function.");
            const roadmapData = generateImprovementRoadmap(scores, stage, formData);

            localCalcResult = { stage, adjEbitda, baseMultiple, maxMultiple, finalMultiple, estimatedValuation, scores, scorePercentage: clampedScorePercentage, 
                roadmap: roadmapData,isOwner: isOwner };
          

            // --- Preparar Payload y Enviar ---
            const payloadToSend = { formData: formData, results: localCalcResult };

            // --- LÓGICA CONDICIONAL PARA functionUrl ---
            let functionUrl;
            const functionPath = '/.netlify/functions/submit-valuation';

            if (import.meta.env.DEV) {
                const devBaseUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL || '';
                // console.log("handleSubmit [DEV]: Leyendo VITE_NETLIFY_FUNCTIONS_BASE_URL para devBaseUrl:", devBaseUrl); // Log opcional para dev
                if (!devBaseUrl) {
                    throw new Error("Function URL Base not configured for local development in .env file.");
                }
                functionUrl = `${devBaseUrl}${functionPath}`;
            } else {
                functionUrl = functionPath;
                // console.log("handleSubmit [PROD]: Usando ruta relativa para producción."); // Log opcional para prod
            }
            // console.log(`handleSubmit: URL final de la función: ${functionUrl}`); // Log opcional

            
            let requestBody = JSON.stringify(payloadToSend);
            // console.log("handleSubmit: JSON.stringify exitoso. Longitud:", requestBody.length); // Log opcional

            

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestBody
            });
            const responseText = await response.text();
            const result = JSON.parse(responseText);

            if (!result || result.success !== true) {
                 throw new Error(result.error || 'Backend processing failed or returned unexpected format.');
            }

            // --- Éxito ---
            setCalculationResult(localCalcResult);
            setSubmissionResult({ success: true, message: result.message || "Submission processed!" });

            localStorage.removeItem(LOCAL_STORAGE_KEY);
            localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);

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
        const questionsToValidate = currentQuestions; // Usa la variable definida arriba

        const stepErrors = {};
        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

questionsToValidate.forEach(q => {
    const value = formData[q.valueKey];
    // Ajustar la condición de isEmpty para campos numéricos que pueden ser 0
    let isEmpty = value == null || (typeof value === 'string' && value.trim() === '');
    if (q.type === 'number' && value === 0) isEmpty = false; // 0 es un valor válido

    if (q.required && isEmpty) {
        stepErrors[q.valueKey] = true;
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
    // Dependencias correctas
    }, [currentStep, formData, handleSubmit, currentQuestions,TOTAL_STEPS]);

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
            <ProgressIndicator currentStep={currentStep + 1} totalSteps={TOTAL_STEPS} sections={visibleSections} />
            <form onSubmit={(e) => e.preventDefault()}>
            <Step
                key={currentSectionName || currentStep} // Es buena idea usar currentSectionName aquí para el key si es estable
                stepIndex={currentStep}
                questions={currentQuestions}
                formData={formData}
                handleChange={handleChange}
                sectionTitle={currentSectionName} // === CAMBIO REALIZADO AQUÍ ===
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
                     // ¿O aquí? ¿O dentro de algún div/button interno?
                />
            </form>
            {/* ¿O en el renderizado condicional de ResultsDisplay? */}
             {/* {submissionResult && calculationResult ? <ResultsDisplay ... /> : null} */}
        </div>
    );
     // ***** FIN DE LA BÚSQUEDA *****
};

export default MultiStepForm;