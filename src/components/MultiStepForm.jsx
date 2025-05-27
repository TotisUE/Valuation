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
import { getSaleToDeliveryProcessQuestions } from '../sections-data/saleToDeliveryQuestions'; // Asegúrate que este archivo tiene las 10 preguntas S2D
import Step from './Step';
import ProgressIndicator from './ProgressIndicator';
import Navigation from './Navigation';
import ResultsDisplay from './results/ResultsDisplay';
import SectionResultsPage from './SectionResultsPage'; 
import { getFunctionsBaseUrl } from '../utils/urlHelpers';
// NO deberías necesitar 'getDeliveryToSuccessQuestions' si se fusionó con S2D

const downloadAsTxtFile = (text, filename) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
};

const LOCAL_STORAGE_FORM_DATA_KEY = 'valuationFormData';
const LOCAL_STORAGE_CURRENT_STEP_KEY = 'valuationFormCurrentStep';
const LOCAL_STORAGE_CALC_RESULT_KEY = 'valuationCalculationResult';
const LOCAL_STORAGE_SUBMISSION_SUCCESS_KEY = 'valuationSubmissionSuccess';

const buildInitialFormData = () => {
    const allQuestions = getQuestionsDataArray(); // Debe incluir las 10 preguntas S2D (q1-q10)
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
        // Los s2d_qX_process/owner se inicializan por el bucle anterior si están en allQuestions
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
        const saved = localStorage.getItem(LOCAL_STORAGE_CALC_RESULT_KEY);
        try { return saved ? JSON.parse(saved) : null; } catch (e) {
            console.error("Error parsing calculationResult from localStorage:", e);
            localStorage.removeItem(LOCAL_STORAGE_CALC_RESULT_KEY); return null;
        }
    });

    const [submissionSuccess, setSubmissionSuccess] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_SUBMISSION_SUCCESS_KEY);
        return saved === 'true'; 
    });

    const [submissionBackendResultMsg, setSubmissionBackendResultMsg] = useState(null);

    const visibleSections = useMemo(() => allAppSections, []);
    const TOTAL_STEPS_QUESTIONS = visibleSections.length;

    const [showingSectionResultsFor, setShowingSectionResultsFor] = useState(null); 
    const [sectionResultsData, setSectionResultsData] = useState(null);

    const [currentStep, setCurrentStep] = useState(() => {
        if (initialFormDataProp) return 0;
        const savedStep = localStorage.getItem(LOCAL_STORAGE_CURRENT_STEP_KEY);
        const initialStep = savedStep ? parseInt(savedStep, 10) : 0;
        const maxValidStep = TOTAL_STEPS_QUESTIONS > 0 ? TOTAL_STEPS_QUESTIONS - 1 : 0;
        if (isNaN(initialStep) || initialStep < 0 || initialStep > maxValidStep) return 0;
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


   const currentSectionName = useMemo(() => {
        if (currentStep >= 0 && currentStep < visibleSections.length) return visibleSections[currentStep];
        return null; 
    }, [currentStep, visibleSections]);

    const currentQuestions = useMemo(() => {
        if (!currentSectionName) return [];
        const allDefinedQuestions = getQuestionsDataArray();
        if (!Array.isArray(allDefinedQuestions)) return [];
        return allDefinedQuestions.filter(q => q.section === currentSectionName); 
    }, [currentSectionName, getQuestionsDataArray]);

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

const calculateS2DSectionData = useCallback(() => {
        let s2d_processMaturityScore = 0;    // Max 70 (10 preguntas * 7 pts)
        let s2d_ownerIndependenceScore = 0;  // Max 50 (10 preguntas * 5 pts)

        let s2d_resultsEffectivenessScore = 0;      // Q1, Q2 (max 14)
        let s2d_retentionEffectivenessScore = 0;    // Q3, Q4, Q5 (max 21)
        let s2d_reviewsIntegrationScore = 0;        // Q6 (max 7)
        let s2d_referralsGenerationScore = 0;       // Q7 (max 7)
        let s2d_resaleOptimizationScore = 0;        // Q8, Q10 (max 14)
        let s2d_journeyManagementScore = 0;         // Q9 (max 7)

        const s2d_detailedAnswers = { 
            resultsEffectiveness: {}, retentionEffectiveness: {}, reviewsIntegration: {},
            referralsGeneration: {}, resaleOptimization: {}, journeyManagement: {}
        };
        let s2d_ownerStrategicPositioning = { areasForDelegation: [], areasForActiveManagement: [] };

        const s2dSectionName = allAppSections[1]; 
        const s2dQuestionDefinitions = getSaleToDeliveryProcessQuestions(s2dSectionName);

        if (!s2dQuestionDefinitions || s2dQuestionDefinitions.length === 0) {
            console.warn("calculateS2DSectionData: No S2D question definitions found. Section name:", s2dSectionName);
            return {
                isS2D: true, s2d_processMaturityScore: 0, s2d_ownerIndependenceScore: 0,
                s2d_resultsEffectivenessScore: 0, s2d_retentionEffectivenessScore: 0,
                s2d_reviewsIntegrationScore: 0, s2d_referralsGenerationScore: 0,
                s2d_resaleOptimizationScore: 0, s2d_journeyManagementScore: 0,
                s2d_detailedAnswers: {}, 
                s2d_ownerStrategicPositioning: { areasForDelegation: [], areasForActiveManagement: [] },
                s2d_productName: formData.s2d_productName,
                s2d_productDescription: formData.s2d_productDescription,
                s2d_productRevenue: formData.s2d_productRevenue,
            };
        }
        
        const resultsEffectivenessKeys = ["s2d_q1_process", "s2d_q2_process"];
        const retentionEffectivenessKeys = ["s2d_q3_process", "s2d_q4_process", "s2d_q5_process"];
        const reviewsIntegrationKeys = ["s2d_q6_process"];
        const referralsGenerationKeys = ["s2d_q7_process"];
        const resaleOptimizationKeys = ["s2d_q8_process", "s2d_q10_process"];
        const journeyManagementKeys = ["s2d_q9_process"];

        s2dQuestionDefinitions.forEach(q => {
            if (!q.valueKey || !q.valueKey.startsWith('s2d_')) return;
            const answerValue = formData[q.valueKey];
            if (answerValue && q.options && q.type === 'mcq') {
                const selectedOption = q.options.find(opt => opt.value === answerValue);
                if (selectedOption && typeof selectedOption.score === 'number') {
                    const qNumMatch = q.id.match(/s2d_q(\d+)/);
                    const qKeyForDetailed = qNumMatch ? `q${qNumMatch[1]}` : null;

                    if (q.id.includes('_process')) {
                        s2d_processMaturityScore += selectedOption.score;
                        if (resultsEffectivenessKeys.includes(q.valueKey) && qKeyForDetailed) { /* ... */ s2d_resultsEffectivenessScore += selectedOption.score; s2d_detailedAnswers.resultsEffectiveness[qKeyForDetailed] = { questionText: q.text, answerText: selectedOption.text, score: selectedOption.score }; }
                        if (retentionEffectivenessKeys.includes(q.valueKey) && qKeyForDetailed) { /* ... */ s2d_retentionEffectivenessScore += selectedOption.score; s2d_detailedAnswers.retentionEffectiveness[qKeyForDetailed] = { questionText: q.text, answerText: selectedOption.text, score: selectedOption.score }; }
                        if (reviewsIntegrationKeys.includes(q.valueKey) && qKeyForDetailed) { /* ... */ s2d_reviewsIntegrationScore += selectedOption.score; s2d_detailedAnswers.reviewsIntegration[qKeyForDetailed] = { questionText: q.text, answerText: selectedOption.text, score: selectedOption.score }; }
                        if (referralsGenerationKeys.includes(q.valueKey) && qKeyForDetailed) { /* ... */ s2d_referralsGenerationScore += selectedOption.score; s2d_detailedAnswers.referralsGeneration[qKeyForDetailed] = { questionText: q.text, answerText: selectedOption.text, score: selectedOption.score }; }
                        if (resaleOptimizationKeys.includes(q.valueKey) && qKeyForDetailed) { /* ... */ s2d_resaleOptimizationScore += selectedOption.score; s2d_detailedAnswers.resaleOptimization[qKeyForDetailed] = { questionText: q.text, answerText: selectedOption.text, score: selectedOption.score }; }
                        if (journeyManagementKeys.includes(q.valueKey) && qKeyForDetailed) { /* ... */ s2d_journeyManagementScore += selectedOption.score; s2d_detailedAnswers.journeyManagement[qKeyForDetailed] = { questionText: q.text, answerText: selectedOption.text, score: selectedOption.score }; }
                    } else if (q.id.includes('_owner')) {
                        s2d_ownerIndependenceScore += selectedOption.score;
                    }
                }
            }
        });

        for (let i = 1; i <= 10; i++) {
            const processValueKey = `s2d_q${i}_process`;
            const ownerValueKey = `s2d_q${i}_owner`;
            const processAnswer = formData[processValueKey]; 
            const ownerAnswer = formData[ownerValueKey];   
            const processQDef = s2dQuestionDefinitions.find(q => q.valueKey === processValueKey);
            const ownerQDef = s2dQuestionDefinitions.find(q => q.valueKey === ownerValueKey);
            if (processQDef && ownerQDef && processAnswer && ownerAnswer && processQDef.options && ownerQDef.options) {
                const processOpt = processQDef.options.find(o => o.value === processAnswer);
                const ownerOpt = ownerQDef.options.find(o => o.value === ownerAnswer);
                if (processOpt && ownerOpt && typeof processOpt.score === 'number' && typeof ownerOpt.score === 'number') {
                    const pScore = processOpt.score; const oScore = ownerOpt.score;
                    const qTitle = processQDef.text.substring(0, processQDef.text.indexOf(':')).replace(/^\d+\.\s*/, '').trim() || `Area ${i}`;
                    if (pScore >= 5 && (oScore === 0 || oScore === 1)) s2d_ownerStrategicPositioning.areasForDelegation.push(qTitle);
                    if (pScore <= 3 && oScore === 5) s2d_ownerStrategicPositioning.areasForActiveManagement.push(qTitle);
                }
            }
        }
        return {
            isS2D: true, s2d_productName: formData.s2d_productName, s2d_productDescription: formData.s2d_productDescription,
            s2d_productRevenue: formData.s2d_productRevenue, s2d_processMaturityScore, s2d_ownerIndependenceScore,
            s2d_resultsEffectivenessScore, s2d_retentionEffectivenessScore, s2d_reviewsIntegrationScore,
            s2d_referralsGenerationScore, s2d_resaleOptimizationScore, s2d_journeyManagementScore,
            s2d_detailedAnswers, s2d_ownerStrategicPositioning,
        };
    }, [formData, allAppSections, getSaleToDeliveryProcessQuestions]);
    
const generateS2DPromptTextInternal = useCallback((allFormData, s2dData, s2dQuestionDefinitions) => {
        if (!allFormData || !s2dData || !s2dQuestionDefinitions || s2dQuestionDefinitions.length === 0) {
            console.error("generateS2DPromptTextInternal: Missing critical data.");
            return "Error: Could not generate S2D prompt.";
        }
        let output = "##Delivery to Success Current Company Scoring##\n\n"; 
        output += "**Owner Strategic Positioning**\n";
        output += "Areas for strategic oversight (delegation opportunities): " 
                + (s2dData.s2d_ownerStrategicPositioning.areasForDelegation.length > 0 
                    ? s2dData.s2d_ownerStrategicPositioning.areasForDelegation.join(', ') : "None identified") 
                + ". User wants to begin delegating these areas to other members of the team.\n";
        output += "Areas for active management: " 
                + (s2dData.s2d_ownerStrategicPositioning.areasForActiveManagement.length > 0 
                    ? s2dData.s2d_ownerStrategicPositioning.areasForActiveManagement.join(', ') : "None identified") 
                + ". User wants to become actively involved in these areas to bring up competency. AI should share information whenever possible on best practices, templates, etc.\n\n";

        const {
            s2d_resultsEffectivenessScore, s2d_referralsGenerationScore, s2d_resaleOptimizationScore,
            s2d_retentionEffectivenessScore, s2d_ownerIndependenceScore 
        } = s2dData;

        // --- PEGA AQUÍ EL OBJETO promptTemplates COMPLETO CON LOS TEXTOS DE LA GUÍA DEL CLIENTE ---
        const promptTemplates = {
            customerExperienceQuality: [
                { range: [0, 7], text: "Delivery to Success - Current Status: CRITICAL\nOur service/product delivery process is largely undefined with minimal quality control. We lack systematic customer success measurement and have ad-hoc issue resolution processes. Customer support is primarily reactive. My immediate priorities are:\n\n1. Develop basic delivery checklists and quality standards for [PRODUCT/SERVICE]\n2. Implement simple customer feedback collection at key touchpoints\n3. Create a standardized process for responding to and documenting customer issues\n4. Establish regular check-ins with customers during the delivery period\n\nKey improvement opportunities:\n- Document our core delivery steps with clear responsibilities\n- Define minimum quality standards for each delivery component\n- Create a simple issue tracking system accessible to all team members\n- Implement basic post-delivery satisfaction measurement" },
                { range: [8, 14], text: "Delivery to Success - Current Status: BASIC\nOur product/service delivery has some basic procedures but lacks consistency and systematic quality control. Customer success measurement and issue resolution are informal and reactive. We need to strengthen our core delivery processes. My priorities are:\n\n1. Systematize our delivery processes with clear checkpoints and quality standards\n2. Implement consistent customer feedback collection with simple metrics (NPS/CSAT)\n3. Develop a formal system for tracking and resolving customer issues\n4. Create proactive customer success check-ins at predefined intervals\n\nKey improvement opportunities:\n- Document and standardize our delivery workflow across team members\n- Build simple dashboards to track delivery quality metrics\n- Train team members on quality standards and issue resolution\n- Implement a consistent approach to measuring customer satisfaction" },
                { range: [15, 21], text: "Delivery to Success - Optimization Focus:\nOur delivery processes are established but can be optimized. Key enhancement priorities:\n1. Automate quality control checkpoints at critical delivery phases\n2. Segment customer feedback analysis for more targeted improvements \n3. Implement predictive issue identification based on pattern recognition\n4. Enhance proactive success management with personalized strategies by customer segment" }
            ],
            growthConnectionEffectiveness: [
                { range: [0, 7], text: "Success to Lead & Success to Market - Current Status: CRITICAL\nWe rarely convert successful customers into advocates or referral sources. Customer feedback isn't systematically incorporated into product/service improvements. We don't effectively leverage success stories in marketing/sales. My immediate priorities are:\n\n1. Implement basic processes for requesting testimonials and referrals\n2. Create a simple system for collecting and reviewing product/service feedback\n3. Develop a basic approach for creating case studies from successful engagements\n4. Establish minimum communication between success, marketing, and sales teams\n\nKey improvement opportunities:\n- Create standardized templates for collecting testimonials\n- Implement a basic referral incentive program\n- Develop simple feedback review sessions for product/service improvement\n- Create a basic case study template and identification process" },
                { range: [8, 14], text: "Success to Lead & Success to Market - Current Status: BASIC\nWe occasionally develop customer advocates and referrals but lack systematic processes. Feedback collection exists but implementation is inconsistent. Success stories are used in marketing but not strategically. My priorities are:\n\n1. Formalize our advocacy development program with clear identification criteria\n2. Systematize our feedback collection and implementation process\n3. Create a strategic approach to case study development and deployment\n4. Improve integration between customer success, marketing, and sales teams\n\nKey improvement opportunities:\n- Implement a formal customer advocacy program with clear benefits\n- Create a structured feedback review process that influences roadmap decisions\n- Develop a content calendar for success stories across marketing channels\n- Establish regular cross-functional meetings between success and marketing teams" },
                { range: [15, 21], text: "Success to Lead & Market - Optimization Focus:\nOur advocacy and marketing integration processes work well but can be enhanced. Priorities:\n1. Develop tiered, personalized advocacy programs by customer segment\n2. Implement feedback-driven innovation sessions with cross-functional teams\n3. Measure ROI of success stories across marketing channels\n4. Create automated workflows between success and marketing teams" }
            ],
            measurementRetentionEffectiveness: [
                { range: [0, 4], text: "Customer Measurement & Retention - Current Status: CRITICAL\nWe lack systematic approaches to measuring customer success and managing retention/renewals. Our visibility into customer health is minimal, and our retention efforts are reactive. My immediate priorities are:\n\n1. Implement basic success metrics for all customers\n2. Create a simple system for tracking renewal/repurchase dates\n3. Develop an initial process for identifying at-risk customers\n4. Establish minimum standards for demonstrating ongoing value\n\nKey improvement opportunities:\n- Define essential success metrics relevant to our product/service\n- Create a basic customer health scorecard\n- Implement a simple renewal/repurchase tracking system\n- Develop standard check-in points before renewal periods" },
                { range: [5, 9], text: "Customer Measurement & Retention - Current Status: BASIC\nWe have basic approaches to measuring customer success and managing retention. Our renewal processes exist but lack optimization. At-risk customer identification is inconsistent. My priorities are:\n\n1. Formalize our success measurement framework with consistent metrics\n2. Systematize our renewal/repurchase process with clear ownership\n3. Develop a more robust approach to identifying and addressing at-risk customers\n4. Create structured value reinforcement touchpoints throughout the customer lifecycle\n\nKey improvement opportunities:\n- Implement consistent success metrics aligned with customer goals\n- Create a formal renewal/repurchase playbook with standard timelines\n- Develop early warning indicators for customer churn risk\n- Establish regular business review sessions with key customers" },
                { range: [10, 14], text: "Customer Measurement & Retention - Optimization Focus:\nOur measurement and retention systems are functional but can be enhanced. Priorities:\n1. Implement segmented success dashboards with predictive metrics\n2. Create renewal forecasting based on usage patterns and engagement data\n3. Develop proactive intervention playbooks for various risk scenarios\n4. Build ROI calculators that demonstrate concrete value delivered" }
            ],
            ownerIndependence: [
                { range: [0, 17], text: "Owner Dependency in Delivery & Success - Current Status: HIGHLY DEPENDENT\nThe owner is deeply involved in day-to-day delivery, customer success management, and issue resolution. This creates bottlenecks and limits scalability. My priorities for reducing owner dependency are:\n\n1. Document the owner's key activities and decision points in all customer-facing processes\n2. Identify which activities truly require owner involvement versus those that can be delegated\n3. Develop clear decision-making frameworks to enable team members to handle routine situations\n4. Create training materials capturing the owner's expertise and approach\n\nKey improvement opportunities:\n- Create standard operating procedures for all routine delivery and success processes\n- Implement delegation tiers with escalation criteria for different scenarios\n- Develop training programs to transfer knowledge from owner to team members\n- Establish regular case reviews to build team capability without owner involvement" },
                { range: [18, 26], text: "Owner Dependency - Optimization Focus:\nSome delegation exists but can be expanded. Priorities:\n1. Implement decision frameworks that reduce owner consultation needs\n2. Expand team authority with clearer decision rights\n3. Create scenario-based training programs for independent team action\n4. Develop decision logs to systematically expand delegation boundaries" }
            ]
        };
        // ---------------------------------------------------------------------------------

        const findTemplate = (score, templateArray) => {
            const found = templateArray.find(t => score >= t.range[0] && score <= t.range[1]);
            return found ? found.text : "";
        };
        
        output += findTemplate(s2d_resultsEffectivenessScore, promptTemplates.customerExperienceQuality) + "\n\n";
        const combinedGrowthScore = s2d_referralsGenerationScore + s2d_resaleOptimizationScore;
        output += findTemplate(combinedGrowthScore, promptTemplates.growthConnectionEffectiveness) + "\n\n";
        output += findTemplate(s2d_retentionEffectivenessScore, promptTemplates.measurementRetentionEffectiveness) + "\n\n";
        output += findTemplate(s2d_ownerIndependenceScore, promptTemplates.ownerIndependence) + "\n\n";
        
        output = output.replace(/\n\n\n+/g, '\n\n').trim();
        return output;
    }, []);



    const handleGenerateStepPrompt = useCallback((sectionNameForPrompt) => {
        console.log(`[MultiStepForm] Generating prompt for section: ${sectionNameForPrompt}`);
        let promptText = ""; 
        const S2D_SECTION_NAME = allAppSections[1];

       if (sectionNameForPrompt === S2D_SECTION_NAME) {
        // Para la función que obtiene las definiciones de preguntas, necesitas el NOMBRE de la sección
        const s2dQuestionDefinitions = getSaleToDeliveryProcessQuestions(S2D_SECTION_NAME); // Correcto: pasar el nombre
        
        const s2dDataForPrompt = calculateS2DSectionData(); 
        // La función generateS2DPromptTextInternal ya no debería necesitar s2dSectionName directamente si 
        // s2dQuestionDefinitions se le pasa.
        promptText = generateS2DPromptTextInternal(formData, s2dDataForPrompt, s2dQuestionDefinitions);
    } else { 
            promptText = `## Prompt for Section: ${sectionNameForPrompt} ##\n\n`;
            const questionsForThisSection = getQuestionsForStep(currentStep);
            promptText += `Your current answers for this section:\n`;
            questionsForThisSection.forEach(q => {
                const answer = formData[q.valueKey];
                let displayAnswer = '(Not answered)';
                if (answer !== undefined && answer !== '' && answer !== null) {
                    if (q.type === 'mcq' && q.options) {
                        const selectedOpt = q.options.find(opt => opt.value === answer || opt.text === answer);
                        displayAnswer = selectedOpt ? `"${selectedOpt.text}"` : `"${String(answer)}"`;
                    } else { displayAnswer = String(answer); }
                }
                promptText += `- ${q.text}: ${displayAnswer}\n`;
            });
            promptText += "\n--- AI Suggestions & Considerations ---\n";

        if (sectionNameForPrompt === allAppSections[2]) {
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
        
        } else if (sectionNameForPrompt === allAppSections[3]) {
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

            promptText += "Review your answers above. What are the key strengths and weaknesses highlighted for this section? Identify one action item to build on a strength or address a weakness.\n";
        }
    }

    downloadAsTxtFile(promptText, `${sectionNameForPrompt.replace(/[\s\/&]+/g, '_')}_Prompt.txt`);

  }, [
        formData, currentStep, allAppSections, 
        calculateS2DSectionData, getSaleToDeliveryProcessQuestions, 
        getQuestionsForStep 
        // generateS2DPromptTextInternal no es necesaria como dependencia si está definida arriba y usa solo args
    ]);

    


    const handleSubmit = useCallback(async () => {
    console.log("[MultiStepForm] handleSubmit triggered. isSubmitting:", isSubmitting);
    if (isSubmitting) {
        console.log("[MultiStepForm] Submission already in progress, returning.");
        return;
    }

    setIsSubmitting(true);
    setSubmissionBackendResultMsg(null);
    setErrors({});
    let calculatedResultsForThisSubmission = {};

    try {
        console.log("[MultiStepForm] Validating form data...");
        if (!formData.userEmail || formData.currentRevenue == null || !formData.naicsSector || !formData.naicsSubSector) {
             throw new Error("Please complete all required profile, financial and industry fields.");
        }
        console.log("[MultiStepForm] Basic validations passed.");

        const adjEbitda = (formData.ebitda || 0) + (formData.ebitdaAdjustments || 0);
        const valuationParams = getValuationParameters(adjEbitda, formData.naicsSector, formData.naicsSubSector);
        const originalScores = calculateScores(formData);
        const maxPossibleOriginal = calculateMaxPossibleScore();
        const originalScorePercentage = maxPossibleOriginal > 0 ? (Object.values(originalScores).reduce((a, b) => a + b, 0) / maxPossibleOriginal) : 0;
        const clampedOriginalScorePercentage = Math.max(0, Math.min(1, originalScorePercentage));
        const finalMultiple = valuationParams.baseMultiple + (valuationParams.maxMultiple - valuationParams.baseMultiple) * clampedOriginalScorePercentage;
        const estimatedValuation = adjEbitda >= 0 ? Math.round(adjEbitda * finalMultiple) : 0;
        const roadmapData = generateImprovementRoadmap(originalScores, valuationParams.stage, formData);

        // Asumimos que ya hemos consolidado la lógica y solo necesitamos calculateS2DSectionData
        // para la sección S2D actualizada (antes llamada D2S por error)
        const s2dData = calculateS2DSectionData(); 
        // const d2sData = calculateD2SSectionData(); // ELIMINAR SI YA NO EXISTE D2S COMO SECCIÓN SEPARADA

        calculatedResultsForThisSubmission = {
            stage: valuationParams.stage, adjEbitda, baseMultiple: valuationParams.baseMultiple, 
            maxMultiple: valuationParams.maxMultiple, finalMultiple, estimatedValuation,
            scores: originalScores, scorePercentage: clampedOriginalScorePercentage, roadmap: roadmapData,
            ...s2dData, 
            // ...d2sData // ELIMINAR SI d2sData ya no se usa o se fusionó en s2dData
        };
            
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
}, [
    formData, // Necesario porque accedes a formData.userEmail, etc.
    isSubmitting, // Necesario para la guarda inicial
    calculateS2DSectionData, // Necesario porque lo llamas
    // calculateD2SSectionData, // QUITAR SI YA NO SE USA
    // Las siguientes son usadas indirectamente o directamente:
    getValuationParameters,
    calculateScores,
    calculateMaxPossibleScore,
    generateImprovementRoadmap,
    getFunctionsBaseUrl,
    // NO incluyas 'handleSubmit' aquí
    // NO incluyas 'setCalculationResult', 'setSubmissionSuccess', 'setSubmissionBackendResultMsg', 'setErrors', 'setIsSubmitting' 
    // (las funciones setState de useState son estables y no necesitan ser dependencias)
]);

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
        const S2D_SECTION_NAME = "Sale to Delivery Process Assessment";
        const D2S_SECTION_NAME = "Delivery to Success Assessment";
        
        const currentSectionTitle = allAppSections[currentStep];
        const isLastQuestionStep = currentStep === TOTAL_STEPS_QUESTIONS - 1;

        const shouldShowSectionResultsPage = 
            currentStep >= 1 &&
            currentStep < TOTAL_STEPS_QUESTIONS - 1; 

       if (shouldShowSectionResultsPage) {
            let resultsForSectionPage;
            if (currentSectionTitle === S2D_SECTION_NAME) {
                console.log(`[MultiStepForm] Completed S2D section. Calculating results...`);
                resultsForSectionPage = calculateS2DSectionData();
            } else if (currentSectionTitle === D2S_SECTION_NAME) {
                console.log(`[MultiStepForm] Completed D2S section. Calculating results...`);
                resultsForSectionPage = calculateD2SSectionData();
            } else { // Para OTRAS secciones (Expansion, Marketing, etc.)
    const sectionTitle = allAppSections[currentStep]; // Usar currentStep
    console.log(`[MultiStepForm] Completed section: ${sectionTitle}. Calculating results...`);

    const generalScores = calculateScores(formData);
    const questionsForCurrentSection = getQuestionsForStep(currentStep); // Usar currentStep
    
    let sectionScore = 0;
    let maxSectionScore = 0;
    // Inicializar interpretation con un valor por defecto seguro
    let interpretation = "Interpretation data not available for this section."; 
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
            if (percentage >= 80) {
                interpretation = "Strong performance in this area.";
            } else if (percentage >= 50) {
                interpretation = "Good performance, with some room for improvement.";
            } else { // Asegurar que siempre se asigne
                interpretation = "This area may need more focus for development.";
            }
        } else {
            interpretation = "Scoring not applicable or max score is zero for this area.";
        }
    } else { // Si no hay primaryScoringAreaName
        interpretation = "No scoring data available for this section.";
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
        isD2S: false, // Asumimos que D2S tiene su propia bandera o no entra en este 'else'
        sectionTitle: sectionTitle,
        score: sectionScore,
        maxScore: maxSectionScore,
        interpretation: interpretation, // Ahora 'interpretation' siempre debería ser un string
        questions: questionsAndAnswers
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
    currentStep, TOTAL_STEPS_QUESTIONS, currentQuestions, formData, 
    handleSubmit, // Esta dependencia es correcta
    errors, allAppSections, 
    calculateS2DSectionData, 
    // calculateD2SSectionData, // QUITAR SI YA NO SE USA
    calculateScores, ScoringAreas, calculateMaxScoreForArea, getQuestionsForStep 
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
                sectionTitle={currentSectionName}
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