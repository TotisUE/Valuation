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
import Step from './Step';
import ProgressIndicator from './ProgressIndicator';
import Navigation from './Navigation';
import ResultsDisplay from './results/ResultsDisplay';
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


    const visibleSections = useMemo(() => allAppSections, [allAppSections]);
    const TOTAL_STEPS = visibleSections.length;

   const [currentStep, setCurrentStep] = useState(() => {
        if (initialFormDataProp) return 0;

        // Si ya hay un resultado exitoso guardado (leído en submissionSuccess y calculationResult),
        // la lógica de renderizado principal se encargará de mostrar ResultsDisplay.
        // El currentStep puede ser el último paso guardado o 0.
        const savedStep = localStorage.getItem(LOCAL_STORAGE_CURRENT_STEP_KEY); // Usa la constante correcta
        const initialStep = savedStep ? parseInt(savedStep, 10) : 0;
        const maxValidStep = TOTAL_STEPS > 0 ? TOTAL_STEPS - 1 : 0;
        
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
        if (TOTAL_STEPS > 0 && currentStep >= TOTAL_STEPS && !submissionSuccess) {
            setCurrentStep(TOTAL_STEPS - 1);
        } else if (TOTAL_STEPS === 0 && currentStep !== 0) {
            setCurrentStep(0);
        }
    }, [TOTAL_STEPS, currentStep, submissionSuccess]);

useEffect(() => {
        if (!submissionSuccess) { // Solo guardar si no se ha enviado exitosamente
            localStorage.setItem(LOCAL_STORAGE_FORM_DATA_KEY, JSON.stringify(formData));
        }
    }, [formData, submissionSuccess]);

   useEffect(() => {
        if (!submissionSuccess) { // Solo guardar si no se ha enviado exitosamente
            localStorage.setItem(LOCAL_STORAGE_CURRENT_STEP_KEY, currentStep.toString());
        }
        window.scrollTo(0, 0); // El scroll puede quedar fuera de la condición
    }, [currentStep, submissionSuccess]);

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
       allFormData, // El primer argumento es el objeto formData completo
        currentS2DScores,
        s2dQuestionDefinitions
    ) => {
        if (!allFormData || !currentS2DScores || !s2dQuestionDefinitions || s2dQuestionDefinitions.length === 0) {
            console.error("generateS2DPromptTextInternal: Missing critical data for S2D prompt.");
            return "Error: Could not generate S2D prompt due to missing data or question definitions.";
        }

        let output = "##Sale to Delivery Current Company Scoring##\n\n";

        // ======================= INICIO: BLOQUE AÑADIDO PARA SCORES S2D =======================
        // Asumimos 8 preguntas principales para S2D para los máximos
        const maxProcessMaturityScore = 8 * 7; // 56
        const maxOwnerIndependenceScore = 8 * 5; // 40

        output += `**Process Maturity Score:** ${currentS2DScores.processMaturityScore !== undefined ? currentS2DScores.processMaturityScore : 'N/A'} / ${maxProcessMaturityScore} points\n`;
        if (currentS2DScores.processMaturityScore !== undefined && maxProcessMaturityScore > 0) {
            const percentage = (currentS2DScores.processMaturityScore / maxProcessMaturityScore) * 100;
            if (percentage >= 85) output += "Interpretation: Excellent - Your Sale to Delivery process is a competitive advantage.\n";
            else if (percentage >= 70) output += "Interpretation: Good - Your process works well but has some improvement opportunities.\n";
            else if (percentage >= 50) output += "Interpretation: Developing - Basic processes exist but significant improvements would drive better results.\n";
            else if (percentage >= 21) output += "Interpretation: Basic - Major improvements needed to create consistent, scalable delivery.\n";
            else output += "Interpretation: Critical - Immediate attention required to establish fundamental processes.\n";
        }
        output += "\n";

        output += `**Owner Independence Score:** ${currentS2DScores.ownerIndependenceScore !== undefined ? currentS2DScores.ownerIndependenceScore : 'N/A'} / ${maxOwnerIndependenceScore} points\n`;
        if (currentS2DScores.ownerIndependenceScore !== undefined && maxOwnerIndependenceScore > 0) {
            const percentage = (currentS2DScores.ownerIndependenceScore / maxOwnerIndependenceScore) * 100;
            if (percentage >= 80) output += "Interpretation: Excellent - Processes run independently with minimal owner involvement.\n";
            else if (percentage >= 60) output += "Interpretation: Good - Owner is appropriately positioned in oversight rather than execution.\n";
            else if (percentage >= 40) output += "Interpretation: Developing - Some delegation exists, but owner remains too involved in execution.\n";
            else if (percentage >= 20) output += "Interpretation: Concerning - Owner is a critical bottleneck in multiple processes.\n";
            else output += "Interpretation: Critical - Business is entirely dependent on owner involvement.\n";
        }
        output += "\n";
        // ======================= FIN: BLOQUE AÑADIDO PARA SCORES S2D =======================


        output += "**Owner Strategic Positioning**\n";
        const areasForDelegation = [];
        const areasForActiveManagement = [];

        for (let i = 1; i <= 8; i++) {
            const processValueKey = `s2d_q${i}_process`;
            const ownerValueKey = `s2d_q${i}_owner`;

            // --- CAMBIO AQUÍ: Usar allFormData ---
            const processAnswer = allFormData[processValueKey]; 
            const ownerAnswer = allFormData[ownerValueKey];   
            // --- FIN CAMBIO ---

            const processQDef = s2dQuestionDefinitions.find(q => q.valueKey === processValueKey);
            const ownerQDef = s2dQuestionDefinitions.find(q => q.valueKey === ownerValueKey);

            if (processQDef && ownerQDef && processAnswer && ownerAnswer && processQDef.options && ownerQDef.options) {
                const processOpt = processQDef.options.find(o => o.value === processAnswer);
                const ownerOpt = ownerQDef.options.find(o => o.value === ownerAnswer);

                if (processOpt && ownerOpt && typeof processOpt.score === 'number' && typeof ownerOpt.score === 'number') {
                    const pScore = processOpt.score;
                    const oScore = ownerOpt.score;
                    // Extraer el título base de la pregunta (ej: "1. Contract and Payment Processing")
                    const qTitle = processQDef.text.substring(0, processQDef.text.indexOf(':')).replace(/^\d+\.\s*/, '').trim() || `Area ${i}`;


                    if ((pScore === 7 || pScore === 5) && (oScore === 0 || oScore === 1)) {
                        areasForDelegation.push(qTitle);
                    }
                    // Condición: Proceso bajo (0-3) y Owner NO involucrado (score 5 = "Not at all / Informed")
                    if (pScore <= 3 && oScore === 5) {
                        areasForActiveManagement.push(qTitle);
                    }
                }
            }
        }
        output += "Areas for strategic oversight (delegation opportunities): " + (areasForDelegation.length > 0 ? areasForDelegation.join(', ') : "None identified") + ".\nUser wants to begin delegating these areas to other members of the team.\n\n";
        output += "Areas for active management: " + (areasForActiveManagement.length > 0 ? areasForActiveManagement.join(', ') : "None identified") + ".\nUser wants to become actively involved in these areas to bring up competency. AI should share information whenever possible on best practices, templates, etc.\n\n";

        // **ACCIÓN PARA TI: ASEGÚRATE QUE ESTOS TEXTOS SEAN EXACTAMENTE LOS DEL DOCUMENTO DE HAYDEN**
        const promptSectionTemplates = {
            s2d_q1_process: { title: "Contract and Payment Processing", text: "Contract and Payment Processing: Current contract and payment processes need standardization and automation. The business currently uses [%RESPONSE%]. AI should actively suggest improvements to contract workflows, including standardized templates, digital signature implementation, and automated follow-up sequences. When discussing new client engagements, proactively recommend contract tracking systems, payment reminder templates, documentation of payment terms, and refund language. Prioritize solutions that reduce manual handling while ensuring consistency and compliance." },
            s2d_q2_process: { title: "Internal Handoff from Sales to Delivery Team", text: "Internal Handoff Process: The current sales-to-delivery handoff process requires improvement. The business currently experiences [%RESPONSE%]. AI should suggest structured handoff protocols including standardized information checklists, handoff meeting templates, and responsibility assignment matrices. When discussing client onboarding or project initiation, proactively recommend implementing a formal handoff document that captures all essential client details, project parameters, and commitments made during sales. Prioritize creating clear accountability for information completeness and accuracy during transitions between teams." },
            s2d_q3_process: { title: "Client Onboarding Process", text: "Client Onboarding Process: The client onboarding experience needs strengthening and systematization. The business currently uses [%RESPONSE%]. AI should recommend comprehensive onboarding frameworks including welcome sequence templates, client information collection forms, and expectation-setting documents. When discussing new clients or delivery processes, suggest implementing structured milestone-based onboarding with clear touchpoints, resource provision schedules, and feedback collection. Prioritize creating a consistent, replicable onboarding experience that builds client confidence while efficiently gathering all information needed for successful delivery." },
            s2d_q4_process: { title: "Asset and Information Collection", text: "Asset and Information Collection: The process for gathering client information and assets needs improvement. The business currently relies on [%RESPONSE%]. AI should suggest structured information collection systems including standardized intake forms, asset checklists, automated reminder sequences, and completion tracking. When discussing project initiation or client management, recommend implementing a central repository for client assets with clear categorization, version control, and accessibility protocols. Prioritize solutions that reduce the friction in collecting necessary information, minimize back-and-forth communications, and establish clear visibility into what's been received versus what's still pending." },
            s2d_q5_process: { title: "Expectations and Success Metrics Definition", text: "Expectations and Success Metrics Definition: The business needs a more structured approach to defining and documenting success metrics with clients. Currently, [%RESPONSE%]. AI should suggest frameworks for establishing clear, measurable success metrics including templates for different service/product types, collaborative goal-setting processes, and documentation formats that capture both qualitative and quantitative measures. When discussing client projects or deliverables, proactively recommend defining SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound) for each engagement. Prioritize creating alignment between client expectations and internal delivery parameters, ensuring all teams understand what constitutes success for each client." },
            s2d_q6_process: { title: "Scheduling and Resource Allocation", text: "Scheduling and Resource Allocation: The business lacks a sufficiently structured approach to scheduling work and allocating resources after sales. Currently, [%RESPONSE%]. AI should recommend resource planning frameworks including capacity management tools, visual scheduling systems, and forecasting templates that account for team bandwidth and project requirements. When discussing project planning or team management, suggest implementing formalized resource allocation processes with clear visibility into team availability, skill requirements, and project timelines. Prioritize solutions that prevent resource conflicts, provide early warning of potential capacity issues, and ensure appropriate expertise is assigned to each project phase." },
            s2d_q7_process: { title: "Client Communication Plan", text: "Client Communication Plan: The communication strategy during the transition from sale to delivery requires strengthening. Currently, [%RESPONSE%]. AI should suggest comprehensive communication planning frameworks including client communication calendars, touchpoint schedules, channel preference documentation, and escalation protocols. When discussing client relationships or project management, recommend establishing predefined communication cadences with clear frequency, channel guidelines, and responsibility assignments for each client type. Prioritize creating consistent, proactive communication processes that set appropriate expectations, reduce client anxiety, and maintain engagement throughout the delivery phase." },
            s2d_q8_process: { title: "Technology and Tools Integration", text: "Technology and Tools Integration: The current technology ecosystem supporting the sale-to-delivery transition requires enhancement. Currently, [%RESPONSE%]. AI should recommend technology integration approaches including system connection strategies, workflow automation tools, and data synchronization methods that reduce duplicate entry and information loss between stages. When discussing operational improvements or efficiency, suggest implementing integrated platforms or middleware solutions that create seamless information flow between sales and delivery systems. Prioritize solutions that eliminate manual workarounds, reduce error risk during handoffs, and provide complete visibility of client information throughout the customer journey." },
        };

        // Iterar para las secciones detalladas del prompt
        s2dQuestionDefinitions.forEach(qDef => {
            // Solo nos interesan las preguntas de proceso para esta parte detallada
            if (qDef.id.includes('_process') && promptSectionTemplates[qDef.valueKey]) {
                const answer = allFormData[qDef.valueKey];
                if (answer && qDef.options) {
                    const selectedOpt = qDef.options.find(o => o.value === answer);
                    if (selectedOpt && typeof selectedOpt.score === 'number' && selectedOpt.score < 5) {
                        const sectionInfo = promptSectionTemplates[qDef.valueKey];
                        output += `**${sectionInfo.title}**\n`;
                        output += sectionInfo.text.replace("[%RESPONSE%]", `"${selectedOpt.text}"`) + "\n\n"; // Añadir comillas a la respuesta
                    }
                }
            }
        });
        return output;
    }, []);

    const handleGenerateStepPrompt = useCallback((sectionNameForPrompt) => {
        console.log(`[MultiStepForm] Generating prompt for section: ${sectionNameForPrompt}`);
        
        const questionsForThisSection = getQuestionsForStep(currentStep); 
        const sectionAnswers = {};
        questionsForThisSection.forEach(q => {
            if (formData.hasOwnProperty(q.valueKey)) {
                sectionAnswers[q.valueKey] = formData[q.valueKey];
            }
        });

        let promptText = ""; 

        // --- LÓGICA ESPECÍFICA DEL PROMPT POR SECCIÓN ---

        if (sectionNameForPrompt === allAppSections[1]) { // "Sale to Delivery Process Assessment"
            // ... (tu lógica existente para S2D, que calcula scores y llama a generateS2DPromptTextInternal)
            // Esta parte estaba bien y la mantienes.
            let s2d_processMaturityScore = 0;
            let s2d_ownerIndependenceScore = 0;
            const s2dQuestionDefinitions = getSaleToDeliveryProcessQuestions(sectionNameForPrompt); 
            s2dQuestionDefinitions.forEach(q => {
                if (q.id.startsWith('s2d_q') && formData[q.valueKey] && q.options && q.type === 'mcq') {
                    const answerValue = formData[q.valueKey];
                    const opt = q.options.find(o => o.value === answerValue);
                    if (opt && typeof opt.score === 'number') {
                        if (q.id.includes('_process')) s2d_processMaturityScore += opt.score;
                        else if (q.id.includes('_owner')) s2d_ownerIndependenceScore += opt.score;
                    }
                }
            });
            console.log("[S2D Prompt] Calculated Process Maturity Score:", s2d_processMaturityScore);
console.log("[S2D Prompt] Calculated Owner Independence Score:", s2d_ownerIndependenceScore);
            const s2dScoresForThisPrompt = {
                processMaturityScore: s2d_processMaturityScore,
                ownerIndependenceScore: s2d_ownerIndependenceScore
            };
            promptText = generateS2DPromptTextInternal(formData, s2dScoresForThisPrompt, s2dQuestionDefinitions);

        } else { // --- INICIO DEL BLOQUE 'else' PARA TODAS LAS OTRAS SECCIONES ---
            promptText = `## Prompt & Results for Section: ${sectionNameForPrompt} ##\n\n`;
            promptText += `Your current answers for this section:\n`;
            questionsForThisSection.forEach(q => { /* ... tu lógica para mostrar respuestas ... */ 
                const answer = sectionAnswers[q.valueKey];
                let displayAnswer = (answer !== undefined && answer !== '' && answer !== null) ? answer : '(Not answered)';
                if (q.type === 'mcq' && answer && q.options) {
                    const valuePropertyToFind = q.options[0] && q.options[0].hasOwnProperty('value') ? 'value' : 'text';
                    const selectedOpt = q.options.find(opt => opt[valuePropertyToFind] === answer);
                    if (selectedOpt) {
                        displayAnswer = `"${selectedOpt.text}"`;
                    }
                }
                promptText += `- ${q.text}: ${displayAnswer}\n`;
            });
            promptText += "\n";

            const currentScoringAreaKey = Object.keys(ScoringAreas).find(
                key => ScoringAreas[key] === sectionNameForPrompt
            );

            let currentAreaScore = 0; 
            let maxAreaScore = 0;     

            if (currentScoringAreaKey) {
                const areaName = ScoringAreas[currentScoringAreaKey];
                questionsForThisSection.forEach(q => { /* ... tu lógica para calcular currentAreaScore y maxAreaScore ... */ 
                     if (q.scoringArea === areaName && q.type === 'mcq' && q.options) {
                        const answer = sectionAnswers[q.valueKey];
                        if (answer) {
                            const valueProp = q.options[0] && q.options[0].hasOwnProperty('value') ? 'value' : 'text';
                            const selectedOpt = q.options.find(opt => opt[valueProp] === answer);
                            if (selectedOpt && typeof selectedOpt.score === 'number') {
                                currentAreaScore += selectedOpt.score;
                            }
                        }
                        const maxOptionScore = Math.max(0, ...q.options.map(opt => opt.score || 0));
                        maxAreaScore += maxOptionScore;
                    }
                });
                promptText += `**Section Score (${areaName}):** ${currentAreaScore} / ${maxAreaScore} points\n`;
                if (maxAreaScore > 0) { /* ... tu lógica de interpretación de score ... */ 
                    const percentage = (currentAreaScore / maxAreaScore) * 100;
                    if (percentage >= 80) promptText += "Interpretation: Strong performance in this area.\n";
                    else if (percentage >= 50) promptText += "Interpretation: Good performance, with some room for improvement.\n";
                    else promptText += "Interpretation: This area may need more focus for development.\n";
                }
                promptText += "\n";
            }
            
            promptText += "--- AI Suggestions & Considerations ---\n";

              if (sectionNameForPrompt === allAppSections[1]) { 
            let s2d_processMaturityScore = 0;
            let s2d_ownerIndependenceScore = 0;

            const s2dQuestionDefinitions = getSaleToDeliveryProcessQuestions(sectionNameForPrompt); 
            s2dQuestionDefinitions.forEach(q => {

          if (q.id.startsWith('s2d_q') && formData[q.valueKey] && q.options && q.type === 'mcq') {
                    const answerValue = formData[q.valueKey]; // Respuesta del usuario (ej. "a")
                    const opt = q.options.find(o => o.value === answerValue); // S2D usa option.value
                    if (opt && typeof opt.score === 'number') {
                        if (q.id.includes('_process')) {
                            s2d_processMaturityScore += opt.score;
                        } else if (q.id.includes('_owner')) {
                            s2d_ownerIndependenceScore += opt.score;
                        }
                    }
                }
            });
            
            const s2dScoresForThisPrompt = {
                processMaturityScore: s2d_processMaturityScore,
                ownerIndependenceScore: s2d_ownerIndependenceScore
            };
            promptText = generateS2DPromptTextInternal(formData, s2dScoresForThisPrompt, s2dQuestionDefinitions);

        } else if (sectionNameForPrompt === allAppSections[2]) { // "Expansion Capability"
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
                promptText += "- Uncertainty or low Gross Profit Margins suggest a need for analysis. Calculate your GPM for your top product/service. How does it compare to your best guess symptômes? What are the key drivers of COGS?\n";
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
        
        }
        // Las secciones "Your Profile" (allAppSections[0]) y "Your Financials & Industry" (allAppSections[9])
        // están excluidas por la lógica en Navigation.jsx, así que no necesitamos un 'else if' para ellas aquí.
    else { 
            promptText += "Review your answers above. What are the key strengths and weaknesses highlighted? Identify one action item to build on a strength or address a weakness.\n";
        }
    }

        downloadAsTxtFile(promptText, `${sectionNameForPrompt.replace(/[\s\/]+/g, '_')}_Prompt.txt`);

    }, [formData, currentStep, allAppSections, generateS2DPromptTextInternal, getSaleToDeliveryProcessQuestions, getQuestionsForStep, ScoringAreas]); // Añadido ScoringAreas

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

            let s2d_processMaturityScore = 0;
            let s2d_ownerIndependenceScore = 0;
            let s2d_clientExperienceOptimizationScore = 0;
            let s2d_resourceAllocationEffectivenessScore = 0;
            
            // Obtener las definiciones de las preguntas S2D
            const s2dQuestionDefinitions = getSaleToDeliveryProcessQuestions(allAppSections[1]); 
            
            const clientExperienceValueKeys = ["s2d_q3_process", "s2d_q2_process", "s2d_q5_process"];
            const resourceAllocationValueKeys = ["s2d_q6_process", "s2d_q4_process", "s2d_q7_process"];
            
            // Declarar s2d_detailedAnswers AQUÍ para que esté en el ámbito correcto
            const s2d_detailedAnswers = { 
                clientExperience: {}, 
                resourceAllocation: {} 
            };

            s2dQuestionDefinitions.forEach(q => {
                const answerValue = formData[q.valueKey]; // Las respuestas S2D están en el formData principal
                if (answerValue && q.options && q.type === 'mcq') {
                    const selectedOption = q.options.find(opt => opt.value === answerValue);
                    if (selectedOption && typeof selectedOption.score === 'number') {
                        let qKeyForDetailed = ""; // Para usar como clave en s2d_detailedAnswers (ej. "q1", "q2")
                        const idParts = q.id.split('_');
                        if (idParts.length >= 2) {
                            qKeyForDetailed = idParts[1];
                        }

                        if (q.id.includes('_process')) {
                            s2d_processMaturityScore += selectedOption.score;

                            if (clientExperienceValueKeys.includes(q.valueKey) && qKeyForDetailed) {
                                s2d_clientExperienceOptimizationScore += selectedOption.score;
                                // --- LLENAR s2d_detailedAnswers ---
                                s2d_detailedAnswers.clientExperience[qKeyForDetailed] = { 
                                    questionText: q.text, 
                                    answerText: selectedOption.text, 
                                    score: selectedOption.score 
                                };
                            }
                            if (resourceAllocationValueKeys.includes(q.valueKey) && qKeyForDetailed) {
                                s2d_resourceAllocationEffectivenessScore += selectedOption.score;
                                // --- LLENAR s2d_detailedAnswers ---
                                s2d_detailedAnswers.resourceAllocation[qKeyForDetailed] = { 
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
              calculatedResultsForThisSubmission = {
                stage: valuationParams.stage, adjEbitda, baseMultiple: valuationParams.baseMultiple, 
                maxMultiple: valuationParams.maxMultiple, finalMultiple, estimatedValuation,
                scores: originalScores, scorePercentage: clampedOriginalScorePercentage, roadmap: roadmapData,
                s2d_productName: formData.s2d_productName,
                s2d_productDescription: formData.s2d_productDescription,
                s2d_productRevenue: formData.s2d_productRevenue,
                s2d_processMaturityScore,
                s2d_ownerIndependenceScore,
                s2d_clientExperienceOptimizationScore,
                s2d_resourceAllocationEffectivenessScore,
                s2d_detailedAnswers // Ahora este objeto está correctamente poblado
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
    }, [formData, calculateScores, generateImprovementRoadmap, allAppSections, initialScores, ScoringAreas, isSubmitting]); // Añadido isSubmitting

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
    }, [allAppSections]); // buildInitialFormData puede depender de allAppSections si está fuera

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
    }, [formData]); // formData es la dependencia principal aquí

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
    
    // Si hubo un error del backend al intentar el submit final
    if (submissionBackendResultMsg && !submissionBackendResultMsg.success) {
         return ( <div className="submission-result error"><h2>Submission Error</h2><p>{submissionBackendResultMsg.message}</p><div style={{textAlign: 'center', marginTop: '20px'}}><button type="button" onClick={() => setSubmissionBackendResultMsg(null)}>Back to Form</button></div></div> );
    }

    return (
        <div className="multi-step-form">
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