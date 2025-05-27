import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScoringAreas, initialScores } from '../scoringAreas';
import {
    sections as allAppSections,
    getQuestionsForStep,
    calculateMaxPossibleScore,
    getValuationParameters,
    calculateMaxScoreForArea,
    getQuestionsDataArray,
} from '../questions';
import { getSaleToDeliveryProcessQuestions } from '../sections-data/saleToDeliveryQuestions';
import { getDeliveryToSuccessQuestions } from '../sections-data/deliveryToSuccessQuestions';
import Step from './Step';
import ProgressIndicator from './ProgressIndicator';
import Navigation from './Navigation';
import ResultsDisplay from './results/ResultsDisplay';
import SectionResultsPage from './SectionResultsPage'; 
import { getFunctionsBaseUrl } from '../utils/urlHelpers';


const downloadAsTxtFile = (text, filename) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Requerido para Firefox
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
};

const LOCAL_STORAGE_FORM_DATA_KEY = 'valuationFormData';
const LOCAL_STORAGE_CURRENT_STEP_KEY = 'valuationFormCurrentStep';
// ---- USAR ESTAS CONSTANTES consistentemente ----
const LOCAL_STORAGE_CALC_RESULT_KEY = 'valuationCalculationResult';
const LOCAL_STORAGE_SUBMISSION_SUCCESS_KEY = 'valuationSubmissionSuccess';

const buildInitialFormData = () => { /* ... Tu función buildInitialFormData sin cambios ... */ 
    const allQuestions = getQuestionsDataArray();
    const initialFormState = {};
    allQuestions.forEach(q => {
        initialFormState[q.valueKey] = (q.type === 'number') ? null : '';
    });
    initialFormState.ebitdaAdjustments = 0;
    initialFormState.assessmentId = null;
    const profileAndBaseDefaults = {
        userEmail: '', ownerRole: '', naicsSector: '', naicsSubSector: '',
        employeeCount: null, locationState: '', locationZip: '',
        revenueSourceBalance: '', customerTypeBalance: '', currentRevenue: null,
        grossProfit: null, ebitda: null,
        s2d_productName: '', s2d_productDescription: '', s2d_productRevenue: null,
        s2d_q1_process: '', s2d_q1_owner: '', s2d_q2_process: '', s2d_q2_owner: '',
        s2d_q3_process: '', s2d_q3_owner: '', s2d_q4_process: '', s2d_q4_owner: '',
        s2d_q5_process: '', s2d_q5_owner: '', s2d_q6_process: '', s2d_q6_owner: '',
        s2d_q7_process: '', s2d_q7_owner: '', s2d_q8_process: '', s2d_q8_owner: '',
    };
    return { ...profileAndBaseDefaults, ...initialFormState };
};

function MultiStepForm({ initialFormData: initialFormDataProp = null }) {

    const [formData, setFormData] = useState(() => {
        const baseStructure = buildInitialFormData();
        if (initialFormDataProp) {
            localStorage.removeItem(LOCAL_STORAGE_FORM_DATA_KEY);
            localStorage.removeItem(LOCAL_STORAGE_CURRENT_STEP_KEY);
            localStorage.removeItem(LOCAL_STORAGE_CALC_RESULT_KEY);
            localStorage.removeItem(LOCAL_STORAGE_SUBMISSION_SUCCESS_KEY);
            return { ...baseStructure, ...initialFormDataProp };
        }
        const savedData = localStorage.getItem(LOCAL_STORAGE_FORM_DATA_KEY);
        let dataToUse = savedData ? JSON.parse(savedData) : baseStructure; // Cuidado con JSON.parse(null)
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const emailFromUrl = params.get('email');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailFromUrl && emailRegex.test(emailFromUrl)) {
                dataToUse = { ...dataToUse, userEmail: emailFromUrl };
            }
        }
        return dataToUse;
    });


    const [calculationResult, setCalculationResult] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_CALC_RESULT_KEY); // Usa la constante correcta
        try {
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Error parsing calculationResult from localStorage:", e);
            localStorage.removeItem(LOCAL_STORAGE_CALC_RESULT_KEY); // Limpiar si está corrupto
            return null;
        }
    });

    const [submissionSuccess, setSubmissionSuccess] = useState(() => { // Nuevo estado booleano
        const saved = localStorage.getItem(LOCAL_STORAGE_SUBMISSION_SUCCESS_KEY); // Usa la constante correcta
        return saved === 'true'; 
    });

    // Este estado es para el mensaje específico del backend, no necesita persistir entre montajes
    const [submissionBackendResultMsg, setSubmissionBackendResultMsg] = useState(null);


    const visibleSections = useMemo(() => allAppSections, []);
    const TOTAL_STEPS_QUESTIONS = visibleSections.length;

    const [showingSectionResultsFor, setShowingSectionResultsFor] = useState(null); 
const [sectionResultsData, setSectionResultsData] = useState(null);

   const [currentStep, setCurrentStep] = useState(() => {
        if (initialFormDataProp) return 0;
        const savedStep = localStorage.getItem(LOCAL_STORAGE_CURRENT_STEP_KEY); // Usa la constante correcta
        const initialStep = savedStep ? parseInt(savedStep, 10) : 0;
         const maxValidStep = TOTAL_STEPS_QUESTIONS > 0 ? TOTAL_STEPS_QUESTIONS - 1 : 0;
        
        if (isNaN(initialStep) || initialStep < 0 || initialStep > maxValidStep) {
            return 0; // Default a 0 si el valor guardado es inválido
        }
        return initialStep;
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [sectors, setSectors] = useState([]);
    const [subSectors, setSubSectors] = useState([]);
    const [isSubSectorsLoading, setIsSubSectorsLoading] = useState(false);
    const [isSendingLink, setIsSendingLink] = useState(false);
    const [sendLinkResult, setSendLinkResult] = useState({ status: 'idle', message: '' });

useEffect(() => {

    if (TOTAL_STEPS_QUESTIONS > 0 && currentStep >= TOTAL_STEPS_QUESTIONS && !submissionSuccess && !showingSectionResultsFor) {
        setCurrentStep(TOTAL_STEPS_QUESTIONS - 1);
    } else if (TOTAL_STEPS_QUESTIONS === 0 && currentStep !== 0 && !showingSectionResultsFor) {
        setCurrentStep(0);
    }
}, [TOTAL_STEPS_QUESTIONS, currentStep, submissionSuccess, showingSectionResultsFor]);

useEffect(() => {
 if (!submissionSuccess && !showingSectionResultsFor) {
        localStorage.setItem(LOCAL_STORAGE_FORM_DATA_KEY, JSON.stringify(formData));
    }
}, [formData, submissionSuccess, showingSectionResultsFor]);

   useEffect(() => {
    if (!submissionSuccess && !showingSectionResultsFor) {
        localStorage.setItem(LOCAL_STORAGE_CURRENT_STEP_KEY, currentStep.toString());
    }
    window.scrollTo(0, 0);
}, [currentStep, submissionSuccess, showingSectionResultsFor]);

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

 const calculateS2DSectionData = useCallback(() => {
     let s2d_processMaturityScore = 0;
    let s2d_ownerIndependenceScore = 0;
    let s2d_customerExperienceScore = 0; 
    let s2d_growthConnectionScore = 0;
    let s2d_measurementRetentionScore = 0; // Asegúrate que esta esté declarada

    const s2d_detailedAnswers = { 
        customerExperience: {}, 
        growthConnection: {}, 
        measurementRetention: {} 
    };

    let ownerStrategicPositioning = {
        areasForDelegation: [],
        areasForActiveManagement: []
    };

    // Obtener las definiciones de las preguntas S2D UNA VEZ
    // Usaremos esta misma variable para todos los cálculos de S2D
    const s2dQuestionDefinitions = getSaleToDeliveryProcessQuestions(allAppSections[1]); 

    // ValueKeys para cada sub-score (según la guía de scoring)
    const customerExperienceValueKeys = ["s2d_q1_process", "s2d_q3_process", "s2d_q4_process"];
    const growthConnectionValueKeys = ["s2d_q7_process", "s2d_q6_process", "s2d_q8_process"];
    const measurementRetentionValueKeys = ["s2d_q2_process", "s2d_q5_process"];

    // Iterar sobre las preguntas S2D para calcular scores y detailedAnswers
    s2dQuestionDefinitions.forEach(q => {
        const answerValue = formData[q.valueKey];
        if (answerValue && q.options && q.type === 'mcq') {
            const selectedOption = q.options.find(opt => opt.value === answerValue);
            if (selectedOption && typeof selectedOption.score === 'number') {
                const qKeyForDetailed = q.id.split('_')[1]; // ej. "q1", "q2", etc.

                if (q.id.includes('_process')) {
                    s2d_processMaturityScore += selectedOption.score;

                    // Lógica para sub-scores y detailedAnswers
                    if (customerExperienceValueKeys.includes(q.valueKey) && qKeyForDetailed) {
                        s2d_customerExperienceScore += selectedOption.score;
                        s2d_detailedAnswers.customerExperience[qKeyForDetailed] = { 
                            questionText: q.text, 
                            answerText: selectedOption.text, 
                            score: selectedOption.score 
                        };
                    }
                    if (growthConnectionValueKeys.includes(q.valueKey) && qKeyForDetailed) {
                        s2d_growthConnectionScore += selectedOption.score;
                        s2d_detailedAnswers.growthConnection[qKeyForDetailed] = { 
                            questionText: q.text, 
                            answerText: selectedOption.text, 
                            score: selectedOption.score 
                        };
                    }
                    if (measurementRetentionValueKeys.includes(q.valueKey) && qKeyForDetailed) {
                        s2d_measurementRetentionScore += selectedOption.score;
                        s2d_detailedAnswers.measurementRetention[qKeyForDetailed] = { 
                            questionText: q.text, 
                            answerText: selectedOption.text, 
                            score: selectedOption.score 
                        };
                    }
                } else if (q.id.includes('_owner')) {
                    s2d_ownerIndependenceScore += selectedOption.score;
                }
            }
        }
    });

    // Calcular Owner Strategic Positioning (este bucle puede usar las mismas s2dQuestionDefinitions)
    for (let i = 1; i <= 8; i++) {
        const processValueKey = `s2d_q${i}_process`;
        const ownerValueKey = `s2d_q${i}_owner`;

        const processAnswer = formData[processValueKey]; 
        const ownerAnswer = formData[ownerValueKey];   

        const processQDef = s2dQuestionDefinitions.find(q => q.valueKey === processValueKey); // Usa s2dQuestionDefinitions
        const ownerQDef = s2dQuestionDefinitions.find(q => q.valueKey === ownerValueKey);   // Usa s2dQuestionDefinitions

        if (processQDef && ownerQDef && processAnswer && ownerAnswer && processQDef.options && ownerQDef.options) {
            const processOpt = processQDef.options.find(o => o.value === processAnswer);
            const ownerOpt = ownerQDef.options.find(o => o.value === ownerAnswer);

            if (processOpt && ownerOpt && typeof processOpt.score === 'number' && typeof ownerOpt.score === 'number') {
                const pScore = processOpt.score;
                const oScore = ownerOpt.score;
                const qTitle = processQDef.text.substring(0, processQDef.text.indexOf(':')).replace(/^\d+\.\s*/, '').trim() || `Area ${i}`;
                if (pScore >= 5 && (oScore === 0 || oScore === 1)) {
                    ownerStrategicPositioning.areasForDelegation.push(qTitle);
                }
                if (pScore <= 3 && oScore === 5) { 
                    ownerStrategicPositioning.areasForActiveManagement.push(qTitle);
                }
            }
        }
    }

    return {
        isS2D: true,
        s2d_productName: formData.s2d_productName,
        s2d_productDescription: formData.s2d_productDescription,
        s2d_productRevenue: formData.s2d_productRevenue,
        s2d_processMaturityScore,
        s2d_ownerIndependenceScore,
        s2d_customerExperienceScore,
        s2d_growthConnectionScore,
        s2d_measurementRetentionScore, // Asegúrate que se retorna
        s2d_detailedAnswers,           // Asegúrate que se retorna
        s2d_ownerStrategicPositioning: ownerStrategicPositioning,
    };
}, [formData, allAppSections, getSaleToDeliveryProcessQuestions]);

const calculateD2SSectionData = useCallback(() => {
    // Asegúrate que allAppSections[2] es el nombre correcto de tu sección D2S
    const d2sQuestionDefinitions = getDeliveryToSuccessQuestions(allAppSections[2]);
    if (!d2sQuestionDefinitions || d2sQuestionDefinitions.length === 0) {
        console.error("D2S Questions definitions not found or empty for section:", allAppSections[2]);
        return null; // o un objeto con valores por defecto/error
    }

    let d2s_processMaturityScore = 0;
    let d2s_ownerIndependenceScore = 0;

    // Scores para los 6 sub-componentes de "5 R's + Journey"
    let resultsEffectivenessScore = 0;    // Q1, Q2
    let retentionEffectivenessScore = 0;  // Q3, Q4, Q5
    let reviewsIntegrationScore = 0;      // Q6
    let referralsGenerationScore = 0;     // Q7
    let resaleOptimizationScore = 0;      // Q8, Q10
    let journeyManagementScore = 0;       // Q9

    const detailedAnswersSubsections = {
        resultsEffectiveness: { title: "Results Effectiveness (Service/Product Delivery Excellence)", score: 0, maxScore: 14, questions: [] },
        retentionEffectiveness: { title: "Retention Effectiveness (Issue Resolution & Proactive Support)", score: 0, maxScore: 21, questions: [] },
        reviewsIntegration: { title: "Reviews Integration (Feedback Integration & Improvement)", score: 0, maxScore: 7, questions: [] },
        referralsGeneration: { title: "Referrals Generation (Success to Lead Process)", score: 0, maxScore: 7, questions: [] },
        resaleOptimization: { title: "Resale Optimization (Success to Market & Expansion)", score: 0, maxScore: 14, questions: [] },
        journeyManagement: { title: "Journey Management (Customer Journey Maturity)", score: 0, maxScore: 7, questions: [] },
    };

    const ownerStrategicPositioning = {
        areasForDelegation: [],
        areasForActiveManagement: []
    };

    const getAnswerDetails = (question, formDataValue) => {
        if (formDataValue && question.options && question.type === 'mcq') {
            const selectedOption = question.options.find(opt => opt.value === formDataValue);
            if (selectedOption && typeof selectedOption.score === 'number') {
                return {
                    text: selectedOption.text,
                    score: selectedOption.score,
                };
            }
        }
        return { text: '(Not answered or invalid)', score: 0 };
    };

    for (let i = 1; i <= 10; i++) {
        const processValueKey = `d2s_q${i}_process`;
        const ownerValueKey = `d2s_q${i}_owner`;

        const processQuestionDef = d2sQuestionDefinitions.find(q => q.valueKey === processValueKey);
        const ownerQuestionDef = d2sQuestionDefinitions.find(q => q.valueKey === ownerValueKey);

        let processScore = 0;
        let ownerScore = 0;
        let processAnswerText = '(Not answered)';
        // let ownerAnswerText = '(Not answered)'; // No lo usamos directamente aquí

        if (processQuestionDef) {
            const answerDetails = getAnswerDetails(processQuestionDef, formData[processValueKey]);
            processScore = answerDetails.score;
            processAnswerText = answerDetails.text;
            d2s_processMaturityScore += processScore;

            const questionDetail = {
                id: processQuestionDef.id,
                text: processQuestionDef.text,
                answerText: processAnswerText,
                answerScore: processScore
            };

            // Asignar a sub-scores y detailedAnswers
            if (i === 1 || i === 2) { // Results Effectiveness
                resultsEffectivenessScore += processScore;
                detailedAnswersSubsections.resultsEffectiveness.questions.push(questionDetail);
            } else if (i >= 3 && i <= 5) { // Retention Effectiveness
                retentionEffectivenessScore += processScore;
                detailedAnswersSubsections.retentionEffectiveness.questions.push(questionDetail);
            } else if (i === 6) { // Reviews Integration
                reviewsIntegrationScore += processScore;
                detailedAnswersSubsections.reviewsIntegration.questions.push(questionDetail);
            } else if (i === 7) { // Referrals Generation
                referralsGenerationScore += processScore;
                detailedAnswersSubsections.referralsGeneration.questions.push(questionDetail);
            } else if (i === 8 || i === 10) { // Resale Optimization
                resaleOptimizationScore += processScore;
                detailedAnswersSubsections.resaleOptimization.questions.push(questionDetail);
            } else if (i === 9) { // Journey Management
                journeyManagementScore += processScore;
                detailedAnswersSubsections.journeyManagement.questions.push(questionDetail);
            }
        }

        if (ownerQuestionDef) {
            const answerDetails = getAnswerDetails(ownerQuestionDef, formData[ownerValueKey]);
            ownerScore = answerDetails.score;
            // ownerAnswerText = answerDetails.text; // No es necesario para el strategic positioning object
            d2s_ownerIndependenceScore += ownerScore;
        }

        // Calcular Owner Strategic Positioning (solo si la pregunta de proceso existe)
        if (processQuestionDef) {
            const qTitle = processQuestionDef.text.substring(0, processQuestionDef.text.indexOf(':')).replace(/^\d+\.\s*/, '').trim() || `Area ${i}`;
            // Condición para delegación: Proceso ALTO (score 5 o 7) Y Owner MUY INVOLUCRADO (score 0 o 1)
            if (processScore >= 5 && (ownerScore === 0 || ownerScore === 1)) {
                ownerStrategicPositioning.areasForDelegation.push(qTitle);
            }
            // Condición para gestión activa: Proceso BAJO (score 0-3) Y Owner POCO INVOLUCRADO (score 5)
            if (processScore <= 3 && ownerScore === 5) {
                ownerStrategicPositioning.areasForActiveManagement.push(qTitle);
            }
        }
    }

    detailedAnswersSubsections.resultsEffectiveness.score = resultsEffectivenessScore;
    detailedAnswersSubsections.retentionEffectiveness.score = retentionEffectivenessScore;
    detailedAnswersSubsections.reviewsIntegration.score = reviewsIntegrationScore;
    detailedAnswersSubsections.referralsGeneration.score = referralsGenerationScore;
    detailedAnswersSubsections.resaleOptimization.score = resaleOptimizationScore;
    detailedAnswersSubsections.journeyManagement.score = journeyManagementScore;

    return {
        isD2S: true, // Para identificar estos datos fácilmente
        d2s_processMaturityScore,
        d2s_ownerIndependenceScore,
        // Los 6 sub-scores
        d2s_resultsEffectivenessScore: resultsEffectivenessScore,
        d2s_retentionEffectivenessScore: retentionEffectivenessScore,
        d2s_reviewsIntegrationScore: reviewsIntegrationScore,
        d2s_referralsGenerationScore: referralsGenerationScore,
        d2s_resaleOptimizationScore: resaleOptimizationScore,
        d2s_journeyManagementScore: journeyManagementScore,
        // Detailed answers estructurado
        d2s_detailedAnswers: detailedAnswersSubsections,
        // Owner strategic positioning
        d2s_ownerStrategicPositioning: ownerStrategicPositioning,
    };
}, [formData, allAppSections, getDeliveryToSuccessQuestions]); // Añadir getDeliveryToSuccessQuestions aquí

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
    }, [errors]);

const generateS2DPromptTextInternal = useCallback((
       allFormData,
    s2dQuestionDefinitions
) => {
    if (!allFormData || !s2dQuestionDefinitions || s2dQuestionDefinitions.length === 0) {
        console.error("generateS2DPromptTextInternal: Missing critical data for S2D prompt.");
        return "Error: Could not generate S2D prompt due to missing data or question definitions.";
    }

    let output = "##Sale to Delivery Current Company Scoring##\n\n";

    // --- Owner Strategic Positioning ---
    // (Esta lógica se mantiene igual)
    output += "**Owner Strategic Positioning**\n";
    const areasForDelegation = [];
    const areasForActiveManagement = [];

    for (let i = 1; i <= 8; i++) {
        const processValueKey = `s2d_q${i}_process`;
        const ownerValueKey = `s2d_q${i}_owner`;
        const processAnswerValue = allFormData[processValueKey];
        const ownerAnswerValue = allFormData[ownerValueKey];

        const processQDef = s2dQuestionDefinitions.find(q => q.valueKey === processValueKey);
        const ownerQDef = s2dQuestionDefinitions.find(q => q.valueKey === ownerValueKey);

        if (processQDef && ownerQDef && processAnswerValue && ownerAnswerValue && processQDef.options && ownerQDef.options) {
            const processOpt = processQDef.options.find(o => o.value === processAnswerValue);
            const ownerOpt = ownerQDef.options.find(o => o.value === ownerAnswerValue);

            if (processOpt && ownerOpt && typeof processOpt.score === 'number' && typeof ownerOpt.score === 'number') {
                const pScore = processOpt.score;
                const oScore = ownerOpt.score;
                const qTitle = processQDef.text.substring(0, processQDef.text.indexOf(':')).replace(/^\d+\.\s*/, '').trim() || `Area ${i}`;

                if (pScore >= 5 && (oScore === 0 || oScore === 1)) {
                    areasForDelegation.push(qTitle);
                }
                if (pScore <= 3 && oScore === 5) {
                    areasForActiveManagement.push(qTitle);
                }
            }
        }
    }
    output += "Areas for strategic oversight (delegation opportunities): "
        + (areasForDelegation.length > 0 ? areasForDelegation.join(', ') : "None identified")
        + ". User wants to begin delegating these areas to other members of the team.\n";
    output += "Areas for active management: "
        + (areasForActiveManagement.length > 0 ? areasForActiveManagement.join(', ') : "None identified")
        + ". User wants to become actively involved in these areas to bring up competency. AI should share information whenever possible on best practices, templates, etc.\n\n";

    // --- Bloques de Texto para las 8 Áreas de Proceso S2D (AHORA MÁS "ENTERO") ---
    output += "--- Sale to Delivery Process Areas ---\n\n"; // Nuevo subtítulo general

    const s2dPromptTemplates = {
        s2d_q1_process: { title: "Contract and Payment Processing", text: "Contract and Payment Processing: Current contract and payment processes need standardization and automation. The business currently uses [%RESPONSE%]. AI should actively suggest improvements to contract workflows, including standardized templates, digital signature implementation, and automated follow-up sequences. When discussing new client engagements, proactively recommend contract tracking systems, payment reminder templates, documentation of payment terms, and refund language. Prioritize solutions that reduce manual handling while ensuring consistency and compliance." },
        s2d_q2_process: { title: "Internal Handoff from Sales to Delivery Team", text: "Internal Handoff Process: The current sales-to-delivery handoff process requires improvement. The business currently experiences [%RESPONSE%]. AI should suggest structured handoff protocols including standardized information checklists, handoff meeting templates, and responsibility assignment matrices. When discussing client onboarding or project initiation, proactively recommend implementing a formal handoff document that captures all essential client details, project parameters, and commitments made during sales. Prioritize creating clear accountability for information completeness and accuracy during transitions between teams." },
        s2d_q3_process: { title: "Client Onboarding Process", text: "Client Onboarding Process: The client onboarding experience needs strengthening and systematization. The business currently uses [%RESPONSE%]. AI should recommend comprehensive onboarding frameworks including welcome sequence templates, client information collection forms, and expectation-setting documents. When discussing new clients or delivery processes, suggest implementing structured milestone-based onboarding with clear touchpoints, resource provision schedules, and feedback collection. Prioritize creating a consistent, replicable onboarding experience that builds client confidence while efficiently gathering all information needed for successful delivery." },
        s2d_q4_process: { title: "Asset and Information Collection", text: "Asset and Information Collection: The process for gathering client information and assets needs improvement. The business currently relies on [%RESPONSE%]. AI should suggest structured information collection systems including standardized intake forms, asset checklists, automated reminder sequences, and completion tracking. When discussing project initiation or client management, recommend implementing a central repository for client assets with clear categorization, version control, and accessibility protocols. Prioritize solutions that reduce the friction in collecting necessary information, minimize back-and-forth communications, and establish clear visibility into what's been received versus what's still pending." },
        s2d_q5_process: { title: "Expectations and Success Metrics Definition", text: "Expectations and Success Metrics Definition: The business needs a more structured approach to defining and documenting success metrics with clients. Currently, [%RESPONSE%]. AI should suggest frameworks for establishing clear, measurable success metrics including templates for different service/product types, collaborative goal-setting processes, and documentation formats that capture both qualitative and quantitative measures. When discussing client projects or deliverables, proactively recommend defining SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound) for each engagement. Prioritize creating alignment between client expectations and internal delivery parameters, ensuring all teams understand what constitutes success for each client." },
        s2d_q6_process: { title: "Scheduling and Resource Allocation", text: "Scheduling and Resource Allocation: The business lacks a sufficiently structured approach to scheduling work and allocating resources after sales. Currently, [%RESPONSE%]. AI should recommend resource planning frameworks including capacity management tools, visual scheduling systems, and forecasting templates that account for team bandwidth and project requirements. When discussing project planning or team management, suggest implementing formalized resource allocation processes with clear visibility into team availability, skill requirements, and project timelines. Prioritize solutions that prevent resource conflicts, provide early warning of potential capacity issues, and ensure appropriate expertise is assigned to each project phase." },
        s2d_q7_process: { title: "Client Communication Plan", text: "Client Communication Plan: The communication strategy during the transition from sale to delivery requires strengthening. Currently, [%RESPONSE%]. AI should suggest comprehensive communication planning frameworks including client communication calendars, touchpoint schedules, channel preference documentation, and escalation protocols. When discussing client relationships or project management, recommend establishing predefined communication cadences with clear frequency, channel guidelines, and responsibility assignments for each client type. Prioritize creating consistent, proactive communication processes that set appropriate expectations, reduce client anxiety, and maintain engagement throughout the delivery phase." },
        s2d_q8_process: { title: "Technology and Tools Integration", text: "Technology and Tools Integration: The current technology ecosystem supporting the sale-to-delivery transition requires enhancement. Currently, [%RESPONSE%]. AI should recommend technology integration approaches including system connection strategies, workflow automation tools, and data synchronization methods that reduce duplicate entry and information loss between stages. When discussing operational improvements or efficiency, suggest implementing integrated platforms or middleware solutions that create seamless information flow between sales and delivery systems. Prioritize solutions that eliminate manual workarounds, reduce error risk during handoffs, and provide complete visibility of client information throughout the customer journey." },
    };

    // Iterar sobre las 8 áreas de proceso S2D, q1 a q8
    for (let i = 1; i <= 8; i++) {
        const processValueKey = `s2d_q${i}_process`;
        const qDef = s2dQuestionDefinitions.find(q => q.valueKey === processValueKey);

        if (qDef && s2dPromptTemplates[processValueKey]) {
            const sectionInfo = s2dPromptTemplates[processValueKey];
            output += `**${sectionInfo.title}**\n`; // Siempre mostrar el título del área

            const answerValue = allFormData[processValueKey];
            if (answerValue && qDef.options) {
                const selectedOpt = qDef.options.find(o => o.value === answerValue);

                if (selectedOpt && typeof selectedOpt.score === 'number') {
                    if (selectedOpt.score < 5) {
                        // Score bajo: mostrar el texto detallado del template con la respuesta del usuario
                        output += sectionInfo.text.replace("[%RESPONSE%]", `"${selectedOpt.text}"`) + "\n\n";
                    } else {
                        // Score alto (>=5): mostrar un mensaje genérico indicando que está bien
                        output += `Current approach: "${selectedOpt.text}" (Score: ${selectedOpt.score}). This area appears to be adequately managed or performing well based on your response. No immediate critical actions suggested for the AI prompt regarding this specific process, but continuous improvement is always valuable.\n\n`;
                    }
                } else {
                    // No se pudo determinar el score o no hay opción seleccionada
                    output += "Could not determine score for this area or no answer provided.\n\n";
                }
            } else {
                // No hay respuesta para esta pregunta de proceso
                output += "No answer provided for this area.\n\n";
            }
        }
    }
    return output;
}, []);

const generateD2SPromptTextInternal = useCallback((
    allFormData, // El objeto formData completo
    d2sCalculatedData, 
    d2sQuestionDefinitions // Las definiciones de las preguntas D2S
) => {
    if (!allFormData || !d2sCalculatedData || !d2sQuestionDefinitions || d2sQuestionDefinitions.length === 0) {
        console.error("generateD2SPromptTextInternal: Missing critical data for D2S prompt.");
        return "Error: Could not generate D2S prompt due to missing data.";
    }

    let output = "##Delivery to Success Current Company Scoring##\n\n";

    // --- Owner Strategic Positioning (D2S) ---
    output += "**Owner Strategic Positioning (Delivery to Success)**\n";
    if (d2sCalculatedData.d2s_ownerStrategicPositioning) {
        const { areasForDelegation, areasForActiveManagement } = d2sCalculatedData.d2s_ownerStrategicPositioning;
        output += "Areas for strategic oversight (delegation opportunities): "
            + (areasForDelegation.length > 0 ? areasForDelegation.join(', ') : "None identified")
            + ". User wants to begin delegating these areas to other members of the team.\n";
        output += "Areas for active management: "
            + (areasForActiveManagement.length > 0 ? areasForActiveManagement.join(', ') : "None identified")
            + ". User wants to become actively involved in these areas to bring up competency. AI should share information whenever possible on best practices, templates, etc.\n\n";
    } else {
        output += "Owner strategic positioning data not available.\n\n";
    }

    // --- Master Prompt Enhancement Templates ---
    output += "--- Master Prompt Enhancement Templates (D2S) ---\n\n";

    // 1. Customer Experience Quality Scores (basado en d2s_resultsEffectivenessScore, max 14)
    const cxScore = d2sCalculatedData.d2s_resultsEffectivenessScore;
    if (cxScore <= 7) { // 0-7 Puntos - CRITICAL
        output += "**For Customer Experience Quality Scores (0-7 Points) - CRITICAL**\n";
        output += "Delivery to Success - Current Status: CRITICAL\n";
        output += "Our service/product delivery process is largely undefined with minimal quality control. We lack systematic customer success measurement and have ad-hoc issue resolution processes. Customer support is primarily reactive. My immediate priorities are:\n\n";
        output += "1. Develop basic delivery checklists and quality standards for [PRODUCT/SERVICE]\n";
        output += "2. Implement simple customer feedback collection at key touchpoints\n";
        output += "3. Create a standardized process for responding to and documenting customer issues\n";
        output += "4. Establish regular check-ins with customers during the delivery period\n\n";
        output += "Key improvement opportunities:\n";
        output += "- Document our core delivery steps with clear responsibilities\n";
        output += "- Define minimum quality standards for each delivery component\n";
        output += "- Create a simple issue tracking system accessible to all team members\n";
        output += "- Implement basic post-delivery satisfaction measurement\n\n";
    } else if (cxScore >= 8 && cxScore <= 14) { // 8-14 Puntos - BASIC
        output += "**For Customer Experience Quality Scores (8-14 Points) - BASIC**\n";
        output += "Delivery to Success - Current Status: BASIC\n";
        output += "Our product/service delivery has some basic procedures but lacks consistency and systematic quality control. Customer success measurement and issue resolution are informal and reactive. We need to strengthen our core delivery processes. My priorities are:\n\n";
        output += "1. Systematize our delivery processes with clear checkpoints and quality standards\n";
        output += "2. Implement consistent customer feedback collection with simple metrics (NPS/CSAT)\n";
        output += "3. Develop a formal system for tracking and resolving customer issues\n";
        output += "4. Create proactive customer success check-ins at predefined intervals\n\n";
        output += "Key improvement opportunities:\n";
        output += "- Document and standardize our delivery workflow across team members\n";
        output += "- Build simple dashboards to track delivery quality metrics\n";
        output += "- Train team members on quality standards and issue resolution\n";
        output += "- Implement a consistent approach to measuring customer satisfaction\n\n";
    }
    // Añadir aquí la lógica para el template "DEVELOPING (15-21 Points)" si confirmas su rango y aplicabilidad para un maxScore de 14.
    // Por ejemplo, si es solo para score == 14:
    // else if (cxScore === 14) { // Asumiendo que 15-21 era un typo y el "developing" se activa si el score es alto pero aún no perfecto, o si hay un rango específico.
    //     output += "**For Customer Experience Quality Scores (DEVELOPING - Score 14)**\n"; // Ajusta título y contenido
    //     output += "Delivery to Success - Optimization Focus:\n";
    //     output += "Our delivery processes are established but can be optimized. Key enhancement priorities:\n";
    //     output += "1. Automate quality control checkpoints at critical delivery phases\n";
    //     output += "2. Segment customer feedback analysis for more targeted improvements\n";
    //     output += "3. Implement predictive issue identification based on pattern recognition\n";
    //     output += "4. Enhance proactive success management with personalized strategies by customer segment\n\n";
    // }


    // 2. Growth Connection Effectiveness Scores (basado en referrals + resale, max 21)
    const growthScore = (d2sCalculatedData.d2s_referralsGenerationScore || 0) + (d2sCalculatedData.d2s_resaleOptimizationScore || 0);
    if (growthScore <= 7) { // 0-7 Puntos - CRITICAL
        output += "**For Growth Connection Effectiveness Scores (0-7 Points) - CRITICAL**\n";
        output += "Success to Lead & Success to Market - Current Status: CRITICAL\n";
        output += "We rarely convert successful customers into advocates or referral sources. Customer feedback isn't systematically incorporated into product/service improvements. We don't effectively leverage success stories in marketing/sales. My immediate priorities are:\n\n";
        output += "1. Implement basic processes for requesting testimonials and referrals\n";
        output += "2. Create a simple system for collecting and reviewing product/service feedback\n";
        output += "3. Develop a basic approach for creating case studies from successful engagements\n";
        output += "4. Establish minimum communication between success, marketing, and sales teams\n\n";
        output += "Key improvement opportunities:\n";
        output += "- Create standardized templates for collecting testimonials\n";
        output += "- Implement a basic referral incentive program\n";
        output += "- Develop simple feedback review sessions for product/service improvement\n";
        output += "- Create a basic case study template and identification process\n\n";
    } else if (growthScore >= 8 && growthScore <= 14) { // 8-14 Puntos - BASIC
        output += "**For Growth Connection Effectiveness Scores (8-14 Points) - BASIC**\n";
        output += "Success to Lead & Success to Market - Current Status: BASIC\n";
        output += "We occasionally develop customer advocates and referrals but lack systematic processes. Feedback collection exists but implementation is inconsistent. Success stories are used in marketing but not strategically. My priorities are:\n\n";
        output += "1. Formalize our advocacy development program with clear identification criteria\n";
        output += "2. Systematize our feedback collection and implementation process\n";
        output += "3. Create a strategic approach to case study development and deployment\n";
        output += "4. Improve integration between customer success, marketing, and sales teams\n\n";
        output += "Key improvement opportunities:\n";
        output += "- Implement a formal customer advocacy program with clear benefits\n";
        output += "- Create a structured feedback review process that influences roadmap decisions\n";
        output += "- Develop a content calendar for success stories across marketing channels\n";
        output += "- Establish regular cross-functional meetings between success and marketing teams\n\n";
    } else if (growthScore >= 15 && growthScore <= 21) { // 15-21 Puntos - DEVELOPING
        output += "**For Growth Connection Effectiveness Scores (15-21 Points) - DEVELOPING**\n";
        output += "Success to Lead & Market - Optimization Focus:\n";
        output += "Our advocacy and marketing integration processes work well but can be enhanced. Priorities:\n";
        output += "1. Develop tiered, personalized advocacy programs by customer segment\n";
        output += "2. Implement feedback-driven innovation sessions with cross-functional teams\n";
        output += "3. Measure ROI of success stories across marketing channels\n";
        output += "4. Create automated workflows between success and marketing teams\n\n";
    }

    // 3. Measurement & Retention Effectiveness Scores (basado en retention + reviews + journey, max 35)
    const measureRetainScore = (d2sCalculatedData.d2s_retentionEffectivenessScore || 0) +
                               (d2sCalculatedData.d2s_reviewsIntegrationScore || 0) +
                               (d2sCalculatedData.d2s_journeyManagementScore || 0);
    if (measureRetainScore <= 4) { // 0-4 Puntos - CRITICAL
        output += "**For Measurement & Retention Effectiveness Scores (0-4 Points) - CRITICAL**\n";
        output += "Customer Measurement & Retention - Current Status: CRITICAL\n";
        output += "We lack systematic approaches to measuring customer success and managing retention/renewals. Our visibility into customer health is minimal, and our retention efforts are reactive. My immediate priorities are:\n\n";
        output += "1. Implement basic success metrics for all customers\n";
        output += "2. Create a simple system for tracking renewal/repurchase dates\n";
        output += "3. Develop an initial process for identifying at-risk customers\n";
        output += "4. Establish minimum standards for demonstrating ongoing value\n\n";
        output += "Key improvement opportunities:\n";
        output += "- Define essential success metrics relevant to our product/service\n";
        output += "- Create a basic customer health scorecard\n";
        output += "- Implement a simple renewal/repurchase tracking system\n";
        output += "- Develop standard check-in points before renewal periods\n\n";
    } else if (measureRetainScore >= 5 && measureRetainScore <= 9) { // 5-9 Puntos - BASIC
        output += "**For Measurement & Retention Effectiveness Scores (5-9 Points) - BASIC**\n";
        output += "Customer Measurement & Retention - Current Status: BASIC\n";
        output += "We have basic approaches to measuring customer success and managing retention. Our renewal processes exist but lack optimization. At-risk customer identification is inconsistent. My priorities are:\n\n";
        output += "1. Formalize our success measurement framework with consistent metrics\n";
        output += "2. Systematize our renewal/repurchase process with clear ownership\n";
        output += "3. Develop a more robust approach to identifying and addressing at-risk customers\n";
        output += "4. Create structured value reinforcement touchpoints throughout the customer lifecycle\n\n";
        output += "Key improvement opportunities:\n";
        output += "- Implement consistent success metrics aligned with customer goals\n";
        output += "- Create a formal renewal/repurchase playbook with standard timelines\n";
        output += "- Develop early warning indicators for customer churn risk\n";
        output += "- Establish regular business review sessions with key customers\n\n";
    } else if (measureRetainScore >= 10 && measureRetainScore <= 14) { // 10-14 Puntos - DEVELOPING
        output += "**For Measurement & Retention Effectiveness Scores (10-14 Points) - DEVELOPING**\n";
        output += "Customer Measurement & Retention - Optimization Focus:\n";
        output += "Our measurement and retention systems are functional but can be enhanced. Priorities:\n";
        output += "1. Implement segmented success dashboards with predictive metrics\n";
        output += "2. Create renewal forecasting based on usage patterns and engagement data\n";
        output += "3. Develop proactive intervention playbooks for various risk scenarios\n";
        output += "4. Build ROI calculators that demonstrate concrete value delivered\n\n";
    }
    // Considerar si se necesitan más rangos si el max es 35.

    // 4. Owner Independence Scores (basado en d2s_ownerIndependenceScore, max 50)
    const ownerScore = d2sCalculatedData.d2s_ownerIndependenceScore;
    if (ownerScore <= 17) { // 0-17 Puntos - CRITICAL/CONCERNING
        output += "**For Owner Independence Scores (0-17 Points) - CRITICAL/CONCERNING**\n";
        output += "Owner Dependency in Delivery & Success - Current Status: HIGHLY DEPENDENT\n";
        output += "The owner is deeply involved in day-to-day delivery, customer success management, and issue resolution. This creates bottlenecks and limits scalability. My priorities for reducing owner dependency are:\n\n";
        output += "1. Document the owner's key activities and decision points in all customer-facing processes\n";
        output += "2. Identify which activities truly require owner involvement versus those that can be delegated\n";
        output += "3. Develop clear decision-making frameworks to enable team members to handle routine situations\n";
        output += "4. Create training materials capturing the owner's expertise and approach\n\n";
        output += "Key improvement opportunities:\n";
        output += "- Create standard operating procedures for all routine delivery and success processes\n";
        output += "- Implement delegation tiers with escalation criteria for different scenarios\n";
        output += "- Develop training programs to transfer knowledge from owner to team members\n";
        output += "- Establish regular case reviews to build team capability without owner involvement\n\n";
    } else if (ownerScore >= 18 && ownerScore <= 26) { // 18-26 Puntos - DEVELOPING
        output += "**For Owner Independence Scores (18-26 Points) - DEVELOPING**\n";
        output += "Owner Dependency - Optimization Focus:\n";
        output += "Some delegation exists but can be expanded. Priorities:\n";
        output += "1. Implement decision frameworks that reduce owner consultation needs\n";
        output += "2. Expand team authority with clearer decision rights\n";
        output += "3. Create scenario-based training programs for independent team action\n";
        output += "4. Develop decision logs to systematically expand delegation boundaries\n\n";
    }
    // Considerar si se necesitan más rangos para cubrir hasta 50.

    return output;
}, []); // No necesita dependencias si d2sCalculatedData se pasa como argumento y no se accede a `formData` directamente

    const handleGenerateStepPrompt = useCallback((sectionNameForPrompt) => {
    console.log(`[MultiStepForm] Generating prompt for section: ${sectionNameForPrompt}`);
    let promptText = "";
    const S2D_SECTION_NAME = allAppSections[1]; // Asumiendo que el índice 1 es S2D
    const D2S_SECTION_NAME = allAppSections[2]; // Asumiendo que el índice 2 es D2S

    if (sectionNameForPrompt === S2D_SECTION_NAME) {
        const s2dQuestionDefinitions = getSaleToDeliveryProcessQuestions(S2D_SECTION_NAME);
        promptText = generateS2DPromptTextInternal(formData, s2dQuestionDefinitions);
    } else if (sectionNameForPrompt === D2S_SECTION_NAME) { // <--- AÑADE ESTE ELSE IF
        const d2sQuestionDefinitions = getDeliveryToSuccessQuestions(D2S_SECTION_NAME);
        const d2sData = calculateD2SSectionData(); // Calcula los datos D2S
        if (d2sData) {
            promptText = generateD2SPromptTextInternal(formData, d2sData, d2sQuestionDefinitions);
        } else {
            promptText = "Error: Could not calculate D2S data for prompt generation.";
            console.error("Failed to generate D2S prompt because d2sData was null.");
        }
    } else {
        promptText = `## Prompt for Section: ${sectionNameForPrompt} ##\n\n`;
        
        // Obtener las preguntas de la sección actual. Asumimos que currentStep es correcto.
        const questionsForThisSection = getQuestionsForStep(currentStep); 
        
        promptText += `Your current answers for this section:\n`;
        questionsForThisSection.forEach(q => {
            const answer = formData[q.valueKey];
            let displayAnswer = '(Not answered)';
            if (answer !== undefined && answer !== '' && answer !== null) {
                if (q.type === 'mcq' && q.options) {
                    // Para MCQ, intentamos encontrar el texto de la opción.
                    // El valor guardado en formData puede ser 'value' o 'text' de la opción.
                    const selectedOpt = q.options.find(opt => opt.value === answer || opt.text === answer);
                    if (selectedOpt) {
                        displayAnswer = `"${selectedOpt.text}"`;
                    } else {
                        displayAnswer = `"${String(answer)}"`; // Fallback si no se encuentra la opción
                    }
                } else {
                    displayAnswer = String(answer);
                }
            }
            promptText += `- ${q.text}: ${displayAnswer}\n`;
        });
        promptText += "\n";

        // NO incluimos el "Section Score" numérico aquí.

        promptText += "--- AI Suggestions & Considerations ---\n";

        // Aquí va toda tu lógica condicional existente para las secciones 2 a 8
        // (índices de allAppSections)
        
        if (sectionNameForPrompt === allAppSections[2]) { // "Expansion Capability"
            promptText += "Considering your Expansion Capability:\n";
            if (formData.expansionVolumePrep && String(formData.expansionVolumePrep).toLowerCase().includes("not prepared")) {
                promptText += "- Your systems may not be ready for 3x volume. Prioritize documenting key processes and identifying bottlenecks.\n";
            } else if (formData.expansionVolumePrep && String(formData.expansionVolumePrep).toLowerCase().includes("major overhaul needed")) {
                promptText += "- Significant adjustments or a major overhaul is needed for scaling. What's one system that needs immediate attention?\n";
            }
            if (formData.expansionPlaybook && String(formData.expansionPlaybook).toLowerCase().includes("no specific plans")) {
                promptText += "- Lacking an expansion playbook is a missed opportunity. Start by outlining basic steps for one potential new market or service.\n";
            }
            if (formData.expansionNewServices && String(formData.expansionNewServices).toLowerCase().includes("ad-hoc")) {
                promptText += "- An ad-hoc approach to new services can be risky. Consider implementing a basic market validation checklist before future launches.\n";
            }
            if (formData.expansionProblemRate && (String(formData.expansionProblemRate).toLowerCase().includes("frequently") || String(formData.expansionProblemRate).toLowerCase().includes("common or significant"))) {
                promptText += "- Frequent complaints/refunds are a major concern. Deep dive into the root causes for the top 1-2 complaint types.\n";
            }
            promptText += "\nKey Reflection: What is the single biggest barrier to your business handling 2-3x its current volume smoothly?\n";
        
        } else if (sectionNameForPrompt === allAppSections[3]) { // "Marketing & Brand Equity"
            promptText += "Reflecting on your Marketing & Brand Equity:\n";
            if (formData.marketingBrandRec && String(formData.marketingBrandRec).toLowerCase().includes("unknown")) {
                promptText += "- Low brand recognition is a hurdle. What are 2-3 low-cost activities you can start to increase visibility in your target market (e.g., local networking, targeted social media, an introductory offer)?\n";
            }
            if (formData.marketingDigitalPresence && String(formData.marketingDigitalPresence).toLowerCase().includes("minimal")) {
                promptText += "- A minimal digital presence limits lead generation. What's one improvement you can make to your website this month to better capture leads or showcase your value?\n";
            }
            if (formData.marketingLeadGen && (String(formData.marketingLeadGen).toLowerCase().includes("ad-hoc") || String(formData.marketingLeadGen).toLowerCase().includes("little measurement"))) {
                promptText += "- Inconsistent lead generation needs a systematic approach. Choose ONE primary channel to focus on and set a simple goal for leads/ CPL for the next 30 days.\n";
            }
            if (formData.marketingICPFocus && String(formData.marketingICPFocus).toLowerCase().includes("anyone who expresses interest")) {
                promptText += "- Trying to serve everyone often means serving no one well. Spend 30 minutes defining your Ideal Customer Profile (ICP) – who gets the most value from you, and who do you enjoy working with most?\n";
            }
            promptText += "\nKey Reflection: If you had to double your qualified leads next month with a small budget, what ONE marketing activity would you focus all your energy on?\n";

        } else if (sectionNameForPrompt === allAppSections[4]) { // "Profitability Metrics"
            promptText += "Analyzing your Profitability Metrics:\n";
            if (formData.profitTrend && (String(formData.profitTrend).toLowerCase().includes("declining") || String(formData.profitTrend).toLowerCase().includes("flat or inconsistent"))) {
                promptText += "- Declining or flat profitability requires urgent attention. Schedule time this week to review your P&L for the last 3-6 months. Where are anomolies or concerning trends in revenue or key expense categories?\n";
            }
            if (formData.profitMargins && (String(formData.profitMargins).toLowerCase().includes("below average") || String(formData.profitMargins).toLowerCase().includes("unsure"))) {
                promptText += "- Uncertainty or low Gross Profit Margins suggest a need for analysis. Calculate your GPM for your top product/service. How does it compare to your best guess? What are the key drivers of COGS?\n"; // Corregí "symptômes" a "guess" o lo que corresponda
            }
            if (formData.profitRecurringRev && (String(formData.profitRecurringRev).toLowerCase().includes("low (< 10%)") || String(formData.profitRecurringRev).toLowerCase().includes("none"))) {
                promptText += "- Low recurring revenue increases business risk. Brainstorm one potential recurring revenue stream (e.g., maintenance plan, subscription, retainer for ongoing advice) you could offer.\n";
            }
            promptText += "\nKey Reflection: What is the ONE financial metric (e.g., Gross Profit Margin, Net Profit Margin, Recurring Revenue %) that, if improved, would have the biggest positive impact on your business's health and value?\n";

        } else if (sectionNameForPrompt === allAppSections[5]) { // "Offering & Sales Effectiveness"
            promptText += "Evaluating Offering & Sales Effectiveness:\n";
            if (formData.offeringSatisfaction && (String(formData.offeringSatisfaction).toLowerCase().includes("no systematic measurement") || String(formData.offeringSatisfaction).toLowerCase().includes("informally or rarely"))) {
                promptText += "- Without systematic customer satisfaction measurement, you're flying blind. Implement a simple 1-2 question survey (e.g., NPS + 'What's one thing we could do better?') after each service delivery/sale.\n";
            }
            if (formData.salesProcessEffectiveness && (String(formData.salesProcessEffectiveness).toLowerCase().includes("ineffective") || String(formData.salesProcessEffectiveness).toLowerCase().includes("ad-hoc") || String(formData.salesProcessEffectiveness).toLowerCase().includes("informal or varies"))) {
                promptText += "- An inconsistent sales process leads to lost deals. Map out your current sales stages (even if informal) and identify ONE stage where leads most often drop off. What's one change to improve that stage?\n";
            }
            if (formData.offeringFollowOnRevenue && (String(formData.offeringFollowOnRevenue).toLowerCase().includes("minimal additional") || String(formData.offeringFollowOnRevenue).toLowerCase().includes("little to no additional"))) {
                promptText += "- Low follow-on revenue means missed opportunities. For your existing customer base, what's one complementary product/service or an enhanced version of their current purchase you could offer them?\n";
            }
            promptText += "\nKey Reflection: What is the single biggest friction point for your customers in your current sales OR offering delivery process?\n";

        } else if (sectionNameForPrompt === allAppSections[6]) { // "Workforce & Leadership"
            promptText += "Assessing your Workforce & Leadership:\n";
            if (formData.workforceOwnerReliance && (String(formData.workforceOwnerReliance).toLowerCase().includes("heavily reliant") || String(formData.workforceOwnerReliance).toLowerCase().includes("completely reliant"))) {
                promptText += "- High owner reliance is a significant bottleneck and risk. Identify ONE recurring task you do that someone else could potentially do (even 70% as well as you). Plan to delegate it in the next 30 days with clear instructions.\n";
            }
            if (formData.workforceAccountability && (String(formData.workforceAccountability).toLowerCase().includes("low accountability") || String(formData.workforceAccountability).toLowerCase().includes("some accountability"))) {
                promptText += "- Weak accountability structures limit team performance. For ONE key role, define 1-2 clear, measurable outcomes (KPIs) they are responsible for. How will you track and discuss these?\n";
            }
            if (formData.workforceRetention && String(formData.workforceRetention).toLowerCase().includes("challenging")) {
                promptText += "- Difficulty retaining talent is costly. What are the top 1-2 reasons employees might leave, and what's one proactive step to improve retention for key roles?\n";
            }
            promptText += "\nKey Reflection: If you were forced to take a 4-week vacation starting tomorrow, what would be the biggest operational fire in your business, and who would (or wouldn't) be able to handle it?\n";
        
        } else if (sectionNameForPrompt === allAppSections[7]) { // "Execution Systems"
            promptText += "Reviewing your Execution Systems:\n";
            if (formData.systemsSOPs && (String(formData.systemsSOPs).toLowerCase().includes("minimally documented") || String(formData.systemsSOPs).toLowerCase().includes("few documented"))) {
                promptText += "- Lack of SOPs leads to errors and inefficiency. Choose ONE critical process and create a simple checklist or a short (1-page) SOP for it this week.\n";
            }
            if (formData.systemsTech && (String(formData.systemsTech).toLowerCase().includes("ineffective") || String(formData.systemsTech).toLowerCase().includes("lacking key systems") || String(formData.systemsTech).toLowerCase().includes("heavily reliant on spreadsheets"))) {
                promptText += "- Over-reliance on manual processes or inadequate tech is a drag on growth. Identify one key area (e.g., CRM, project management, scheduling) where a dedicated tool could save significant time or reduce errors. Research one affordable option.\n";
            }
            if (formData.systemsKPIs && (String(formData.systemsKPIs).toLowerCase().includes("little or no formal kpi tracking") || String(formData.systemsKPIs).toLowerCase().includes("basic or infrequent reporting"))) {
                promptText += "- Without tracking KPIs, you can't manage what you don't measure. Identify 1-3 critical KPIs for your business (e.g., leads, conversion rate, customer satisfaction) and a simple way to track them weekly/monthly.\n";
            }
            promptText += "\nKey Reflection: What is the ONE system or process that, if improved or implemented, would give you the most leverage or peace of mind in your business operations?\n";

        } else if (sectionNameForPrompt === allAppSections[8]) { // "Robust Market Position"
            promptText += "Evaluating your Robust Market Position:\n";
            if (formData.marketGrowthPotential && String(formData.marketGrowthPotential).toLowerCase().includes("declining market")) {
                promptText += "- A declining market requires strategic shifts. What adjacent markets, new customer segments, or innovative offerings could you explore to find new growth avenues?\n";
            }
            if (formData.marketCustConcentration && String(formData.marketCustConcentration).toLowerCase().includes("highly concentrated")) {
                promptText += "- Over-dependence on a few clients is a major risk. Outline a plan to acquire 2-3 new ideal clients in the next 90 days to improve diversification.\n";
            }
            if (formData.marketTamSize && String(formData.marketTamSize).toLowerCase().includes("small / niche")) {
                promptText += "- While a niche can be profitable, a very small TAM limits growth. Are there ways to expand your definition of the niche or serve it more deeply to increase your addressable market?\n";
            }
            promptText += "\nKey Reflection: What is the most significant external threat to your market position, and what is one action you can take to mitigate it or strengthen your differentiation?\n";
        
        } else { 
            // Fallback para cualquier otra sección que no tenga lógica específica (aunque debería cubrir de la 2 a la 8)
            // Las secciones 0 (Profile) y 9 (Financials) no deberían llegar aquí debido a la lógica de Navigation.jsx
            promptText += "Review your answers above. What are the key strengths and weaknesses highlighted for this section? Identify one action item to build on a strength or address a weakness.\n";
        }
    }
if (promptText) { // Solo descargar si hay texto
        downloadAsTxtFile(promptText, `${sectionNameForPrompt.replace(/[\s\/&]+/g, '_')}_Prompt.txt`);
    }

}, [
    formData, 
    currentStep, // o visibleSections.indexOf(sectionNameForPrompt) para las genéricas
    allAppSections, // o visibleSections
    generateS2DPromptTextInternal,
    generateD2SPromptTextInternal, // <--- AÑADE A DEPENDENCIAS
    getSaleToDeliveryProcessQuestions,
    getDeliveryToSuccessQuestions, // <--- AÑADE A DEPENDENCIAS
    calculateD2SSectionData,    // <--- AÑADE A DEPENDENCIAS
    getQuestionsForStep,
    // visibleSections // <--- AÑADE SI USAS visibleSections.indexOf
]);




    const handleSubmit = useCallback(async () => {
        console.log("[MultiStepForm] handleSubmit triggered. isSubmitting:", isSubmitting);
        if (isSubmitting) {
            console.log("[MultiStepForm] Submission already in progress, returning.");
            return;
        }

        setIsSubmitting(true);
        setSubmissionBackendResultMsg(null); // Limpiar mensaje previo del backend
        // No reseteamos calculationResult o submissionSuccess aquí; se manejan al final o en error.
        setErrors({});
        let calculatedResultsForThisSubmission = {}; // Para los resultados de ESTA sumisión

        try {
            console.log("[MultiStepForm] Validating form data...");
            if (!formData.userEmail || formData.currentRevenue == null || !formData.naicsSector || !formData.naicsSubSector) {
                 throw new Error("Please complete all required profile, financial and industry fields.");
            }
            // Aquí puedes añadir más validaciones si el ebitda es requerido para todos, por ejemplo.
            // if (formData.ebitda == null) throw new Error("EBITDA is required.");
            console.log("[MultiStepForm] Basic validations passed.");

            // --- CÁLCULOS (Asume que tus funciones de cálculo son correctas y usan 'formData') ---
            const adjEbitda = (formData.ebitda || 0) + (formData.ebitdaAdjustments || 0);
            const valuationParams = getValuationParameters(adjEbitda, formData.naicsSector, formData.naicsSubSector);
            const originalScores = calculateScores(formData); // Tu función existente
            const maxPossibleOriginal = calculateMaxPossibleScore();
            const originalScorePercentage = maxPossibleOriginal > 0 ? (Object.values(originalScores).reduce((a, b) => a + b, 0) / maxPossibleOriginal) : 0;
            const clampedOriginalScorePercentage = Math.max(0, Math.min(1, originalScorePercentage));
            const finalMultiple = valuationParams.baseMultiple + (valuationParams.maxMultiple - valuationParams.baseMultiple) * clampedOriginalScorePercentage;
            const estimatedValuation = adjEbitda >= 0 ? Math.round(adjEbitda * finalMultiple) : 0;
            const roadmapData = generateImprovementRoadmap(originalScores, valuationParams.stage, formData);

         const s2dData = calculateS2DSectionData();

              calculatedResultsForThisSubmission = {
                stage: valuationParams.stage, adjEbitda, baseMultiple: valuationParams.baseMultiple, 
                maxMultiple: valuationParams.maxMultiple, finalMultiple, estimatedValuation,
                scores: originalScores, scorePercentage: clampedOriginalScorePercentage, roadmap: roadmapData,
            ...s2dData
            };
            // --- FIN CÁLCULOS ---
            
            console.log("[MultiStepForm] Calculations complete. localCalcResult:", calculatedResultsForThisSubmission);

            const payloadToSend = { formData, results: calculatedResultsForThisSubmission };
            const functionUrl = `${getFunctionsBaseUrl()}/.netlify/functions/submit-valuation`;
            
            console.log("[MultiStepForm] Sending data to Netlify function:", functionUrl);
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadToSend)
            });

            console.log("[MultiStepForm] Netlify function response status:", response.status);
            const resultText = await response.text();
            console.log("[MultiStepForm] Netlify function response text (first 100 chars):", resultText.substring(0, 100));

            let resultJson;
            try {
                resultJson = JSON.parse(resultText);
            } catch (parseError) {
                console.error("[MultiStepForm] Error parsing JSON response from Netlify function:", parseError, "Full text:", resultText);
                throw new Error(`Server returned non-JSON response: ${response.status}`);
            }

            if (!response.ok || !resultJson.success) {
                console.error("[MultiStepForm] Netlify function returned an error in JSON:", resultJson.error);
                throw new Error(resultJson.error || 'Backend processing failed and did not return a specific error message.');
            }

            console.log("[MultiStepForm] Submission successful. Backend message:", resultJson.message);
            // --- GUARDAR RESULTADOS Y MARCAR SUMISIÓN EXITOSA EN LOCALSTORAGE ---
            setCalculationResult(calculatedResultsForThisSubmission);
            localStorage.setItem(LOCAL_STORAGE_CALC_RESULT_KEY, JSON.stringify(calculatedResultsForThisSubmission));
            
            setSubmissionSuccess(true);
            localStorage.setItem(LOCAL_STORAGE_SUBMISSION_SUCCESS_KEY, 'true');
            // -----------------------------------------------------------------
            setSubmissionBackendResultMsg({ success: true, message: resultJson.message || "Submission processed!" });
            
            localStorage.removeItem(LOCAL_STORAGE_FORM_DATA_KEY);
            localStorage.removeItem(LOCAL_STORAGE_CURRENT_STEP_KEY);

        } catch (error) { 
           console.error("[MultiStepForm] handleSubmit CATCH Error:", error.message, error.stack); 
           setSubmissionBackendResultMsg({ success: false, message: `Submission Failed: ${error.message}` });
           setCalculationResult(null); 
           setSubmissionSuccess(false);
           localStorage.removeItem(LOCAL_STORAGE_CALC_RESULT_KEY); 
           localStorage.removeItem(LOCAL_STORAGE_SUBMISSION_SUCCESS_KEY);
        } finally {
            console.log("[MultiStepForm] handleSubmit finally block. Setting isSubmitting to false.");
            setIsSubmitting(false);
        }
    }, [formData, calculateScores, generateImprovementRoadmap, allAppSections, ScoringAreas, isSubmitting, calculateS2DSectionData, getFunctionsBaseUrl]);

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

        const S2D_SECTION_INDEX = 1;
        const D2S_SECTION_INDEX = 2;
        const isLastQuestionStep = currentStep === TOTAL_STEPS_QUESTIONS - 1; 


           const shouldShowSectionResultsPage =
            currentStep >= 1 &&
            currentStep < TOTAL_STEPS_QUESTIONS - 1 && // No mostrar para el último paso de preguntas
            (currentStep === S2D_SECTION_INDEX || currentStep === D2S_SECTION_INDEX ||
             (allAppSections[currentStep] && // Para otras secciones que también podrían tener una página de resultados
             (allAppSections[currentStep].includes("Expansion Capability") || 
              allAppSections[currentStep].includes("Marketing") ||
              allAppSections[currentStep].includes("Profitability Metrics") ||
              allAppSections[currentStep].includes("Offering & Sales Effectiveness") ||
              allAppSections[currentStep].includes("Workforce & Leadership") ||
              allAppSections[currentStep].includes("Execution Systems") ||
              allAppSections[currentStep].includes("Robust Market Position")
             ))
            );
       if (shouldShowSectionResultsPage) {
            let resultsForSectionPage;
            if (currentStep === S2D_SECTION_INDEX) {
                console.log(`[MultiStepForm] Completed S2D section. Calculating results...`);
                resultsForSectionPage = calculateS2DSectionData();
            } else if (currentStep === D2S_SECTION_INDEX) { // <--- AÑADE ESTE ELSE IF
                console.log(`[MultiStepForm] Completed D2S section. Calculating results...`);
                resultsForSectionPage = calculateD2SSectionData(); // <--- LLAMA A LA NUEVA FUNCIÓN
            } else {

                   const sectionTitle = allAppSections[currentStep];
    console.log(`[MultiStepForm] Completed section: ${sectionTitle}. Calculating results...`);

    const generalScores = calculateScores(formData); // Todos los scores de áreas cualitativas
    const questionsForCurrentSection = getQuestionsForStep(currentStep);
    
    let sectionScore = 0;
    let maxSectionScore = 0;
    let interpretation = "No scoring data available for this section.";
    let primaryScoringAreaName = null;

    // Encontrar la scoringArea principal para esta sección (si existe)
    if (questionsForCurrentSection.length > 0) {
        const firstScoringQuestion = questionsForCurrentSection.find(q => q.scoringArea);
        if (firstScoringQuestion) {
            primaryScoringAreaName = firstScoringQuestion.scoringArea;
        }
    }

    if (primaryScoringAreaName) {
        sectionScore = generalScores[primaryScoringAreaName] || 0;
        maxSectionScore = calculateMaxScoreForArea(primaryScoringAreaName);
        if (maxSectionScore > 0) {
            const percentage = (sectionScore / maxSectionScore) * 100;
            if (percentage >= 80) interpretation = "Strong performance in this area.";
            else if (percentage >= 50) interpretation = "Good performance, with some room for improvement.";
            else interpretation = "This area may need more focus for development.";
        } else {
            interpretation = "Scoring not applicable or max score is zero for this area."
        }
    }

    const questionsAndAnswers = questionsForCurrentSection.map(q => {
        const answerValue = formData[q.valueKey];
        let displayAnswer = '(Not answered)';
        if (answerValue !== undefined && answerValue !== null && answerValue !== '') {
            if (q.type === 'mcq' && q.options) {

                const opt = q.options.find(o => o.text === answerValue || o.value === answerValue);
                displayAnswer = opt ? opt.text : String(answerValue);
            } else {
                displayAnswer = String(answerValue);
            }
        }
        return {
            id: q.id,
            text: q.text,
            answer: displayAnswer,
            // No necesitamos pasar 'options' aquí si ya procesamos la respuesta
        };
    });

   resultsForSectionPage = {
                    isS2D: false,
                    isD2S: false, // <--- AÑADIDO
                    sectionTitle: sectionTitle,
                    score: sectionScore, // o el score específico de la sección
                    maxScore: maxSectionScore, // o el max score específico
                    interpretation: interpretation,
                    questions: questionsAndAnswers // el desglose de preguntas/respuestas
                };
            }
            setSectionResultsData(resultsForSectionPage);
            setShowingSectionResultsFor(allAppSections[currentStep]);
        } else if (!isLastQuestionStep) {
            setCurrentStep(prevStep => prevStep + 1);
        } else {
            handleSubmit();
        }
    }
}, [
    currentStep, 
    TOTAL_STEPS_QUESTIONS, 
    currentQuestions, 
    formData, 
    handleSubmit, 
    // errors, // Si 'errors' no cambia frecuentemente, considera si es necesaria aquí para 'handleNext' en sí
    allAppSections, 
    calculateS2DSectionData,
    calculateD2SSectionData, // <--- AÑADE A DEPENDENCIAS
    calculateScores, 
    // ScoringAreas, // Si calculateScores ya lo tiene en sus dependencias, puede no ser necesario aquí
    // calculateMaxScoreForArea, // Igual que ScoringAreas
    getQuestionsForStep // <--- AÑADE SI AÚN NO ESTÁ (para las secciones genéricas)
]);

    const handlePrevious = useCallback(() => { /* ... tu función sin cambios ... */
        if (currentStep > 0) {
            setCurrentStep(prevStep => prevStep - 1);
            setErrors({});
        }
    }, [currentStep]);

    const handleContinueToNextStep = useCallback(() => {
    setShowingSectionResultsFor(null);
    setSectionResultsData(null);
    if (currentStep < TOTAL_STEPS_QUESTIONS - 1) {
        setCurrentStep(prevStep => prevStep + 1);
    } else {
         handleSubmit();
    }
}, [currentStep, TOTAL_STEPS_QUESTIONS, handleSubmit]);

   const handleStartOver = useCallback(() => {
        setCalculationResult(null);
        setSubmissionSuccess(false); // <-- NUEVO
        setSubmissionBackendResultMsg(null); // <-- NUEVO
        setCurrentStep(0);
        setFormData(buildInitialFormData()); 
        setErrors({});
        localStorage.removeItem(LOCAL_STORAGE_FORM_DATA_KEY); // Usa la constante
        localStorage.removeItem(LOCAL_STORAGE_CURRENT_STEP_KEY); // Usa la constante
        localStorage.removeItem(LOCAL_STORAGE_CALC_RESULT_KEY); // <-- NUEVO
        localStorage.removeItem(LOCAL_STORAGE_SUBMISSION_SUCCESS_KEY); // <-- NUEVO
    }, [allAppSections]);

   const handleBackToEdit = useCallback(() => {
        setSubmissionSuccess(false); // <-- Clave para mostrar el formulario de nuevo
        localStorage.removeItem(LOCAL_STORAGE_SUBMISSION_SUCCESS_KEY); // Limpiar la bandera
        // No limpiamos calculationResult aquí, para que ResultsDisplay pueda potencialmente
        // mostrar datos si el usuario solo quería "ver" el formulario y volver.
        // Tampoco limpiamos formData ni currentStep de localStorage, para que el usuario
        // vuelva al último paso que estaba viendo del formulario en progreso.
        // Si se quiere un "reset" completo al editar, se debería llamar a handleStartOver
        // o implementar una lógica más compleja de carga de datos para edición.
        setSubmissionBackendResultMsg(null); // Limpiar mensaje del backend
        console.log("Back to edit: submissionSuccess flag cleared.");
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
    }, [formData]);

    // --- Conditional Rendering Logic & Main Form Render ---
    if (submissionSuccess && calculationResult) { // Usa el estado booleano y el resultado calculado
        return ( <ResultsDisplay 
                    calculationResult={calculationResult} 
                    onStartOver={handleStartOver} 
                    onBackToEdit={handleBackToEdit}
                    consultantCalendlyLink={"https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview"} 
                    userEmail={formData?.userEmail || calculationResult?.formData?.userEmail /* Ajustar según dónde esté el email más fiable */}
                    formData={formData} // Pasar el formData actual que contiene las respuestas S2D
                /> );
    }
    
    if (submissionBackendResultMsg && !submissionBackendResultMsg.success) {
         return ( <div className="submission-result error"><h2>Submission Error</h2><p>{submissionBackendResultMsg.message}</p><div style={{textAlign: 'center', marginTop: '20px'}}><button type="button" onClick={() => setSubmissionBackendResultMsg(null)}>Back to Form</button></div></div> );
    }

    if (showingSectionResultsFor && sectionResultsData) {
    return (
        <SectionResultsPage
            sectionName={showingSectionResultsFor}
            sectionData={sectionResultsData}
            onContinueToNextStep={handleContinueToNextStep}
            onGeneratePrompt={handleGenerateStepPrompt}
            isSubmitting={isSubmitting} 
        />
    );
}

    return (
        <div className="multi-step-form">
            <ProgressIndicator currentStep={currentStep + 1} totalSteps={TOTAL_STEPS_QUESTIONS} sections={visibleSections} /> 
            <form onSubmit={(e) => e.preventDefault()}>
           <Step
    key={currentSectionName || currentStep}
    stepIndex={currentStep}
    questions={currentQuestions}
    formData={formData}
    handleChange={handleChange}
    sectionTitle={currentSectionName} // <--- ASEGÚRATE QUE ESTO SE PASA
    errors={errors}
    dynamicOptions={{ sectors, subSectors }}
    isSubSectorsLoading={isSubSectorsLoading}
/>
          <Navigation
                currentStep={currentStep}
                totalSteps={TOTAL_STEPS_QUESTIONS}
                onPrevious={handlePrevious}
                onNext={handleNext}
                isSubmitting={isSubmitting}
                onSaveAndSendLink={handleSaveAndSendLink}
                isSendingLink={isSendingLink}
                sendLinkResult={sendLinkResult}
                // --- ASEGÚRATE DE QUE ESTAS PROPS SE ESTÉN PASANDO CORRECTAMENTE ---
                currentSectionName={currentSectionName} 
                onGeneratePrompt={handleGenerateStepPrompt}
                sectionsConfig={allAppSections} 
                // --------------------------------------------------------------
            />
            </form>
        </div>
    );
}

export default MultiStepForm;