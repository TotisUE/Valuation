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
import { getMarketToLeadPart1Questions, getMarketToLeadPart2Questions } from '../sections-data/marketToLeadQuestions';
import { /* ..., */ MARKETING_CHANNELS_OPTIONS } from '../sections-data/marketToLeadQuestions';
import Step from './Step';
import ProgressIndicator from './ProgressIndicator';
import Navigation from './Navigation';
import ResultsDisplay from './results/ResultsDisplay';
import SectionResultsPage from './SectionResultsPage'; 
import { getFunctionsBaseUrl } from '../utils/urlHelpers';
import { getAssociatedNumericFieldsForChannel } from '../utils/questionHelpers';


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
        
        // S2D Defaults
        s2d_productName: '', s2d_productDescription: '', s2d_productRevenue: null,
        s2d_q1_process: '', s2d_q1_owner: '', s2d_q2_process: '', s2d_q2_owner: '',
        s2d_q3_process: '', s2d_q3_owner: '', s2d_q4_process: '', s2d_q4_owner: '',
        s2d_q5_process: '', s2d_q5_owner: '', s2d_q6_process: '', s2d_q6_owner: '',
        s2d_q7_process: '', s2d_q7_owner: '', s2d_q8_process: '', s2d_q8_owner: '',

        m2l_primaryMarketingChannel: '',
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
        let dataToUse = savedData ? JSON.parse(savedData) : baseStructure;
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

    const generateImprovementRoadmap = useCallback((scores, stage, currentFormData) => {
        const roadmapContent = {
            [ScoringAreas.EXPANSION]: {
                title: "Strengthen Expansion Capability",
                description: "Your ability to grow is limited by a lack of scalable systems and documented processes. To improve, focus on creating 'playbooks' for key tasks, validating new service offerings with basic market analysis, and identifying bottlenecks that would prevent handling 3x your current volume."
            },
            [ScoringAreas.MARKETING]: {
                title: "Systematize Marketing & Lead Generation",
                description: "Currently, marketing efforts are inconsistent. Clearly define your Ideal Customer Profile (ICP). Choose one primary marketing channel to focus on and measure its return on investment (ROI). Improve your digital presence to act as an active lead generation tool."
            },
            [ScoringAreas.PROFITABILITY]: {
                title: "Improve Profitability Metrics & Visibility",
                description: "A lack of profitability tracking is a risk. Analyze your Profit & Loss (P&L) statement to understand trends. Calculate the gross margin on your main product/service and look for opportunities to introduce recurring revenue streams, such as maintenance plans or subscriptions."
            },
            [ScoringAreas.OFFERING_SALES]: {
                title: "Optimize Offering & Sales Effectiveness",
                description: "An inconsistent sales process and lack of customer satisfaction measurement are hindering growth. Implement a simple survey (like NPS) after each sale. Document your current sales stages and identify where most prospects drop off to improve that specific stage."
            },
            [ScoringAreas.WORKFORCE]: {
                title: "Reduce Owner Dependency & Strengthen the Team",
                description: "High owner reliance is a significant bottleneck. Identify one recurring task you perform that someone else could potentially do. Document it and delegate. Establish 1-2 Key Performance Indicators (KPIs) for a key role to foster accountability."
            },
            [ScoringAreas.SYSTEMS]: {
                title: "Implement Robust Execution Systems",
                description: "Reliance on manual processes and a lack of documentation (SOPs) limit efficiency. Choose one critical process and create a simple checklist or a one-page SOP for it. Research one technology tool (CRM, project management software) that can automate a time-consuming task."
            },
            [ScoringAreas.MARKET]: {
                title: "Solidify a Robust Market Position",
                description: "High customer concentration or being in a declining market presents risks. Develop a plan to acquire 2-3 new ideal clients in the next 90 days to diversify revenue. Reinforce what makes you different from your competitors to protect your market position."
            }
        };

        if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0) return [];

        const areaScores = Object.keys(scores).map(areaKey => {
            const score = scores[areaKey];
            const maxScore = calculateMaxScoreForArea(areaKey);
            const percentage = maxScore > 0 ? score / maxScore : 0;
            return {
                area: areaKey,
                score,
                maxScore,
                percentage
            };
        });

        areaScores.sort((a, b) => a.percentage - b.percentage);

        let finalRoadmapItems = [];
        const marketingAreaKey = ScoringAreas.MARKETING;
        const marketingData = areaScores.find(a => a.area === marketingAreaKey);
        
        const directSalesRevenueBalances = [
            "Mostly/All Direct (>80% Direct Revenue)",
            "Primarily Direct (approx. 60-80% Direct Revenue)",
            "Roughly Balanced Mix (approx. 40-60% Direct Revenue)"
        ];
        
        if (marketingData && marketingData.percentage < 0.80 && directSalesRevenueBalances.includes(currentFormData.revenueSourceBalance)) {
            const marketingContent = roadmapContent[marketingAreaKey];
            if (marketingContent) {
                finalRoadmapItems.push({
                    ...marketingContent,
                    areaName: marketingAreaKey,
                    areaScore: marketingData.score,
                    maxScore: marketingData.maxScore
                });
            }
            const otherLowestAreas = areaScores.filter(a => a.area !== marketingAreaKey).slice(0, 2);
            otherLowestAreas.forEach(areaData => {
                const content = roadmapContent[areaData.area];
                if (content) {
                    finalRoadmapItems.push({
                        ...content,
                        areaName: areaData.area,
                        areaScore: areaData.score,
                        maxScore: areaData.maxScore
                    });
                }
            });
        } else {
            const lowestThreeAreas = areaScores.slice(0, 3);
            lowestThreeAreas.forEach(areaData => {
                const content = roadmapContent[areaData.area];
                if (content) {
                    finalRoadmapItems.push({
                        ...content,
                        areaName: areaData.area,
                        areaScore: areaData.score,
                        maxScore: areaData.maxScore
                    });
                }
            });
        }
        
        return finalRoadmapItems;

    }, [ScoringAreas, calculateMaxScoreForArea]);

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

// En MultiStepForm.jsx

const calculateMarketToLeadData = useCallback(() => {
    // --- INICIALIZAR TODAS LAS VARIABLES QUE SE USARÁN EN EL RETURN O PARA CÁLCULOS INTERNOS ---
    let m2l_processMaturityScore = 0;
    let m2l_ownerIndependenceScore = 0;
    
    let activeChannelsCount = 0; 
      let highestNonEmailChannelPercent = 0;
    let highestNonEmailChannelName = "N/A"; // Default si no se encuentra o no aplica
    let m2l_channelConcentrationRiskInterpretation = "Good/Excellent Diversification (No single non-email channel shows high concentration)";
    
    let ltvToCacRatio = 0;
    let m2l_unitEconomicsHealthInterpretation = "Data incomplete for LTV:CAC calculation";
    const m2l_processAssessmentDetails = [];
    let m2l_ownerStrategicPositioning = { areasForDelegation: [], areasForActiveManagement: [] };
    const m2lFormDataForPrompt = {};
    
    // Obtener las definiciones de preguntas
    // Estas funciones se usan más abajo para construir m2lFormDataForPrompt, así que es bueno tenerlas.
    const m2lPart1Questions = getMarketToLeadPart1Questions(allAppSections[3]); 
    const m2lPart2Questions = getMarketToLeadPart2Questions(allAppSections[4]);

    // --- CÁLCULO DE SCORES PRINCIPALES (Process Maturity y Owner Independence de M2L Parte 2) ---
    m2lPart2Questions.forEach(q => {
        const answerValue = formData[q.valueKey];
        if (q.type === 'mcq' && answerValue && q.options) {
            const selectedOption = q.options.find(opt => opt.value === answerValue);
            if (selectedOption && typeof selectedOption.score === 'number') {
                if (q.valueKey.endsWith('_process')) {
                    m2l_processMaturityScore += selectedOption.score;
                } else if (q.valueKey.endsWith('_owner')) {
                    m2l_ownerIndependenceScore += selectedOption.score;
                }
            }
        }
    });

    // --- CONSTRUCCIÓN DE m2l_processAssessmentDetails (de M2L Parte 2) ---
    m2lPart2Questions.forEach(qDef => {
        if (qDef.valueKey.endsWith('_process')) {
            const baseValueKeyWithoutSuffix = qDef.valueKey.replace('_process', '');
            const ownerQuestionValueKey = `${baseValueKeyWithoutSuffix}_owner`;
            const processAnswerValue = formData[qDef.valueKey];
            const ownerAnswerValue = formData[ownerQuestionValueKey];
            const processQuestionText = qDef.text;
            let processAnswerText = "(Not answered)";
            let processAnswerScore = 0;

            if (processAnswerValue && qDef.options) {
                const selectedOpt = qDef.options.find(opt => opt.value === processAnswerValue);
                if (selectedOpt && typeof selectedOpt.score === 'number') {
                    processAnswerText = selectedOpt.text;
                    processAnswerScore = selectedOpt.score;
                }
            }

            const ownerQuestionDef = m2lPart2Questions.find(q => q.valueKey === ownerQuestionValueKey);
            let ownerQuestionText = "";
            let ownerAnswerText = "(Not answered)";
            let ownerAnswerScore = 0;

            if (ownerQuestionDef) {
                ownerQuestionText = ownerQuestionDef.text;
                if (ownerAnswerValue && ownerQuestionDef.options) {
                    const selectedOwnerOpt = ownerQuestionDef.options.find(opt => opt.value === ownerAnswerValue);
                    if (selectedOwnerOpt && typeof selectedOwnerOpt.score === 'number') {
                        ownerAnswerText = selectedOwnerOpt.text;
                        ownerAnswerScore = selectedOwnerOpt.score;
                    }
                }
            }
            m2l_processAssessmentDetails.push({
                id: qDef.id, processQuestionText, processAnswerText, processAnswerScore,
                ownerQuestionText, ownerAnswerText, ownerAnswerScore
            });
        }
    });
    m2l_processAssessmentDetails.sort((a, b) => {
        const numA = parseInt(a.id.split('_')[2]);
        const numB = parseInt(b.id.split('_')[2]);
        return numA - numB;
    });

    // --- Channel Diversification Score (de M2L Parte 1) ---
    const channelUseValueKeys = [
        'm2l_meta_ads_use', 'm2l_tiktok_ads_use', 'm2l_google_ads_use', 
        'm2l_linkedin_ads_use', 'm2l_youtube_ads_use', 'm2l_otherPaidChannels_list',
        'm2l_youtube_organic_use', 'm2l_linkedin_organic_use', 'm2l_google_seo_use', 
        'm2l_instagram_organic_use', 'm2l_otherOrganicChannels_list',
        'm2l_email_marketing_use', 'm2l_text_sms_marketing_use',
        'm2l_referral_formal_programs'
    ];
    channelUseValueKeys.forEach(valueKey => {
        if (valueKey.includes('_list')) { 
            if (formData[valueKey] && String(formData[valueKey]).trim() !== '') activeChannelsCount++;
        } else if (valueKey === 'm2l_referral_formal_programs') {
             if (formData[valueKey] === 'yes') activeChannelsCount++;
        } else if (formData[valueKey] === 'yes') { 
            activeChannelsCount++;
        }
    });
    const nonEmailChannelData = [ // Array de objetos para facilitar el acceso al nombre y valueKey del %
        { valueKey: 'm2l_meta_ads_customerPercent', name: 'Meta (Facebook/Instagram Ads)', useKey: 'm2l_meta_ads_use' },
        { valueKey: 'm2l_tiktok_ads_customerPercent', name: 'TikTok Ads', useKey: 'm2l_tiktok_ads_use' },
        { valueKey: 'm2l_google_ads_customerPercent', name: 'Google Ads', useKey: 'm2l_google_ads_use' },
        { valueKey: 'm2l_linkedin_ads_customerPercent', name: 'LinkedIn Ads', useKey: 'm2l_linkedin_ads_use' },
        { valueKey: 'm2l_youtube_ads_customerPercent', name: 'YouTube Ads', useKey: 'm2l_youtube_ads_use' },
        { valueKey: 'm2l_otherPaidChannels_customerPercent', name: 'Other Paid Channels', useKey: 'm2l_otherPaidChannels_list' }, // 'useKey' es la lista aquí
        { valueKey: 'm2l_youtube_organic_customerPercent', name: 'YouTube Organic', useKey: 'm2l_youtube_organic_use' },
        { valueKey: 'm2l_linkedin_organic_customerPercent', name: 'LinkedIn Organic', useKey: 'm2l_linkedin_organic_use' },
        { valueKey: 'm2l_google_seo_customerPercent', name: 'Google SEO', useKey: 'm2l_google_seo_use' },
        { valueKey: 'm2l_instagram_organic_customerPercent', name: 'Instagram Organic', useKey: 'm2l_instagram_organic_use' },
        { valueKey: 'm2l_otherOrganicChannels_customerPercent', name: 'Other Organic Channels', useKey: 'm2l_otherOrganicChannels_list' }, // 'useKey' es la lista aquí
        // OMITIMOS EMAIL MARKETING
        { valueKey: 'm2l_text_sms_marketing_customerPercent', name: 'Text/SMS Marketing', useKey: 'm2l_text_sms_marketing_use' },
        { valueKey: 'm2l_referral_customerPercent', name: 'Referral Programs', useKey: 'm2l_referral_formal_programs' }
    ];
highestNonEmailChannelPercent = 0; // Reiniciar para el cálculo
    highestNonEmailChannelName = "N/A (No single non-email channel has >20% customer concentration or data incomplete)"; // Default más informativo

    nonEmailChannelData.forEach(channel => {
        // Considerar el canal solo si está en uso
        let isUsed = false;
        if (channel.useKey.includes('_list')) {
            isUsed = formData[channel.useKey] && String(formData[channel.useKey]).trim() !== '';
        } else {
            isUsed = formData[channel.useKey] === 'yes';
        }

        if (isUsed) {
            const percent = parseFloat(formData[channel.valueKey] || 0);
            if (!isNaN(percent) && percent > highestNonEmailChannelPercent) {
                highestNonEmailChannelPercent = percent;
                highestNonEmailChannelName = channel.name;
            }
        }
    });

    if (highestNonEmailChannelPercent > 80) {
        m2l_channelConcentrationRiskInterpretation = `Critical Risk: ${highestNonEmailChannelName} accounts for over 80% of customers.`;
    } else if (highestNonEmailChannelPercent >= 60) { // 60-80% (se incluye el 80 exacto aquí)
        m2l_channelConcentrationRiskInterpretation = `High Risk: ${highestNonEmailChannelName} accounts for ${highestNonEmailChannelPercent.toFixed(0)}% of customers.`;
    } else if (highestNonEmailChannelPercent >= 40) { // 40-59%
        m2l_channelConcentrationRiskInterpretation = `Medium Risk: ${highestNonEmailChannelName} accounts for ${highestNonEmailChannelPercent.toFixed(0)}% of customers.`;
    } else if (highestNonEmailChannelPercent >= 20) { // 20-39%
        m2l_channelConcentrationRiskInterpretation = `Low Risk: ${highestNonEmailChannelName} accounts for ${highestNonEmailChannelPercent.toFixed(0)}% of customers.`;
    }

    // --- Unit Economics Health Score (de M2L Parte 1) ---
    // ltvToCacRatio y m2l_unitEconomicsHealthInterpretation ya están declaradas e inicializadas arriba.
    const ltv = parseFloat(formData.m2l_unit_90DayGrossProfit);
    const cac = parseFloat(formData.m2l_unit_overallCAC);
    if (!isNaN(ltv) && !isNaN(cac) && cac > 0) {
        ltvToCacRatio = ltv / cac; // Asignación a la variable local 'ltvToCacRatio'
        if (ltvToCacRatio > 3) m2l_unitEconomicsHealthInterpretation = "Excellent unit economics (LTV:CAC > 3:1)";
        else if (ltvToCacRatio >= 2) m2l_unitEconomicsHealthInterpretation = "Good unit economics (LTV:CAC 2-3:1)";
        else if (ltvToCacRatio >= 1.5) m2l_unitEconomicsHealthInterpretation = "Acceptable but needs improvement (LTV:CAC 1.5-2:1)";
        else m2l_unitEconomicsHealthInterpretation = "Critical - unsustainable economics (LTV:CAC < 1.5:1)";
    } else if (!isNaN(ltv) && !isNaN(cac) && cac === 0 && ltv > 0) {
        m2l_unitEconomicsHealthInterpretation = "Excellent (Infinite LTV:CAC due to $0 CAC with positive LTV)";
        ltvToCacRatio = Infinity; // Asignación a la variable local 'ltvToCacRatio'
    } else if (cac < 0) {
        m2l_unitEconomicsHealthInterpretation = "Invalid CAC (negative value)";
    }

    // --- Owner Strategic Positioning para M2L (de M2L Parte 2) ---
    // m2l_ownerStrategicPositioning ya está declarada e inicializada arriba.
    m2lPart2Questions.forEach(qDef_strat => { 
        if (qDef_strat.valueKey.endsWith('_process')) {
            const baseValueKey = qDef_strat.valueKey.replace('_process', '');
            const ownerValueKey = `${baseValueKey}_owner`;
            const processAnswerValue = formData[qDef_strat.valueKey];
            const ownerAnswerValue = formData[ownerValueKey];
            const ownerQDef_strat = m2lPart2Questions.find(q => q.valueKey === ownerValueKey);
            if (processAnswerValue && ownerAnswerValue && qDef_strat.options && ownerQDef_strat && ownerQDef_strat.options) {
                const processOpt = qDef_strat.options.find(o => o.value === processAnswerValue);
                const ownerOpt = ownerQDef_strat.options.find(o => o.value === ownerAnswerValue);
                if (processOpt && ownerOpt && typeof processOpt.score === 'number' && typeof ownerOpt.score === 'number') {
                    const pScore = processOpt.score; const oScore = ownerOpt.score;   
                    const qTitle = qDef_strat.text.substring(qDef_strat.text.indexOf(' ') + 1, qDef_strat.text.indexOf(':')).trim() || `Area for ${baseValueKey}`;
                    if (pScore >= 5 && (oScore === 0 || oScore === 1)) m2l_ownerStrategicPositioning.areasForDelegation.push(qTitle);
                    if (pScore <= 3 && oScore === 5) m2l_ownerStrategicPositioning.areasForActiveManagement.push(qTitle);
                }
            }
        }
    });

    const allM2LQuestions = [...m2lPart1Questions, ...m2lPart2Questions];
    allM2LQuestions.forEach(q => {
        if (formData.hasOwnProperty(q.valueKey)) {
            m2lFormDataForPrompt[q.valueKey] = formData[q.valueKey];
        }
    });

return {
        isM2L: true,
        m2l_processMaturityScore,
        m2l_ownerIndependenceScore,
        
        m2l_activeChannelsCount: activeChannelsCount, // Mantenido por si lo usas en el prompt
        
        // Nuevas propiedades para Channel Concentration Risk
        m2l_highestNonEmailChannelPercent: highestNonEmailChannelPercent,
        m2l_highestNonEmailChannelName: highestNonEmailChannelName,
        m2l_channelConcentrationRiskInterpretation: m2l_channelConcentrationRiskInterpretation, // Esta reemplaza la vieja interpretación de diversificación

        m2l_ltvToCacRatio: ltvToCacRatio,
        m2l_unitEconomicsHealthInterpretation,
        m2l_ownerStrategicPositioning,
        formDataForPrompt: m2lFormDataForPrompt,
        m2l_processAssessmentDetails,
    };
}, [formData, allAppSections, getMarketToLeadPart1Questions, getMarketToLeadPart2Questions]);

  
    const m2lPercentageFields = [
    'm2l_meta_ads_customerPercent', 'm2l_meta_ads_warmTrafficPercent',
    'm2l_tiktok_ads_customerPercent', 'm2l_tiktok_ads_warmTrafficPercent',
    'm2l_google_ads_customerPercent', 'm2l_google_ads_warmTrafficPercent',
    'm2l_linkedin_ads_customerPercent', 'm2l_linkedin_ads_warmTrafficPercent',
    'm2l_youtube_ads_customerPercent', 'm2l_youtube_ads_warmTrafficPercent',
    'm2l_otherPaidChannels_customerPercent',
    'm2l_youtube_organic_customerPercent', 'm2l_youtube_organic_warmTrafficPercent',
    'm2l_linkedin_organic_customerPercent', 'm2l_linkedin_organic_warmTrafficPercent',
    'm2l_google_seo_customerPercent', 'm2l_google_seo_warmTrafficPercent',
    'm2l_instagram_organic_customerPercent', 'm2l_instagram_organic_warmTrafficPercent',
    'm2l_otherOrganicChannels_customerPercent',
    'm2l_email_marketing_customerPercent', 'm2l_email_marketing_warmTrafficPercent',
    'm2l_text_sms_marketing_customerPercent', 'm2l_text_sms_marketing_warmTrafficPercent',
    'm2l_referral_customerPercent', 'm2l_referral_internalExternalPercent',
    // Añade aquí cualquier otro campo de M2L que sea un porcentaje y deba estar entre 0-100.
    // No incluyas campos que no sean porcentajes, como 'monthlySpend' o 'productRevenue'.
];
    const handleChange = useCallback((event) => {
        const { name, value, type: eventType } = event.target;
        let processedValue = value;

        if (eventType === 'number' || 
            (typeof value === 'string' && value !== '' && !isNaN(Number(value)))
        ) {
            let numValue = value === '' ? null : parseFloat(value);

            if (numValue !== null && !isNaN(numValue)) {
                // Primero, asegurar que no sea negativo si está en m2lNonNegativeNumericFields
                if (m2lNonNegativeNumericFields.includes(name) && numValue < 0) {
                    numValue = 0; 
                }

                // Luego, si es un campo de porcentaje, asegurar que esté entre 0 y 100
                if (m2lPercentageFields.includes(name)) {
                    if (numValue < 0) { // Doble chequeo por si no estaba en m2lNonNegativeNumericFields
                        numValue = 0;
                    }
                    if (numValue > 100) {
                        numValue = 100; // No permitir más de 100
                    }
                }
            }
            processedValue = numValue;
        }
        
        setFormData(prevData => {
            const newFormData = { ...prevData, [name]: processedValue };

            const isChannelUseQuestion = name.startsWith('m2l_') && 
                                       (name.endsWith('_use') || 
                                        name === 'm2l_referral_formal_programs' || 
                                        name.endsWith('_list')); 

            if (isChannelUseQuestion && processedValue === 'no') {
                const fieldsToReset = getAssociatedNumericFieldsForChannel(name); 
                fieldsToReset.forEach(fieldKey => {
                    if (newFormData.hasOwnProperty(fieldKey)) {
                        newFormData[fieldKey] = 0; 
                    }
                });
                console.log(`[handleChange] Resetting fields for ${name}:`, fieldsToReset);
            } else if (isChannelUseQuestion && processedValue === '') { // Si el usuario des-selecciona un "Yes/No" (vuelve a "Please select...")
                // Podríamos querer resetear también en este caso, o no.
                // Por ahora, solo reseteamos en "no".
            }
            
            return newFormData;
        });

        if (errors[name]) {
            const newErrors = { ...errors }; // Crear copia para modificar
            delete newErrors[name];
            setErrors(newErrors);
        }

    }, [errors, formData, getAssociatedNumericFieldsForChannel]);

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

const generateM2LPromptTextInternal = useCallback((
    m2lCalculatedData,    
    m2lPart1QuestionDefs, 
    m2lPart2QuestionDefs  
) => {
    if (!m2lCalculatedData || !m2lCalculatedData.formDataForPrompt) {
        console.error("generateM2LPromptTextInternal: Missing m2lCalculatedData or formDataForPrompt.");
        return "Error: Could not generate M2L prompt due to missing data.";
    }

    const fd = m2lCalculatedData.formDataForPrompt; // Alias para las respuestas directas
    let output = "Market to Lead Current Company Scoring\n\n";

    // --- Primary Product/Service Marketing Profile ---
    output += "Primary Marketing Channel Focus\n"; // Título ajustado
    const primaryChannelValue = fd.m2l_primaryMarketingChannel; // Asumiendo que esta pregunta se queda
    const primaryChannelOption = MARKETING_CHANNELS_OPTIONS.find(opt => opt.value === primaryChannelValue);
    output += `Primary Marketing Channel Considered: ${primaryChannelOption ? primaryChannelOption.text : (primaryChannelValue || "N/A")}\n\n`;

    // --- Complete Marketing Channel Attribution ---
    output += "Complete Marketing Channel Attribution\n";
    output += "Paid Advertising Channels:\n";
    let totalPaidSpend = 0;
    const paidChannelKeys = ['meta_ads', 'tiktok_ads', 'google_ads', 'linkedin_ads', 'youtube_ads'];
    // Necesitamos los display names para los canales. Podríamos tener un mapeo o extraerlos de las definiciones de preguntas.
    // Por simplicidad, usaré los keys y un nombre genérico si no tenemos un display name fácil aquí.
    // Idealmente, m2lPart1QuestionDefs podría ayudar a obtener los display names.

    paidChannelKeys.forEach(key => {
        if (fd[`m2l_${key}_use`] === 'yes') {
            const spend = parseFloat(fd[`m2l_${key}_monthlySpend`] || 0);
            totalPaidSpend += spend;
            const qDefBase = m2lPart1QuestionDefs.find(q => q.valueKey === `m2l_${key}_use`);
            const displayName = qDefBase ? qDefBase.text.replace('Do you use ', '').replace('?', '') : key.replace('_ads',' Ads').toUpperCase();
            output += `${displayName}: ${fd[`m2l_${key}_customerPercent`] || 0}% of customers, $${spend.toLocaleString()}/month spend, ${fd[`m2l_${key}_warmTrafficPercent`] || 0}% warm traffic\n`;
        }
    });
    const otherPaidSpend = parseFloat(fd.m2l_otherPaidChannels_monthlySpend || 0);
    totalPaidSpend += otherPaidSpend;
    output += `Other Paid Channels: ${fd.m2l_otherPaidChannels_list || "None"}, ${fd.m2l_otherPaidChannels_customerPercent || 0}% of customers combined, $${otherPaidSpend.toLocaleString()}/month spend\n`;
    output += `Total Paid Advertising Spend: $${totalPaidSpend.toLocaleString()}/month\n\n`;
    
    output += "Content/Organic Channels:\n";
    const organicChannelKeys = ['youtube_organic', 'linkedin_organic', 'google_seo', 'instagram_organic'];
    organicChannelKeys.forEach(key => {
        if (fd[`m2l_${key}_use`] === 'yes') {
            const qDefBase = m2lPart1QuestionDefs.find(q => q.valueKey === `m2l_${key}_use`);
            const displayName = qDefBase ? qDefBase.text.replace('Do you use ', '').replace('?', '') : key.replace('_',' ').toUpperCase();
            const warmSuffix = key === 'google_seo' ? " (branded searches)" : "";
            output += `${displayName}: ${fd[`m2l_${key}_customerPercent`] || 0}% of customers, ${fd[`m2l_${key}_warmTrafficPercent`] || 0}% warm traffic${warmSuffix}\n`;
        }
    });
    output += `Other Organic Channels: ${fd.m2l_otherOrganicChannels_list || "None"}, ${fd.m2l_otherOrganicChannels_customerPercent || 0}% of customers combined\n\n`;

    output += "Direct Outreach:\n";
    if (fd.m2l_email_marketing_use === 'yes') {
        output += `Email Marketing: ${fd.m2l_email_marketing_customerPercent || 0}% of customers, ${fd.m2l_email_marketing_warmTrafficPercent || 0}% warm audiences\n`;
    }
    if (fd.m2l_text_sms_marketing_use === 'yes') {
        output += `Text/SMS Marketing: ${fd.m2l_text_sms_marketing_customerPercent || 0}% of customers, ${fd.m2l_text_sms_marketing_warmTrafficPercent || 0}% warm audiences\n`;
    }
    output += "\n";

    output += "Affiliate/Referral Programs:\n";
    if (fd.m2l_referral_formal_programs === 'yes') {
        output += `Referral Programs: ${fd.m2l_referral_customerPercent || 0}% of customers, ${fd.m2l_referral_internalExternalPercent || 0}% internal vs external referrals\n`;
    } else {
        output += "Referral Programs: No formal programs indicated.\n";
    }
    output += "\n";

    // --- Unit Economics Data ---
    output += "Unit Economics Data\n";
    output += `Overall Blended CAC: $${parseFloat(fd.m2l_unit_overallCAC || 0).toLocaleString()}\n`;
    output += `Primary Channel CAC: $${parseFloat(fd.m2l_unit_primaryChannelCAC || 0).toLocaleString()}\n`;
    output += `90-Day Customer Gross Profit: $${parseFloat(fd.m2l_unit_90DayGrossProfit || 0).toLocaleString()}\n`;
    output += `90-day CV:CAC Ratio: ${typeof m2lCalculatedData.m2l_ltvToCacRatio === 'number' ? m2lCalculatedData.m2l_ltvToCacRatio.toFixed(2) : 'N/A'}\n`;
    output += `Monthly Customer Acquisition Fixed Costs: $${parseFloat(fd.m2l_unit_monthlyAcqFixedCosts || 0).toLocaleString()}\n`;
    output += `Monthly Sales Needed for Customer Acquisition Breakeven: ${fd.m2l_unit_salesForAcqBreakeven || 0} sales\n`;
    output += `Total Monthly Fixed Costs: $${parseFloat(fd.m2l_unit_totalMonthlyFixedCosts || 0).toLocaleString()}\n`;
    output += `Monthly Sales Needed for Overall Profitability: ${fd.m2l_unit_salesForOverallProfitability || 0} sales\n\n`;

    // --- Channel Performance Analysis & AI Recommendations ---
    output += "Channel Performance Analysis & AI Recommendations\n";
    output += `Primary channel performance: [Analysis for ${primaryChannelOption ? primaryChannelOption.text : (fd.m2l_primaryMarketingChannel || "N/A")} needed]\n`;
    output += "Underperforming channels: [Logic to identify these needed - e.g., channels with high spend but low customer %]\n";
    output += "High-opportunity channels: [Logic to identify these needed - e.g., channels with high customer % but low/no spend]\n";
    output += "Warm traffic optimization: [Logic to identify channels needing warm traffic optimization needed]\n\n";
 output += `Channel Concentration Risk Assessment: ${m2lCalculatedData.m2l_channelConcentrationRiskInterpretation || "Not calculated"}\n`;
    if (m2lCalculatedData.m2l_highestNonEmailChannelPercent > 0 && 
        !m2lCalculatedData.m2l_channelConcentrationRiskInterpretation?.includes("Good/Excellent Diversification")) {
        output += `(Dominant non-email channel for concentration: ${m2lCalculatedData.m2l_highestNonEmailChannelName} at ${m2lCalculatedData.m2l_highestNonEmailChannelPercent?.toFixed(0)}% of customers)\n`;
    }
    output += "Warm traffic optimization: [Logic to identify channels needing warm traffic optimization needed]\n\n";

    // --- Complete Competitive Analysis ---
    output += "Complete Competitive Analysis\nDirect Competitors:\n";
    const competitors = (fd.m2l_pa_14_top3Competitors || "").split('\n').map(s => s.trim()).filter(Boolean);
    const competitorAdvantages = (fd.m2l_pa_14_competitorAdvantages || "").split('\n').map(s => s.trim()).filter(Boolean);
    const diffs = [fd.m2l_pa_14_diffFromComp1, fd.m2l_pa_14_diffFromComp2, fd.m2l_pa_14_diffFromComp3];

    for (let i = 0; i < 3; i++) {
        if (competitors[i]) {
            output += `Competitor #${i+1}: ${competitors[i]} - Primary advantage: ${competitorAdvantages[i] || 'N/A'} - How you differentiate: ${diffs[i] || 'N/A'}\n`;
        }
    }
    output += "\nCompetitive Positioning:\n";
    output += `What competitors do better: ${fd.m2l_pa_14_competitorsDoBetter || 'N/A'}\n`;
    output += `What you do better than all competitors: ${fd.m2l_pa_14_youDoBetter || 'N/A'}\n`;
    output += "Category of One positioning: [Analysis needed based on differentiation inputs]\n\n"; // Necesitaría lógica de score o análisis
    
    output += "When discussing competitive strategy, AI should:\n";
    output += "- Reference specific competitor strengths and how to counter them\n";
    output += `- Leverage your unique advantages identified in the assessment (e.g., "${fd.m2l_pa_14_youDoBetter || 'Your Stated Advantage'}")\n`;
    output += `- Suggest ways to avoid direct price competition with ${competitors.length > 0 ? competitors.join(', ') : '[Competitors]'}\n`;
    output += "- Recommend strengthening differentiation in areas where [specific competitor] currently has advantage\n";
    output += "- Focus on building \"category of one\" positioning to escape commodity competition\n\n";

    // --- Owner Strategic Positioning (M2L) ---
    const m2lOSP = m2lCalculatedData.m2l_ownerStrategicPositioning;
    if (m2lOSP) { // Asegurarse que el objeto existe
        output += "**Owner Strategic Positioning**\n";
        output += "Areas for strategic oversight (delegation opportunities): " 
                + (m2lOSP.areasForDelegation && m2lOSP.areasForDelegation.length > 0 ? m2lOSP.areasForDelegation.join(', ') : "None identified") 
                + ". User wants to begin delegating these areas to other members of the team.\n";
        output += "Areas for active management: " 
                + (m2lOSP.areasForActiveManagement && m2lOSP.areasForActiveManagement.length > 0 ? m2lOSP.areasForActiveManagement.join(', ') : "None identified") 
                + ". User wants to become actively involved in these areas to bring up competency. AI should share information whenever possible on best practices, templates, etc.\n\n";
    }


    // --- Process Improvement Priorities ---
    output += "Process Improvement Priorities\n";
    const m2lImprovementTemplates = {
        'm2l_pa_1_marketResearchICP_process': "Market Research & ICP Development: Current customer profiling needs strengthening. AI should proactively suggest ICP refinement exercises, customer interview templates, and data analysis frameworks when discussing target audience or marketing strategy. Prioritize creating detailed buyer personas based on the [%CUSTOMER_PERCENT_PRIMARY_CHANNEL%]% of customers coming from [%PRIMARY_CHANNEL%] and analyze why [%SECONDARY_CHANNEL%] drives [%CUSTOMER_PERCENT_SECONDARY_CHANNEL%]% despite [%INVESTMENT_LEVEL_SECONDARY_CHANNEL%] investment.",
        'm2l_pa_2_brandPositioning_process': "Brand Positioning & Messaging: Current positioning lacks clarity or differentiation. AI should suggest messaging frameworks, competitive differentiation exercises, and value proposition templates. When discussing marketing content, prioritize developing clear positioning that explains why customers choose you over competitors, especially given your success in [%PRIMARY_CHANNEL%] versus [%UNDERPERFORMING_CHANNELS%].",
        'm2l_pa_3_contentStrategy_process': "Content Strategy & Development: Content creation lacks systematic approach. AI should recommend editorial calendar templates, content pillar frameworks, and repurposing strategies. Focus on scaling content for [%ORGANIC_CHANNELS_DRIVING_CUSTOMERS%] and creating content that converts cold traffic to warm audiences for [%CHANNELS_LOW_WARM_TRAFFIC%].",
        'm2l_pa_4_leadGenCapture_process': "Lead Generation & Capture Systems: Lead conversion processes need optimization. AI should suggest landing page optimization, lead magnet development, and conversion rate improvement tactics. Prioritize improving conversion rates for [%PRIMARY_TRAFFIC_SOURCE%] and implementing lead capture for [%HIGH_TRAFFIC_LOW_CONVERSION_CHANNELS%].",
        'm2l_pa_5_marketingAutomation_process': "Marketing Automation & Nurturing: Automation systems are underdeveloped. AI should recommend email sequence templates, behavioral trigger setups, and CRM integration strategies. Focus on nurturing the [%LEAD_PERCENT_PRIMARY_CHANNEL%]% of leads from [%PRIMARY_CHANNEL%] and creating automated follow-up for [%CHANNELS_LOW_WARM_TRAFFIC%].",
        'm2l_pa_6_paidMedia_process': "Paid Media Strategy & Optimization: Paid advertising lacks strategic approach. Given current spend of $[%TOTAL_PAID_SPEND%]/month with [%OVERALL_PAID_CUSTOMER_PERCENT%]% overall customer acquisition from paid, AI should suggest campaign optimization, audience targeting improvements, and budget reallocation strategies. Prioritize improving ROI for [%HIGHEST_SPEND_CHANNEL%] and testing expansion of [%HIGH_PERFORMING_LOW_SPEND_CHANNELS%].",
        'm2l_pa_7_analyticsAttribution_process': "Performance Analytics & Attribution: Measurement capabilities are insufficient. AI should recommend attribution modeling, analytics setup, and reporting dashboard creation. Critical need to better track the customer journey from [%PRIMARY_CHANNEL%] through conversion and understand why [%CHANNEL_HIGH_SPEND_LOW_CUSTOMERS%] underperforms.",
        'm2l_pa_8_customerJourney_process': "Customer Journey Optimization: Journey mapping and optimization lacks systematic approach. AI should suggest journey mapping exercises, touchpoint optimization, and conversion funnel analysis. Focus on optimizing the path from [%PRIMARY_TRAFFIC_SOURCE%] to sale and identifying friction points in [%UNDERPERFORMING_CHANNELS%].",
        'm2l_pa_9_competitiveAnalysis_process': "Competitive Analysis & Market Intelligence: Competitive monitoring is insufficient. AI should recommend competitive research frameworks, monitoring tools, and market analysis templates. Focus on understanding why competitors may be more successful in [%CHANNELS_LOW_PERFORMANCE%] and identifying opportunities in [%YOUR_HIGH_PERFORMING_CHANNELS%].",
        'm2l_pa_10_martech_process': "Marketing Technology Stack: Technology integration needs improvement. AI should suggest integration strategies, tool selection criteria, and workflow automation. Prioritize connecting data flow between [%PRIMARY_CHANNEL_SYSTEMS%] systems and overall reporting to better understand the [%CUSTOMER_ATTRIBUTION_ACROSS_CHANNELS%]% customer attribution across channels.",
        'm2l_pa_11_teamResource_process': "Team & Resource Management: Team organization and resource allocation need structure. AI should recommend organizational frameworks, role definition templates, and performance management systems. Focus on allocating resources toward [%HIGHEST_PERFORMING_CHANNELS%] and building capabilities for [%UNDERUTILIZED_HIGH_OPPORTUNITY_CHANNELS%].",
        'm2l_pa_12_budgetROI_process': "Budget Planning & ROI Management: Financial planning and ROI tracking lack sophistication. Given current total marketing spend of $[%TOTAL_MARKETING_SPEND%] and blended CAC of $[%BLENDED_CAC%], AI should recommend budget optimization frameworks, ROI calculation methods, and resource allocation strategies. Prioritize reallocating budget from [%UNDERPERFORMING_CHANNELS%] to [%HIGH_OPPORTUNITY_CHANNELS%] and improving CAC for [%PRIMARY_CHANNEL%].",
        'm2l_pa_13_competitivePositioning_process': "Competitive Positioning & Differentiation: Current differentiation is not strong enough. AI should help develop stronger unique selling propositions and positioning statements. Focus on achieving 'category of one' status relative to [%COMPETITORS%].",
        'm2l_pa_14_competitorIntelligence_process': "Competitor Intelligence & Market Awareness: Insufficient monitoring of the competitive landscape. AI should recommend tools and processes for systematic competitor tracking and analysis. Focus on understanding [%COMPETITOR_STRATEGIES_IN_KEY_CHANNELS%]."
    };

    if (m2lCalculatedData.m2l_processAssessmentDetails) {
        m2lCalculatedData.m2l_processAssessmentDetails.forEach(detail => {
            if (detail.processAnswerScore < 5) { // Condición: Si el score de la pregunta de proceso es < 5
                const templateKey = `m2l_pa_${detail.id.split('_')[2]}_${detail.id.split('_')[3]}_process`; // Reconstruir el valueKey
                const templateText = m2lImprovementTemplates[templateKey];
                if (templateText) {
                    const questionTitle = detail.processQuestionText.substring(detail.processQuestionText.indexOf(' ') + 1, detail.processQuestionText.indexOf(':')).trim();
                    let filledTemplate = templateText;
                    // TODO: Implementar lógica de reemplazo de placeholders más robusta aquí.
                    // Por ahora, solo usamos la respuesta del usuario para [%RESPONSE%] si existiera.
                    // El template original del cliente usa placeholders más complejos.
                    // Este es un ejemplo simple:
                    filledTemplate = filledTemplate.replace("[%RESPONSE%]", `"${detail.processAnswerText}"`); // Ejemplo si el template tuviera [%RESPONSE%]
                    
                    output += `**${questionTitle}**\n`;
                    output += filledTemplate + `\n(User's current approach: "${detail.processAnswerText}")\n\n`;
                }
            }
        });
    }
    
    output += "Industry-Specific Marketing Guidance\n";
    // Necesitaríamos saber la industria seleccionada por el usuario (de "Your Profile")
    // const userIndustry = fd.naicsSector; // o un campo más específico si lo tienes
    // output += `[Based on selected industry: ${userIndustry || "General Small Business"}]\n\n`;
    output += "[Based on selected industry - consulting, manufacturing, retail, construction, or general small business]\n\n";
    
    output += "This enhanced Master Prompt will enable AI to provide sophisticated marketing guidance, channel optimization recommendations, and specific implementation strategies based on your current marketing maturity level, actual channel performance data, and unit economics.\n";

    return output;
//}, [MARKETING_CHANNELS_OPTIONS]); // Si MARKETING_CHANNELS_OPTIONS es importada, no es estrictamente necesaria aquí.
}, [MARKETING_CHANNELS_OPTIONS]); 

const currentSectionName = visibleSections[currentStep];
const currentQuestions = useMemo(() => {
    if (currentSectionName === undefined) return [];
    const allDefinedQuestions = getQuestionsDataArray();
    if (!Array.isArray(allDefinedQuestions)) return [];
    return allDefinedQuestions.filter(q => q.section === currentSectionName);
}, [currentSectionName, visibleSections]); // Añadir visibleSections

  const m2lNonNegativeNumericFields = [
// Channel Performance - Paid
'm2l_meta_ads_customerPercent', 'm2l_meta_ads_monthlySpend', 'm2l_meta_ads_warmTrafficPercent',
'm2l_tiktok_ads_customerPercent', 'm2l_tiktok_ads_monthlySpend', 'm2l_tiktok_ads_warmTrafficPercent',
'm2l_google_ads_customerPercent', 'm2l_google_ads_monthlySpend', 'm2l_google_ads_warmTrafficPercent',
'm2l_linkedin_ads_customerPercent', 'm2l_linkedin_ads_monthlySpend', 'm2l_linkedin_ads_warmTrafficPercent',
'm2l_youtube_ads_customerPercent', 'm2l_youtube_ads_monthlySpend', 'm2l_youtube_ads_warmTrafficPercent',
'm2l_otherPaidChannels_customerPercent', 'm2l_otherPaidChannels_monthlySpend',
// Channel Performance - Organic
'm2l_youtube_organic_customerPercent', 'm2l_youtube_organic_warmTrafficPercent',
'm2l_linkedin_organic_customerPercent', 'm2l_linkedin_organic_warmTrafficPercent',
'm2l_google_seo_customerPercent', 'm2l_google_seo_warmTrafficPercent',
'm2l_instagram_organic_customerPercent', 'm2l_instagram_organic_warmTrafficPercent',
'm2l_otherOrganicChannels_customerPercent',
// Channel Performance - Direct Outreach
'm2l_email_marketing_customerPercent', 'm2l_email_marketing_warmTrafficPercent',
'm2l_text_sms_marketing_customerPercent', 'm2l_text_sms_marketing_warmTrafficPercent',
// Channel Performance - Referral
'm2l_referral_customerPercent', 'm2l_referral_internalExternalPercent',

// Unit Economics Analysis (Campos que deben ser >= 0)
'm2l_unit_overallCAC',
'm2l_unit_primaryChannelCAC',
// 'm2l_unit_90DayGrossProfit', // El Gross Profit SÍ podría ser negativo si hay pérdidas. Lo omito.
'm2l_unit_monthlyAcqFixedCosts',
'm2l_unit_salesForAcqBreakeven',
'm2l_unit_90DayGrossProfit', 
'm2l_unit_totalMonthlyFixedCosts',
'm2l_unit_salesForOverallProfitability'
// Considera si algún otro campo numérico de M2L P1 no debe ser negativo.
];

const handleGenerateStepPrompt = useCallback((sectionNameForPrompt) => {
    console.log(`[MultiStepForm] Generating prompt for section: ${sectionNameForPrompt}`);
    let promptText = "";

    const S2D_SECTION_NAME = allAppSections[1]; // Índice 1 es S2D
    const D2S_SECTION_NAME = allAppSections[2]; // Índice 2 es D2S
    // --- NUEVAS CONSTANTES PARA M2L ---
    const M2L_PART1_NAME = allAppSections[3];   // Índice 3 es M2L P1 ("Market to Lead - Channels & Economics")
    const M2L_PART2_NAME = allAppSections[4];   // Índice 4 es M2L P2 ("Market to Lead - Process Assessment")
    const M2L_UNIFIED_NAME = "Market to Lead Process Assessment"; // Título unificado para el prompt

    if (sectionNameForPrompt === S2D_SECTION_NAME) {
        const s2dQuestionDefinitions = getSaleToDeliveryProcessQuestions(S2D_SECTION_NAME);
        promptText = generateS2DPromptTextInternal(formData, s2dQuestionDefinitions);
    } else if (sectionNameForPrompt === D2S_SECTION_NAME) {
        const d2sQuestionDefinitions = getDeliveryToSuccessQuestions(D2S_SECTION_NAME);
        // Si generateD2SPromptTextInternal necesita d2sData, asegúrate que calculateD2SSectionData()
        // esté disponible y se llame aquí o que d2sData se obtenga de sectionResultsData si es aplicable.
        const d2sData = sectionResultsData && sectionResultsData.isD2S ? sectionResultsData : calculateD2SSectionData();
        if (d2sData) {
            promptText = generateD2SPromptTextInternal(formData, d2sData, d2sQuestionDefinitions);
        } else {
            promptText = "Error: Could not calculate D2S data for prompt generation.";
            console.error("Failed to generate D2S prompt because d2sData was null/undefined.");
        }
    // --- NUEVO BLOQUE ELSE IF PARA M2L ---
    } else if (
        sectionNameForPrompt === M2L_PART1_NAME || 
        sectionNameForPrompt === M2L_PART2_NAME ||
        sectionNameForPrompt === M2L_UNIFIED_NAME // Para cuando se llama desde la página de resultados M2L
    ) {
        const m2lP1Defs = getMarketToLeadPart1Questions(M2L_PART1_NAME);
        const m2lP2Defs = getMarketToLeadPart2Questions(M2L_PART2_NAME);
  
        let m2lDataForPrompt;
        if (sectionResultsData && sectionResultsData.isM2L) {
            m2lDataForPrompt = sectionResultsData;
        } else {
            // Fallback: Recalcular. Esto asegura que la función tenga datos,
            // pero es menos eficiente si ya se habían calculado para la página de resultados.
            console.warn("[handleGenerateStepPrompt] Recalculating M2L data for prompt. Consider optimizing if called frequently outside results page.");
            m2lDataForPrompt = calculateMarketToLeadData(); 
        }

        if (m2lDataForPrompt) {
            promptText = generateM2LPromptTextInternal(m2lDataForPrompt, m2lP1Defs, m2lP2Defs);
        } else {
            promptText = "Error: Could not calculate Market to Lead data for prompt generation.";
            console.error("Failed to generate M2L prompt because m2lDataForPrompt was null/undefined.");
        }
    // --- FIN NUEVO BLOQUE ELSE IF PARA M2L ---
    } else { // Para las secciones estándar (Expansion, Marketing, etc.)
        promptText = `## Prompt for Section: ${sectionNameForPrompt} ##\n\n`;
        
        // Usar el índice correcto para getQuestionsForStep.
        // Si sectionNameForPrompt es confiable, podemos buscar su índice.
        const sectionIndex = allAppSections.indexOf(sectionNameForPrompt);
        const questionsForThisSection = sectionIndex !== -1 ? getQuestionsForStep(sectionIndex) : [];
        
        if (questionsForThisSection.length > 0) {
            promptText += `Your current answers for this section:\n`;
            questionsForThisSection.forEach(q => {
                const answer = formData[q.valueKey];
                let displayAnswer = '(Not answered)';
                if (answer !== undefined && answer !== '' && answer !== null) {
                    if (q.type === 'mcq' && q.options) {
                        const selectedOpt = q.options.find(opt => opt.value === answer || opt.text === answer);
                        displayAnswer = selectedOpt ? `"${selectedOpt.text}"` : `"${String(answer)}"`;
                    } else {
                        displayAnswer = String(answer);
                    }
                }
                promptText += `- ${q.text}: ${displayAnswer}\n`;
            });
            promptText += "\n";
        } else {
            promptText += "No questions found for this section to display answers.\n\n";
        }

        promptText += "--- AI Suggestions & Considerations ---\n";

        // Aquí va toda tu lógica condicional existente para las secciones 2 a 8
        // (índices de allAppSections)
        
        if (sectionNameForPrompt === allAppSections[5]) { // "Expansion Capability"
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
        
        } else if (sectionNameForPrompt === allAppSections[6]) { // "Marketing & Brand Equity"
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

        } else if (sectionNameForPrompt === allAppSections[7]) { // "Profitability Metrics"
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

        } else if (sectionNameForPrompt === allAppSections[8]) { // "Offering & Sales Effectiveness"
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

        } else if (sectionNameForPrompt === allAppSections[9]) { // "Workforce & Leadership"
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
        
        } else if (sectionNameForPrompt === allAppSections[10]) { // "Execution Systems"
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

        } else if (sectionNameForPrompt === allAppSections[11]) { // "Robust Market Position"
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
    formData, currentStep, allAppSections, sectionResultsData, // sectionResultsData es importante aquí
    generateS2DPromptTextInternal, getSaleToDeliveryProcessQuestions,
    generateD2SPromptTextInternal, getDeliveryToSuccessQuestions, calculateD2SSectionData,
    generateM2LPromptTextInternal, // <--- AÑADIDO
    getMarketToLeadPart1Questions, 
    getMarketToLeadPart2Questions, 
    calculateMarketToLeadData,     
    getQuestionsForStep,
    MARKETING_CHANNELS_OPTIONS
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

    const handleNext = useCallback(() => {
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
        const S2D_SECTION_INDEX = 1; // "Sale to Delivery"
        const D2S_SECTION_INDEX = 2; // "Delivery to Success"
        const M2L_PART1_INDEX = 3;   // "Market to Lead - Channels & Economics"
        const M2L_PART2_INDEX = 4;   // "Market to Lead - Process Assessment"

        const isLastQuestionStep = currentStep === TOTAL_STEPS_QUESTIONS - 1; 

        const stepsThatTriggerResultsPage = [];

        // Determinar si el paso actual debe mostrar una página de resultados
        const shouldShowSectionResultsPage = stepsThatTriggerResultsPage.includes(currentStep);

        if (currentStep === M2L_PART1_INDEX) {
            // Si estamos en M2L Parte 1, simplemente avanzamos a M2L Parte 2
            // sin mostrar página de resultados intermedia.
            if (!isLastQuestionStep) { // Doble chequeo por si acaso
                 setCurrentStep(prevStep => prevStep + 1);
            } else {
                handleSubmit(); // No debería ocurrir si M2L P1 no es el último
            }
        } else if (shouldShowSectionResultsPage) {
            let resultsForSectionPage;
            let sectionTitleForResultsPage = allAppSections[currentStep]; // Título por defecto

            if (currentStep === S2D_SECTION_INDEX) {
                console.log(`[MultiStepForm] Completed S2D section. Calculating results...`);
                resultsForSectionPage = calculateS2DSectionData();
            } else if (currentStep === D2S_SECTION_INDEX) {
                console.log(`[MultiStepForm] Completed D2S section. Calculating results...`);
                resultsForSectionPage = calculateD2SSectionData(); // Asume que esta función existe y está implementada
            } else if (currentStep === M2L_PART2_INDEX) {
                console.log(`[MultiStepForm] Completed M2L Part 2. Calculating M2L results...`);
                resultsForSectionPage = calculateMarketToLeadData(); // Llama a la nueva función para M2L
                sectionTitleForResultsPage = "Market to Lead Process Assessment"; // Título unificado para M2L
            } else {
                // Lógica para las secciones estándar (Expansion, Marketing, etc.)
                console.log(`[MultiStepForm] Completed section: ${sectionTitleForResultsPage}. Calculating results...`);
                const generalScores = calculateScores(formData);
                const questionsForCurrentSection = getQuestionsForStep(currentStep);
                let sectionScore = 0;
                let maxSectionScore = 0;
                let interpretation = "No scoring data available for this section.";
                let primaryScoringAreaName = null;

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
                        interpretation = "Scoring not applicable or max score is zero for this area.";
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
                    return { id: q.id, text: q.text, answer: displayAnswer };
                });

                resultsForSectionPage = {
                    isS2D: false, isD2S: false, isM2L: false, // Marcar que no es una de las especiales
                    sectionTitle: sectionTitleForResultsPage,
                    score: sectionScore,
                    maxScore: maxSectionScore,
                    interpretation: interpretation,
                    questions: questionsAndAnswers
                };
            }
            setSectionResultsData(resultsForSectionPage);
            setShowingSectionResultsFor(sectionTitleForResultsPage); // Usar el título de la página de resultados
        
        } else if (!isLastQuestionStep) {
            // Para pasos que no tienen página de resultados intermedios Y no son el último paso
            // (Ej: "Your Profile", o si M2L_PART1_INDEX no estuviera manejado explícitamente arriba)
            setCurrentStep(prevStep => prevStep + 1);
        } else {
            // Es el último paso de preguntas global ("Your Financials & Industry")
            handleSubmit();
        }
    }
}, [
    currentStep, TOTAL_STEPS_QUESTIONS, currentQuestions, formData, handleSubmit, errors, 
    allAppSections, 
    calculateS2DSectionData,
    calculateD2SSectionData, // Asegúrate de que esta función esté definida y en dependencias
    calculateMarketToLeadData, // Añade la nueva función a dependencias
    calculateScores, 
    calculateMaxScoreForArea, // Necesaria para las secciones estándar
    getQuestionsForStep 
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