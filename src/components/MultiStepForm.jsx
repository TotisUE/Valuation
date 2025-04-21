// src/components/MultiStepForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ScoringAreas, initialScores } from '../scoringAreas'; // Necesario
import {
    sections,                  // Necesario
    getQuestionsForStep,       // Necesario
    calculateMaxPossibleScore, // Necesario
    getValuationParameters,    // Necesario
    // NO importar questionsData directamente
    calculateMaxScoreForArea   // Necesario
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
    useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData)); }, [formData]);
    useEffect(() => { localStorage.setItem(LOCAL_STORAGE_STEP_KEY, currentStep.toString()); }, [currentStep]);
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
            [ScoringAreas.MARKETING]: { title: "Build Marketing & Brand Equity", rationale: "A strong brand and a predictable lead generation engine demonstrate scalable customer acquisition, reducing risk and indicating future growth potential, which buyers value highly.", actionSteps: ["Ask 3 current ideal clients how they found you and why they chose you over alternatives.","Set up basic conversion tracking on your website (e.g., form submissions, calls booked) using Google Analytics or similar.","Define your Cost Per Lead (CPL) for one marketing channel: Total Spend / Number of Leads Generated."], maxScore: 20 },
            [ScoringAreas.OFFERING]: { title: "Achieve Offering Excellence", rationale: "High customer satisfaction, strong differentiation, and consistent quality build reputation and recurring revenue, reducing churn and supporting premium pricing – all positive valuation factors.", actionSteps: ["Implement a simple customer feedback mechanism (e.g., a 1-question post-service email survey or using Net Promoter Score - NPS).","Map out your core service/product delivery process and identify one key step where quality could be improved or standardized.","Analyze your top competitor's main offering – list 2 things they do well and 1 thing your offering does better."], maxScore: 20 },
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

    // handleSubmit (Llama a los helpers internos)
    const handleSubmit = useCallback(async () => {
      console.log("Attempting Submission with Data: ", formData);
      setIsSubmitting(true); setSubmissionResult(null); setCalculationResult(null); setErrors({});
      let localCalcResult = null;
      try {
          // --- Validaciones (Mantener) ---
          const requiredFinancials = ['currentRevenue', 'ebitda'];
          const missingFinancials = requiredFinancials.filter(key => formData[key] == null || isNaN(formData[key]));
          if (missingFinancials.length > 0) throw new Error(`Missing/invalid financials: ${missingFinancials.join(', ')}.`);
          if (!formData.userEmail) throw new Error("Email is required.");
          if (!formData.naicsSector) throw new Error("Industry Sector is required.");
          if (!formData.naicsSubSector) throw new Error("Industry Sub-Sector is required.");

          // --- Cálculos Locales (COMENTAR TEMPORALMENTE) ---
          console.log("Performing local calculations... (SKIPPED FOR DEBUG)");
          /*  // <<<<<<< INICIO COMENTARIO
          const adjEbitda = (formData.ebitda || 0) + (formData.ebitdaAdjustments || 0);
          const { stage, baseMultiple, maxMultiple } = getValuationParameters(adjEbitda, formData.naicsSector, formData.naicsSubSector);
          const scores = calculateScores(formData); // calculateScores usa la versión simplificada de isQualitative, puede fallar
          const scorePercentage = calculateMaxPossibleScore() > 0 ? (Object.values(scores).reduce((sum, s) => sum + (s || 0), 0) / calculateMaxPossibleScore()) : 0;
          const clampedScorePercentage = Math.max(0, Math.min(1, scorePercentage));
          const finalMultiple = baseMultiple + (maxMultiple - baseMultiple) * clampedScorePercentage;
          const estimatedValuation = adjEbitda >= 0 ? Math.round(adjEbitda * finalMultiple) : 0;
          const roadmapData = generateImprovementRoadmap(scores, stage); // generateImprovementRoadmap también puede fallar
          localCalcResult = { stage, adjEbitda, baseMultiple, maxMultiple, finalMultiple, estimatedValuation, scores, scorePercentage: clampedScorePercentage, roadmap: roadmapData };
          */ // <<<<<<< FIN COMENTARIO
          localCalcResult = { stage: 'DebugStage', estimatedValuation: 1000 }; // <<< VALORES FICTICIOS TEMPORALES

             // --- Preparar Payload y Enviar (Modificar para enviar menos datos) ---
             const payloadToSend = {
              formData: formData,
              // Enviar resultados ficticios o mínimos ya que no los calculamos
              results: { stage: localCalcResult?.stage || 'Debug', estimatedValuation: localCalcResult?.estimatedValuation || 0 }
         };
         console.log("Payload to send (DEBUG):", payloadToSend);
         if (!functionsBaseUrl) throw new Error("Function URL Base not configured.");
         const functionUrl = `${functionsBaseUrl}/.netlify/functions/submit-valuation`;
         console.log(`Sending data to: ${functionUrl}`);
         const response = await fetch(functionUrl, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payloadToSend) });
         const result = await response.json();
         if (!response.ok) { console.error("Backend Error:", result); throw new Error(result.error || 'Failed to save submission.'); }

         // --- Éxito (Mostrar resultados ficticios) ---
         console.log("Submission Success Response:", result);
         setCalculationResult(localCalcResult); // Muestra los datos ficticios
         setSubmissionResult({ success: true, message: result.message || "Submission processed! (DEBUG MODE)" });
         localStorage.removeItem(LOCAL_STORAGE_KEY); localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);

     } catch (error) { /* ... (manejo de error sin cambios) ... */ }
     finally { setIsSubmitting(false); }
 }, [formData]); // Quitar helpers de dependencias si se comentaron

    // handlePrevious (Sin cambios)
    const handlePrevious = useCallback(() => { /* ... */ }, [currentStep]);
    // handleStartOver (Sin cambios)
    const handleStartOver = useCallback(() => { /* ... */ }, []);
    // handleBackToEdit (Sin cambios)
    const handleBackToEdit = useCallback(() => { /* ... */ }, []);


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