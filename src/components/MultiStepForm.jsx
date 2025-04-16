// src/components/MultiStepForm.jsx
// src/components/MultiStepForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ScoringAreas, initialScores } from '../scoringAreas'; // Asumiendo que '../scoringAreas' es correcto
import {
    sections, getQuestionsForStep, calculateMaxPossibleScore,
    getValuationParameters, qualitativeQuestions,
    calculateMaxScoreForArea 
} from '../questions'; // Asumiendo que '../questions' es correcto
import Step from './Step';
import ProgressIndicator from './ProgressIndicator';
import Navigation from './Navigation';
import ResultsDisplay from './results/ResultsDisplay';

// --- Constantes ---
const TOTAL_STEPS = sections.length;
const LOCAL_STORAGE_KEY = 'valuationFormData';
const LOCAL_STORAGE_STEP_KEY = 'valuationFormStep';

// --- Helper: calculateScores ---
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
      if (selectedOption && typeof selectedOption.score === 'number') {
        scores[area] += selectedOption.score; // <-- Aquí se asigna usando la clave 'area'
      } else if (selectedOption) {
        console.warn(`Score value missing/invalid for Question ID: ${question.id}, Answer: "${answer}"`);
      }
    }
  });
  console.log("Calculated Scores (inside calculateScores):", scores); // <-- VERIFICA ESTE LOG
  return scores;
}

// --- Helper: generateImprovementRoadmap ---
function generateImprovementRoadmap(scores, stage) {
  console.log("Generating roadmap for stage:", stage, "with scores:", scores);
  const roadmapItems = [];
  const numberOfAreasToShow = 3;
  const stageToUrlMap = {
    "Pre-Revenue / Negative EBITDA": 'https://www.acquisition.com/training/improvise',
    "Startup": 'https://www.acquisition.com/training/monetize',
    "Mature Start-up": 'https://www.acquisition.com/training/stabilize',
    "Grow-up": 'https://www.acquisition.com/training/prioritize',
    "Mature Grow-up": 'https://www.acquisition.com/training/productize',
    "Scale Up": 'https://www.acquisition.com/training/optimize',
    "Mature Scaleup": 'https://www.acquisition.com/training/specialize',
  };
  const fallbackUrl = 'https://www.acquisition.com/training/stabilize';
  const targetUrl = stageToUrlMap[stage] || fallbackUrl;
  console.log(`Target URL for stage "${stage}": ${targetUrl}`);
  const roadmapContent = { // Asegúrate que los textos de rationale y actionSteps estén completos aquí
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
  console.log("Lowest scoring areas identified:", areasToImprove);

  areasToImprove.forEach(([areaKey, areaScore]) => {
    const content = roadmapContent[areaKey];
    if (content) {
      const linkText = `-> Watch the "${stage}" section on Acquisition.com for guidance on ${content.title}`;
      roadmapItems.push({
        areaName: areaKey, 
        title: content.title, 
        areaScore: areaScore || 0,
        maxScore: calculateMaxScoreForArea(areaKey), 
        rationale: content.rationale, 
        actionSteps: content.
        actionSteps,
        linkText: linkText,
        linkUrl: targetUrl
      });
    }
  });
  console.log("Generated roadmap items:", roadmapItems);
  return roadmapItems;
}

// --- React Component Definition ---
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
      if (savedData) {
        try {
          baseData = JSON.parse(savedData);
          if (typeof baseData !== 'object' || baseData === null) { baseData = {}; }
        } catch (error) {
          console.error("Failed to parse formData from localStorage, resetting state.", error);
          baseData = {};
          try { localStorage.removeItem(LOCAL_STORAGE_KEY); console.log("Removed invalid data from localStorage."); }
          catch (removeError) { console.error("Could not remove invalid item from localStorage:", removeError); }
        }
      }
      return { currentRevenue: null, grossProfit: null, ebitda: null, ebitdaAdjustments: 0, userEmail: '', naicsSector: '', naicsSubSector: '', ...baseData };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);
  const [errors, setErrors] = useState({});

  // --- Effects ---
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData)); }, [formData]);
  useEffect(() => { if(currentStep >= 0 && currentStep < TOTAL_STEPS) { localStorage.setItem(LOCAL_STORAGE_STEP_KEY, currentStep.toString()); } }, [currentStep]);

  // --- Handlers ---

  const handleChange = useCallback((event) => {
    const { name, value, type } = event.target;
    let resetData = {};
    if (name === 'naicsSector') {
        resetData.naicsSubSector = '';
    }
    setFormData(prevData => ({
      ...prevData, ...resetData,
      [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value
    }));
    if (errors[name]) {
        setErrors(prevErrors => { const newErrors = { ...prevErrors }; delete newErrors[name]; return newErrors; });
    }
  }, [errors]);

  // <<< INICIO CÓDIGO COMPLETO HANDLERS >>>
  const handleSubmit = useCallback(async () => {
     console.log("Attempting Submission with Data: ", formData);
     setIsSubmitting(true);
     setSubmissionResult(null);
     setCalculationResult(null);
     setErrors({});
     let localCalcResult = null;
    try {
        // Validaciones
        const requiredFinancials = ['currentRevenue', 'ebitda'];
        const missingFinancials = requiredFinancials.filter(key => formData[key] == null || isNaN(formData[key]));
        if (missingFinancials.length > 0) throw new Error(`Missing or invalid required financial information: ${missingFinancials.join(', ')}.`);
        if (!formData.userEmail) throw new Error("Please enter your email address.");
        if (!formData.naicsSector) throw new Error("Please select your primary Industry Sector.");
        if (!formData.naicsSubSector) throw new Error("Please select your specific Industry Sub-Sector.");
        // Cálculos Locales
        console.log("Performing local calculations before sending...");
        const ebitdaValue = formData.ebitda || 0;
        const adjustmentsValue = formData.ebitdaAdjustments || 0;
        if (isNaN(ebitdaValue) || isNaN(adjustmentsValue)) throw new Error("Invalid number entered for EBITDA or Adjustments.");
        const adjEbitda = ebitdaValue + adjustmentsValue;
        const { stage, baseMultiple, maxMultiple } = getValuationParameters(adjEbitda, formData.naicsSector, formData.naicsSubSector);
        const scores = calculateScores(formData);
        const scorePercentage = calculateMaxPossibleScore() > 0 ? (Object.values(scores).reduce((sum, s) => sum + (s || 0), 0) / calculateMaxPossibleScore()) : 0;
        const clampedScorePercentage = Math.max(0, Math.min(1, scorePercentage));
        const finalMultiple = baseMultiple + (maxMultiple - baseMultiple) * clampedScorePercentage;
        const estimatedValuation = adjEbitda >= 0 ? Math.round(adjEbitda * finalMultiple) : 0;
        // Generar Roadmap
        const roadmapData = generateImprovementRoadmap(scores, stage);
        // Guardar resultados locales
        localCalcResult = { stage, adjEbitda, baseMultiple, maxMultiple, finalMultiple, estimatedValuation, scores, scorePercentage: clampedScorePercentage, roadmap: roadmapData };
        console.log("Local Calculation Result (with Roadmap):", localCalcResult);
        // Preparar Payload y Enviar a Netlify Function
        const payloadToSend = { formData: formData, 
          results: { 
            stage: localCalcResult.stage,
            estimatedValuation: localCalcResult.estimatedValuation,
            finalMultiple: localCalcResult.finalMultiple,
            scorePercentage: localCalcResult.scorePercentage,
            scores: localCalcResult.scores,
           } 
          };
        console.log("Payload to send:", payloadToSend);
        console.log("Sending data to Netlify Function...");
        const response = await fetch('/.netlify/functions/submit-valuation', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payloadToSend) });
        const result = await response.json();
        if (!response.ok) { console.error("Netlify Function Error Response:", result); throw new Error(result.error || 'Failed to save submission to backend.'); }
        console.log("Netlify Function Success Response:", result);
        // Actualizar estado local
        setCalculationResult(localCalcResult);
        setSubmissionResult({ success: true, message: result.message || "Submission processed!" });
        // Limpiar Local Storage
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
    } catch (error) {
        console.error("handleSubmit Error:", error);
        setSubmissionResult({ success: false, message: `Error: ${error.message}` });
    } finally {
        setIsSubmitting(false);
    }
  }, [formData]);

  const handleNext = useCallback(() => {
    const questionsForThisStep = getQuestionsForStep(currentStep);
    const stepErrors = {};
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    console.log(`>>> handleNext: Validating Step ${currentStep}`);
    questionsForThisStep.forEach(question => {
        const value = formData[question.valueKey];
        if (question.required) {
            let isEmpty = value == null || value === '' || (typeof value === 'number' && isNaN(value));
            if (question.valueKey === 'userEmail') {
                if (isEmpty || !emailRegex.test(value)) { stepErrors[question.valueKey] = true; isValid = false; console.log(`   - Validation FAILED for ${question.valueKey}: Required or Invalid Format`); }
                else { console.log(`   - Validation OK for ${question.valueKey}`); }
            } else {
                if (isEmpty) { stepErrors[question.valueKey] = true; isValid = false; console.log(`   - Validation FAILED for ${question.valueKey}: Required`); }
                else { console.log(`   - Validation OK for ${question.valueKey}`); }
            }
        }
    });
    setErrors(stepErrors);
    console.log(`>>> handleNext: Step ${currentStep} Validation Result - isValid: ${isValid}`, "Errors found:", stepErrors);
    if (isValid) {
        console.log(`>>> handleNext: Step ${currentStep} is valid. Proceeding...`);
        if (currentStep < TOTAL_STEPS - 1) {
            setCurrentStep(prevStep => prevStep + 1);
            setErrors({});
        } else {
             console.log(`>>> handleNext: Reached last step (${currentStep}). Triggering handleSubmit.`);
            handleSubmit(); // Llama a handleSubmit
        }
    } else {
        console.log(`>>> handleNext: Step ${currentStep} is invalid. Staying on step.`);
    }
  }, [currentStep, formData, handleSubmit]); // Correct dependencies

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setErrors({});
      setCurrentStep(prevStep => prevStep - 1);
    }
  }, [currentStep]); // Correct dependency

  const handleStartOver = useCallback(() => {
    console.log("Starting over: Clearing local storage and reloading.");
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
    setErrors({});
    window.location.reload();
  }, []); // Correct dependency

  const handleBackToEdit = useCallback(() => {
    console.log("Returning to edit...");
    setSubmissionResult(null);
    setCalculationResult(null);
    setCurrentStep(TOTAL_STEPS > 0 ? TOTAL_STEPS - 1 : 0);
    setErrors({});
  }, []); // Correct dependency (TOTAL_STEPS is stable)



  // --- Get Questions and Title --- (SIN CAMBIOS)
  const currentQuestions = getQuestionsForStep(currentStep);
  const currentSectionTitle = sections[currentStep];


  // --- Conditional Rendering Logic --- (SIN CAMBIOS DESDE LA ÚLTIMA VERSIÓN CORRECTA)
  if (submissionResult && submissionResult.success && calculationResult) {
     console.log('>>> RENDERING ResultsDisplay Component NOW <<<');
     // --- ¡¡¡IMPORTANTE: REEMPLAZA ESTE ENLACE CON TU ENLACE REAL DE CALENDLY!!! ---
     const placeholderConsultantLink = "https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview";

     // Obtener email del formData (asegúrate que formData está accesible aquí)
     const userEmailFromFormData = formData?.userEmail;
     return (
        <ResultsDisplay
            calculationResult={calculationResult}
            onStartOver={handleStartOver}
            onBackToEdit={handleBackToEdit}
            consultantCalendlyLink={placeholderConsultantLink} 
             userEmail={userEmailFromFormData}  
             formData={formData}
        />
     );
  }
  else if (submissionResult && !submissionResult.success) {
      return (
           <div className="submission-result error">
              <h2>Submission Error</h2>
              <p>{submissionResult.message}</p>
               <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                   <button type="button" onClick={() => setSubmissionResult(null) }>Review Answers</button>
               </div>
          </div>
      );
  }
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
         />
         <Navigation
           currentStep={currentStep}
           totalSteps={TOTAL_STEPS}
           onPrevious={handlePrevious}
           onNext={handleNext}
           isSubmitting={isSubmitting}
         />
      </form>
    </div>
  );
}

export default MultiStepForm;