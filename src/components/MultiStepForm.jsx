import React, { useState, useEffect, useCallback } from 'react';
import { ScoringAreas, initialScores } from '../scoringAreas';
import {sections, getQuestionsForStep, calculateMaxPossibleScore, getValuationParameters, calculateMaxScoreForArea} from '../questions';
import Step from './Step';
import ProgressIndicator from './ProgressIndicator';
import Navigation from './Navigation';
import ResultsDisplay from './results/ResultsDisplay';
// --- Constantes ---
const TOTAL_STEPS = sections.length;
//const TOTAL_STEPS = 1; // <<< Valor fijo temporal
const LOCAL_STORAGE_KEY = 'valuationFormData';
const LOCAL_STORAGE_STEP_KEY = 'valuationFormStep';

// --- Leer VITE_NETLIFY_FUNCTIONS_BASE_URL ---
//const functionsBaseUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL || '';
//console.log("[MultiStepForm] Valor directo de import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL:", import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL);
//console.log("[MultiStepForm COMPONENT SCOPE] Valor directo:", import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL); 
//console.log("[MultiStepForm] Valor asignado a functionsBaseUrl:", functionsBaseUrl);
//console.log("[MultiStepForm COMPONENT SCOPE] functionsBaseUrl:", functionsBaseUrl);
if (!functionsBaseUrl && import.meta.env.MODE !== 'test') {
    console.warn("MultiStepForm: VITE_NETLIFY_FUNCTIONS_BASE_URL not defined.");
}

// --- Componente Principal ---
function MultiStepForm() { // Sin props de Magic Link por ahora

    // --- Estados (Completos) ---
    const [currentStep, setCurrentStep] = useState(() => {
        const savedStep = localStorage.getItem(LOCAL_STORAGE_STEP_KEY);
        const initialStep = savedStep ? parseInt(savedStep, 10) : 0;
        return !isNaN(initialStep) && initialStep >= 0 && initialStep < TOTAL_STEPS ? initialStep : 0;
    });
    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        const defaultStructure = { currentRevenue: null, grossProfit: null, ebitda: null, ebitdaAdjustments: 0, userEmail: '', naicsSector: '', naicsSubSector: '' };
        let baseData = {};
        if (savedData) { try { baseData = JSON.parse(savedData); if (typeof baseData !== 'object' || baseData === null) { baseData = {}; } } catch (error) { /* ... */ } }
        return { ...defaultStructure, ...baseData };
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const [errors, setErrors] = useState({});
    const [sectors, setSectors] = useState([]);
    const [subSectors, setSubSectors] = useState([]);
    const [isSubSectorsLoading, setIsSubSectorsLoading] = useState(false);
    // Estados para Send Link (Añadidos por si acaso se restaura esa funcionalidad)
    // const [isSendingLink, setIsSendingLink] = useState(false);
    // const [sendLinkStatus, setSendLinkStatus] = useState({ message: '', error: false });


    // --- Effects (Completos) ---
    useEffect(() => {
        const fetchNaicsData = async () => {
            setIsSubSectorsLoading(true);
            setSectors([]);
            setSubSectors([]);
            try {
                // 1. Carga el archivo único
                const response = await fetch('/naics-data/all_naics_data.json'); // <-- Apunta al nuevo archivo
                if (!response.ok) throw new Error(`HTTP error ${response.status} fetching all_naics_data.json`);
                const allData = await response.json();
    
                if (Array.isArray(allData)) {
                    // 2. Guarda la estructura completa en el estado 'sectors'
                    setSectors(allData); // 'sectors' contiene [{name, subSectors:[{name},...]}, ...]
    
                    // 3. Si ya hay un sector seleccionado, carga sus subsectores
                    if (formData.naicsSector) {
                        const selectedSectorData = allData.find(s => s.name === formData.naicsSector);
                        if (selectedSectorData && Array.isArray(selectedSectorData.subSectors)) {
                            setSubSectors(selectedSectorData.subSectors);
                        } else {
                            console.warn(`Subsectors not found for initially selected sector: ${formData.naicsSector}`);
                            setSubSectors([]);
                        }
                    }
                } else {
                    console.error("NAICS data is not an array:", allData);
                    setSectors([]);
                }
            } catch (error) {
                console.error("Error fetching NAICS data:", error);
                setSectors([]);
                setSubSectors([]);
            } finally {
                setIsSubSectorsLoading(false);
            }
        };
        fetchNaicsData();
    }, []); // <-- Solo se ejecuta una vez
    
    // V--- NUEVO useEffect para actualizar subsectores CUANDO CAMBIA el sector ---V
    useEffect(() => {
        if (!formData.naicsSector || sectors.length === 0) {
            setSubSectors([]);
            return;
        }
        // Busca en los datos YA CARGADOS
        const selectedSectorData = sectors.find(s => s.name === formData.naicsSector);
    
        if (selectedSectorData && Array.isArray(selectedSectorData.subSectors)) {
            setSubSectors(selectedSectorData.subSectors);
        } else {
            console.warn(`Subsectors not found for selected sector: ${formData.naicsSector}`);
            setSubSectors([]);
        }
    }, [formData.naicsSector, sectors]);


    // --- **Helpers Definidos DENTRO del Componente con useCallback** ---

    // --- calculateScores (Lógica completa, dentro del componente) ---
    const calculateScores = useCallback((formDataToScore) => {
        console.log("Calculating scores for:", Object.keys(formDataToScore).length > 0 ? formDataToScore : "(empty)");
        const scores = initialScores ? { ...initialScores } : {};

        const allQuestions = [];
        sections.forEach((_, index) => { allQuestions.push(...getQuestionsForStep(index)); }); // Usa func importada

        const isQualitative = (q) => q && q.scoringArea && typeof ScoringAreas === 'object' && Object.values(ScoringAreas).includes(q.scoringArea);
        const qualitativeQuestionsNow = allQuestions.filter(isQualitative);

        if (!Array.isArray(qualitativeQuestionsNow)) {
            console.error("calculateScores: Could not get qualitative questions.");
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
    }, []); // Dependencias estables (imports)

    // --- generateImprovementRoadmap (Lógica completa, dentro del componente) ---
    const generateImprovementRoadmap = useCallback((scores, stage) => {
        console.log("Generating roadmap for stage:", stage);
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
        const roadmapContent = { // CONTENIDO COMPLETO RESTAURADO
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
                const maxScoreForArea = calculateMaxScoreForArea(areaKey); // Usa func importada
                const linkText = `-> Watch the "${stage}" section on Acquisition.com for guidance on ${content.title}`;
                roadmapItems.push({ areaName: areaKey, title: content.title, areaScore: areaScore || 0, maxScore: maxScoreForArea, rationale: content.rationale, actionSteps: content.actionSteps, linkText: linkText, linkUrl: targetUrl });
            }
        });
        console.log("Generated roadmap items:", roadmapItems);
        return roadmapItems;
    }, []); // Dependencias estables (imports)


    // --- Handlers ---

    const handleChange = useCallback((event) => {
        console.log('handleChange -> Name:', event.target.name, 'Value:', event.target.value);
        const { name, value, type } = event.target;
        let resetData = {};
        if (name === 'naicsSector') {
            resetData.naicsSubSector = ''; setSubSectors([]);
        }
        setFormData(prevData => ({ ...prevData, ...resetData, [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value }));
        if (errors[name]) { setErrors(prevErrors => { const newErrors = { ...prevErrors }; delete newErrors[name]; return newErrors; }); }
    }, [errors]);

    const handleSubmit = useCallback(async () => {
        console.log("handleSubmit: Iniciando..."); // LOG 1
        setIsSubmitting(true);
        setSubmissionResult(null);
        setCalculationResult(null);
        setErrors({});
        let localCalcResult = null;
    
        try {
            console.log("handleSubmit: Dentro del try, antes de validaciones."); // LOG 2
            // --- Validaciones ---
            if (!formData || !formData.userEmail) throw new Error("Internal Error: formData or userEmail missing before validation."); // <-- Verificación extra
            const requiredFinancials = ['currentRevenue', 'ebitda'];
            const missingFinancials = requiredFinancials.filter(key => formData[key] == null || isNaN(formData[key]));
            if (missingFinancials.length > 0) throw new Error(`Missing/invalid financials: ${missingFinancials.join(', ')}.`);
            if (!formData.naicsSector) throw new Error("Industry Sector is required.");
            if (!formData.naicsSubSector) throw new Error("Industry Sub-Sector is required.");
            console.log("handleSubmit: Validaciones pasadas."); // LOG 3
    
            // --- Aislar error en Cálculos ---
            console.log("handleSubmit: Preparando para calcular adjEbitda...");
            if (typeof formData.ebitda === 'undefined' || typeof formData.ebitdaAdjustments === 'undefined') { // <-- Verificación extra
                 throw new Error("Internal Error: formData.ebitda or ebitdaAdjustments undefined before adjEbitda calc.");
            }
            const adjEbitda = (formData.ebitda || 0) + (formData.ebitdaAdjustments || 0);
            console.log("handleSubmit: adjEbitda calculado =", adjEbitda);
    
            console.log("handleSubmit: Preparando para llamar a getValuationParameters...");
            if (typeof getValuationParameters !== 'function') throw new Error("Internal Error: getValuationParameters is not a function."); // <-- Verificación extra
            const valuationParams = getValuationParameters(adjEbitda, formData.naicsSector, formData.naicsSubSector);
            console.log("handleSubmit: getValuationParameters ejecutado. Resultado:", valuationParams);
            if (!valuationParams || typeof valuationParams.stage === 'undefined') throw new Error("getValuationParameters did not return expected structure."); // <-- Verificación extra
            const { stage, baseMultiple, maxMultiple } = valuationParams; // Desestructurar después de verificar
    
            console.log("handleSubmit: Preparando para llamar a calculateScores...");
            if (typeof calculateScores !== 'function') throw new Error("Internal Error: calculateScores is not a function."); // <-- Verificación extra
            const scores = calculateScores(formData);
            console.log("handleSubmit: calculateScores ejecutado. Resultado:", scores);
            if (!scores || typeof scores !== 'object') throw new Error("calculateScores did not return a valid object."); // <-- Verificación extra
    
            // --- Resto de los cálculos (puedes añadir más logs si es necesario) ---
            console.log("handleSubmit: Preparando para calcular scorePercentage...");
            const maxPossible = calculateMaxPossibleScore();
            const scorePercentage = maxPossible > 0 ? (Object.values(scores).reduce((sum, s) => sum + (s || 0), 0) / maxPossible) : 0;
            const clampedScorePercentage = Math.max(0, Math.min(1, scorePercentage));
            const finalMultiple = baseMultiple + (maxMultiple - baseMultiple) * clampedScorePercentage;
            const estimatedValuation = adjEbitda >= 0 ? Math.round(adjEbitda * finalMultiple) : 0;
    
            console.log("handleSubmit: Preparando para llamar a generateImprovementRoadmap...");
            if (typeof generateImprovementRoadmap !== 'function') throw new Error("Internal Error: generateImprovementRoadmap is not a function."); // <-- Verificación extra
            const roadmapData = generateImprovementRoadmap(scores, stage);
            console.log("handleSubmit: generateImprovementRoadmap ejecutado. Resultado:", roadmapData);
    
            // Asignar localCalcResult
            localCalcResult = { stage, adjEbitda, baseMultiple, maxMultiple, finalMultiple, estimatedValuation, scores, scorePercentage: clampedScorePercentage, roadmap: roadmapData };
            console.log("handleSubmit: localCalcResult final asignado:", localCalcResult);

            // --- Preparar Payload y Enviar ---
            const payloadToSend = { formData: formData, results: localCalcResult };
            console.log("handleSubmit: Payload preparado:", payloadToSend);
    
            // VVV--- LÓGICA CONDICIONAL PARA functionUrl ---VVV
            let functionUrl;
            const functionPath = '/.netlify/functions/submit-valuation'; // Ruta relativa siempre usada
    
            if (import.meta.env.DEV) {
                // **En Desarrollo (netlify dev):** Leer la base del .env y añadir la ruta
                const devBaseUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL || ''; // Leer SÓLO para DEV
                console.log("handleSubmit [DEV]: Leyendo VITE_NETLIFY_FUNCTIONS_BASE_URL para devBaseUrl:", devBaseUrl);
                if (!devBaseUrl) {
                    console.error("handleSubmit [DEV]: VITE_NETLIFY_FUNCTIONS_BASE_URL no definida en .env para desarrollo local!");
                    throw new Error("Function URL Base not configured for local development in .env file.");
                }
                functionUrl = `${devBaseUrl}${functionPath}`;
            } else {
                // **En Producción (desplegado en Netlify):** Usar SÓLO la ruta relativa
                functionUrl = functionPath;
                console.log("handleSubmit [PROD]: Usando ruta relativa para producción.");
            }
            console.log(`handleSubmit: URL final de la función: ${functionUrl}`); // Log de la URL final
            // AAA--- FIN LÓGICA CONDICIONAL ---AAA
    
            console.log("handleSubmit: Intentando JSON.stringify(payloadToSend)...");
            let requestBody = JSON.stringify(payloadToSend); // Simplificado, quitado el try/catch extra aquí
            console.log("handleSubmit: JSON.stringify exitoso. Longitud:", requestBody.length);
    
            console.log("handleSubmit: Preparando para llamar a fetch...");
    
            const response = await fetch(functionUrl, { // <-- Usa la functionUrl condicional
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestBody
            });
            console.log("handleSubmit: Respuesta fetch recibida, status:", response.status);

            // VVV--- LEER COMO TEXTO PRIMERO ---VVV
            console.log("handleSubmit: Intentando leer respuesta como texto...");
            const responseText = await response.text(); // Lee como texto
            console.log("handleSubmit: Respuesta como TEXTO:", responseText);
            // AAA--- FIN LEER COMO TEXTO ---AAA

            console.log("handleSubmit: Intentando parsear texto como JSON..."); // Log antes de parsear
            const result = JSON.parse(responseText); // Intenta parsear el texto manualmente
            console.log("handleSubmit: Respuesta parseada a JSON:", result); // LOG 8

            // Ya no necesitamos response.ok porque response.text() no falla con 4xx/5xx
            // if (!response.ok) { ... } // Podemos comentar o ajustar esta lógica si es necesario

            // Verificar el contenido de 'result' parseado
            if (!result || result.success !== true) { // Asumiendo que el backend SIEMPRE devuelve {success: boolean, ...}
                 console.error("handleSubmit: Error lógico o de backend detectado en la respuesta parseada:", result);
                 // Lanza un error basado en el contenido, no solo en response.ok
                 throw new Error(result.error || 'Backend processing failed or returned unexpected format.');
            }


            // --- Éxito ---
            console.log("handleSubmit: Éxito en backend:", result); // LOG 10 (Mantenido)

            // Actualizar estados para mostrar resultados
            console.log("handleSubmit: Intentando actualizar estado con setCalculationResult..."); // Log antes
            setCalculationResult(localCalcResult);
            console.log("handleSubmit: setCalculationResult llamado."); // Log después

            console.log("handleSubmit: Intentando actualizar estado con setSubmissionResult..."); // Log antes
            setSubmissionResult({ success: true, message: result.message || "Submission processed!" }); // Usar mensaje real
            console.log("handleSubmit: setSubmissionResult llamado."); // Log después

            console.log("handleSubmit: Intentando limpiar localStorage..."); // Log antes
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
            console.log("handleSubmit: localStorage limpiado."); // Log después

            console.log("handleSubmit: Actualizaciones de estado de éxito completadas."); // Log final del bloque try

        } catch (error) {
            console.error("handleSubmit: ERROR en bloque catch:", error.message);
            // console.error("handleSubmit: Full error object:", error); // Descomenta si necesitas más detalle del error
            setSubmissionResult({ success: false, message: `Submission Failed: ${error.message}` });
            setCalculationResult(null);
        } finally {
            console.log("handleSubmit: Bloque finally ejecutado.");
            setIsSubmitting(false);
        }
     // Ajustar dependencias si es necesario (probablemente estén bien)
    }, [formData, calculateScores, generateImprovementRoadmap, functionsBaseUrl]); // Añadido functionsBaseUrl por si acaso

    // handleNext (Usa handleSubmit)
    const handleNext = useCallback(() => {
        console.log("handleNext called. Current Step:", currentStep);
        const questionsForThisStep = getQuestionsForStep(currentStep);
        const stepErrors = {}; let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        questionsForThisStep.forEach(q => {
            const value = formData[q.valueKey]; let isEmpty = value == null || value === '' || (typeof value === 'number' && isNaN(value));
            if (q.valueKey === 'ebitdaAdjustments' && value === 0) { isEmpty = false; }
            if (q.required && isEmpty) { stepErrors[q.valueKey] = true; isValid = false; }
            else if (q.type === 'email' && value && !emailRegex.test(value)) { stepErrors[q.valueKey] = true; isValid = false; }
        });
        setErrors(stepErrors); console.log(`Step ${currentStep} Validation: isValid=${isValid}`, stepErrors);
        if (isValid) {
            if (currentStep < TOTAL_STEPS - 1) { setCurrentStep(prevStep => prevStep + 1); }
            else { handleSubmit(); }
        }
    }, [currentStep, formData, handleSubmit]); // handleSubmit es dependencia

    const handlePrevious = useCallback(() => {
      if (currentStep > 0) {
          setCurrentStep(prevStep => prevStep - 1);
          setErrors({});
      }
  }, [currentStep]); 

  const handleStartOver = useCallback(() => {
    console.log("handleStartOver called"); // Log para confirmar
    // 1. Limpiar resultados para volver a mostrar el formulario
    setSubmissionResult(null);
    setCalculationResult(null);
    // 2. Reiniciar el paso al inicio
    setCurrentStep(0);
    // 3. Reiniciar los datos del formulario (usa la misma lógica inicial)
    const defaultStructure = { currentRevenue: null, grossProfit: null, ebitda: null, ebitdaAdjustments: 0, userEmail: '', naicsSector: '', naicsSubSector: '' };
    setFormData(defaultStructure);
    // 4. Limpiar errores
    setErrors({});
    // 5. Limpiar localStorage (importante para que no recargue datos viejos)
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
}, []);

const handleBackToEdit = useCallback(() => {
  console.log("handleBackToEdit called"); // Log para confirmar
  // Simplemente limpia los resultados para que el renderizado condicional
  // vuelva a mostrar el formulario en el último paso donde estaba.
  // Los datos de formData y currentStep se mantienen.
  setSubmissionResult(null);
  setCalculationResult(null);
  // Opcional: ¿Quizás deberíamos limpiar el localStorage aquí también
  // si no queremos que se guarde el estado de "resultados mostrados"?
  // Depende del comportamiento deseado. Por ahora lo dejamos fuera.
}, []);


    // --- Get Questions and Title (Sin cambios) ---
    const currentQuestions = getQuestionsForStep(currentStep);
    const currentSectionTitle = sections[currentStep];


    // --- Conditional Rendering Logic (Sin cambios) ---
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
                    key={currentStep}
                    stepIndex={currentStep}
                    questions={currentQuestions}
                    formData={formData}
                    handleChange={handleChange} // Correcto
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
                {/* Sección Send Link eliminada temporalmente */}
            </form>
        </div>
    );
}

export default MultiStepForm;