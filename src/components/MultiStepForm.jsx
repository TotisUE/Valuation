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

    const generateS2DPromptTextInternal = useCallback((s2dAnswers, s2dMainScores, s2dQuestionDefinitions) => {
        if (!s2dAnswers || !s2dMainScores || !s2dQuestionDefinitions || s2dQuestionDefinitions.length === 0) {
            console.error("generateS2DPromptTextInternal: Missing critical data for S2D prompt.");
            return "Error: Could not generate S2D prompt due to missing data or question definitions.";
        }

        let output = "##Sale to Delivery Current Company Scoring##\n\n";
        output += "**Owner Strategic Positioning**\n";
        const areasForDelegation = [];
        const areasForActiveManagement = [];

        // Iterar sobre las 8 preguntas principales S2D (q1 a q8)
        for (let i = 1; i <= 8; i++) {
            const processValueKey = `s2d_q${i}_process`;
            const ownerValueKey = `s2d_q${i}_owner`;

            const processAnswer = s2dAnswers[processValueKey]; // Respuesta del usuario para la pregunta de proceso
            const ownerAnswer = s2dAnswers[ownerValueKey];   // Respuesta del usuario para la pregunta de owner

            const processQDef = s2dQuestionDefinitions.find(q => q.valueKey === processValueKey);
            const ownerQDef = s2dQuestionDefinitions.find(q => q.valueKey === ownerValueKey);

            if (processQDef && ownerQDef && processAnswer && ownerAnswer && processQDef.options && ownerQDef.options) {
                const processOpt = processQDef.options.find(o => o.value === processAnswer);
                const ownerOpt = ownerQDef.options.find(o => o.value === ownerAnswer);

                if (processOpt && ownerOpt && typeof processOpt.score === 'number' && typeof ownerOpt.score === 'number') {
                    const pScore = processOpt.score;
                    const oScore = ownerOpt.score;
                    // Extraer el título base de la pregunta (ej: "1. Contract and Payment Processing")
                    const qTitle = processQDef.text.substring(0, processQDef.text.indexOf(':')) || `Area ${i}`;

                    if ((pScore === 7 || pScore === 5) && (oScore === 0 || oScore === 1)) {
                        areasForDelegation.push(qTitle.trim());
                    }
                    if ((pScore <= 3) && (oScore === 5)) { // Owner score 5 es "Not at all / Informed only"
                        areasForActiveManagement.push(qTitle.trim());
                    }
                }
            }
        }
        output += "Areas for strategic oversight (delegation opportunities): " + (areasForDelegation.length > 0 ? areasForDelegation.join(', ') : "None identified") + ".\nUser wants to begin delegating these areas to other members of the team.\n\n";
        output += "Areas for active management: " + (areasForActiveManagement.length > 0 ? areasForActiveManagement.join(', ') : "None identified") + ".\nUser wants to become actively involved in these areas to bring up competency.  AI should share information whenever possible on best practices, templates, etc.\n\n";

        // Plantillas para las secciones del prompt S2D
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

        Object.keys(promptSectionTemplates).forEach(valueKey => {
            const qDef = s2dQuestionDefinitions.find(q => q.valueKey === valueKey);
            const answer = s2dAnswers[valueKey]; // 's2dAnswers' es el subconjunto de formData para S2D
            if (qDef && answer && qDef.options) {
                const selectedOpt = qDef.options.find(o => o.value === answer);
                if (selectedOpt && typeof selectedOpt.score === 'number' && selectedOpt.score < 5) {
                    const sectionInfo = promptSectionTemplates[valueKey];
                    output += `**${sectionInfo.title}**\n`;
                    output += sectionInfo.text.replace("[%RESPONSE%]", selectedOpt.text) + "\n\n";
                }
            }
        });
        return output;
    }, []);

        const handleGenerateStepPrompt = useCallback((sectionNameForPrompt) => {
        console.log(`[MultiStepForm] Generating prompt for section: ${sectionNameForPrompt}`);
        
        const questionsForThisSection = getQuestionsForStep(currentStep); // currentStep es el índice de la sección actual
        const sectionAnswers = {};
        questionsForThisSection.forEach(q => {
            if (formData.hasOwnProperty(q.valueKey)) {
                sectionAnswers[q.valueKey] = formData[q.valueKey];
            }
        });

        let promptText = `## Prompt for Section: ${sectionNameForPrompt} ##\n\n`;
        promptText += `Based on your current answers for this section:\n`;
        questionsForThisSection.forEach(q => {
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
        promptText += "\n--- AI Suggestions & Considerations ---\n";

        // --- LÓGICA ESPECÍFICA DEL PROMPT POR SECCIÓN ---

        if (sectionNameForPrompt === allAppSections[1]) { // "Sale to Delivery Process Assessment"
            // Calcular scores S2D en el momento para este prompt
            let s2d_processMaturityScore = 0;
            let s2d_ownerIndependenceScore = 0;
            const s2dQuestionDefinitions = getSaleToDeliveryProcessQuestions(sectionNameForPrompt);
            
            s2dQuestionDefinitions.forEach(q => {
                if (q.id.startsWith('s2d_q') && q.id.includes('_process')) {
                    const answerValue = formData[q.valueKey];
                    if (answerValue && q.options) {
                        const opt = q.options.find(o => o.value === answerValue);
                        if (opt && typeof opt.score === 'number') s2d_processMaturityScore += opt.score;
                    }
                } else if (q.id.startsWith('s2d_q') && q.id.includes('_owner')) {
                    const answerValue = formData[q.valueKey];
                    if (answerValue && q.options) {
                        const opt = q.options.find(o => o.value === answerValue);
                        if (opt && typeof opt.score === 'number') s2d_ownerIndependenceScore += opt.score;
                    }
                }
            });
            
            const s2dScoresForThisPrompt = {
                processMaturityScore: s2d_processMaturityScore,
                ownerIndependenceScore: s2d_ownerIndependenceScore
            };
            // Asumimos que formData contiene todas las respuestas s2d_... necesarias para generateS2DPromptTextInternal
            promptText = generateS2DPromptTextInternal(formData, s2dScoresForThisPrompt, s2dQuestionDefinitions);

        } else if (sectionNameForPrompt === allAppSections[2]) { // "Expansion Capability" (Ahora Step 3)
            promptText += "To improve your Expansion Capability:\n";
            if (formData.expansionVolumePrep && String(formData.expansionVolumePrep).toLowerCase().includes("not prepared")) {
                promptText += "- Your systems may not be ready for 3x volume. Focus on documenting key processes and identifying bottlenecks to prepare for scaling.\n";
            }
            if (formData.expansionPlaybook && String(formData.expansionPlaybook).toLowerCase().includes("no specific plans")) {
                promptText += "- Consider developing at least a basic, informal playbook for new market entry. This can be iterated upon later.\n";
            }
            if (formData.expansionNewServices && String(formData.expansionNewServices).toLowerCase().includes("ad-hoc")) {
                promptText += "- Transitioning from ad-hoc to a semi-formal process for new service development, including market validation, can reduce risk and improve success rates.\n";
            }
            promptText += "- What is one small, repeatable process you could document this week to improve scalability?\n";
        
        } else if (sectionNameForPrompt === allAppSections[3]) { // "Marketing & Brand Equity" (Ahora Step 4)
            promptText += "To enhance Marketing & Brand Equity:\n";
            if (formData.marketingBrandRec && String(formData.marketingBrandRec).toLowerCase().includes("unknown")) {
                promptText += "- Your brand is largely unknown. Consider strategies like content marketing, local SEO, or targeted outreach to increase brand awareness.\n";
            }
            if (formData.marketingDigitalPresence && String(formData.marketingDigitalPresence).toLowerCase().includes("minimal")) {
                promptText += "- A basic online presence generates minimal leads. Invest in optimizing your website for conversions and explore one or two key digital marketing channels.\n";
            }
            if (formData.marketingLeadGen && (String(formData.marketingLeadGen).toLowerCase().includes("ad-hoc") || String(formData.marketingLeadGen).toLowerCase().includes("little measurement"))) {
                promptText += "- Your lead generation is ad-hoc. Start by identifying 1-2 consistent lead channels and implement basic tracking (e.g., 'How did you hear about us?') to measure effectiveness.\n";
            }
            promptText += "- What is one an ICP (Ideal Customer Profile) you are targetting? Who is it, and what channels will you use to reach them?\n";

        } else if (sectionNameForPrompt === allAppSections[4]) { // "Profitability Metrics" (Ahora Step 5)
            promptText += "To improve Profitability Metrics:\n";
            if (formData.profitTrend && String(formData.profitTrend).toLowerCase().includes("declining")) {
                promptText += "- Declining profitability is a critical issue. Conduct a thorough review of your costs, pricing, and revenue streams to identify causes and implement corrective actions immediately.\n";
            }
            if (formData.profitMargins && (String(formData.profitMargins).toLowerCase().includes("below average") || String(formData.profitMargins).toLowerCase().includes("unsure"))) {
                promptText += "- If your margins are below average or unknown, research industry benchmarks and analyze your Cost of Goods Sold (COGS) and pricing strategy. Are there inefficiencies to cut or opportunities to increase prices?\n";
            }
            if (formData.profitRecurringRev && (String(formData.profitRecurringRev).toLowerCase().includes("low (< 10%)") || String(formData.profitRecurringRev).toLowerCase().includes("none"))) {
                promptText += "- Low recurring revenue indicates a transactional business model. Explore opportunities to introduce subscription services, retainers, or long-term contracts to increase predictability.\n";
            }
            promptText += "- What is one specific action you can take to analyze or improve your Gross Profit Margins this month?\n";

        } else if (sectionNameForPrompt === allAppSections[5]) { // "Offering & Sales Effectiveness" (Ahora Step 6)
            promptText += "To enhance Offering & Sales Effectiveness:\n";
            if (formData.offeringSatisfaction && String(formData.offeringSatisfaction).toLowerCase().includes("no systematic measurement")) {
                promptText += "- Systematically measure customer satisfaction (e.g., NPS, CSAT). This feedback is vital for improving your offering and identifying at-risk customers.\n";
            }
            if (formData.salesProcessEffectiveness && (String(formData.salesProcessEffectiveness).toLowerCase().includes("ineffective") || String(formData.salesProcessEffectiveness).toLowerCase().includes("ad-hoc"))) {
                promptText += "- An ineffective sales process hinders growth. Start by documenting your current lead-to-close stages and identify the biggest bottleneck or area of inconsistency.\n";
            }
            promptText += "- What's the #1 reason you lose deals? What steps can you take to address this?\n";

        } else if (sectionNameForPrompt === allAppSections[6]) { // "Workforce & Leadership" (Ahora Step 7)
            promptText += "To develop Workforce & Leadership:\n";
            if (formData.workforceOwnerReliance && (String(formData.workforceOwnerReliance).toLowerCase().includes("heavily reliant") || String(formData.workforceOwnerReliance).toLowerCase().includes("completely reliant"))) {
                promptText += "- High owner reliance is a major risk. Identify one key operational task you currently handle and create a plan to delegate it to a team member with clear instructions and authority.\n";
            }
            if (formData.workforceAccountability && String(formData.workforceAccountability).toLowerCase().includes("low accountability")) {
                promptText += "- Low accountability hinders performance. For one key role, define 1-2 measurable Key Performance Indicators (KPIs) and schedule a brief, regular check-in to discuss them.\n";
            }
            promptText += "- What is one system or process you could implement to empower your team more effectively?\n";

        } else if (sectionNameForPrompt === allAppSections[7]) { // "Execution Systems" (Ahora Step 8)
            promptText += "To strengthen Execution Systems:\n";
            if (formData.systemsSOPs && (String(formData.systemsSOPs).toLowerCase().includes("minimally documented") || String(formData.systemsSOPs).toLowerCase().includes("few documented"))) {
                promptText += "- Lack of documented processes leads to inconsistency. Choose one core business process (e.g., client onboarding) and create a simple Standard Operating Procedure (SOP) for it.\n";
            }
            if (formData.systemsTech && (String(formData.systemsTech).toLowerCase().includes("ineffective") || String(formData.systemsTech).toLowerCase().includes("lacking key systems"))) {
                promptText += "- Heavy reliance on manual processes or lacking key systems is inefficient. Identify one area where a simple tech tool (e.g., a basic CRM, project management app) could provide significant improvement and research options.\n";
            }
            promptText += "- Which core process, if documented and systematized, would free up the most owner time or reduce the most errors?\n";

        } else if (sectionNameForPrompt === allAppSections[8]) { // "Robust Market Position" (Ahora Step 9)
            promptText += "To solidify your Robust Market Position:\n";
            if (formData.marketGrowthPotential && String(formData.marketGrowthPotential).toLowerCase().includes("declining market")) {
                promptText += "- Operating in a declining market is challenging. Explore diversification, niching down further into a growing sub-segment, or developing new offerings for adjacent markets.\n";
            }
            if (formData.marketCustConcentration && String(formData.marketCustConcentration).toLowerCase().includes("highly concentrated")) {
                promptText += "- High customer concentration is risky. Develop a plan to acquire 2-3 new ideal customers in the next quarter to diversify your revenue base.\n";
            }
            promptText += "- Who are your top 3 ideal customers and what steps can you take this month to attract more like them?\n";
        
        }
        // La sección "Your Financials & Industry" (allAppSections[9]) está excluida por la lógica de Navigation.jsx
        // La sección "Your Profile" (allAppSections[0]) también.
        else {
            promptText += "Consider the key challenges and opportunities revealed by your answers in this section. What is one concrete action you can take in the next 7 days to make an improvement?\n";
        }

        downloadAsTxtFile(promptText, `${sectionNameForPrompt.replace(/[\s\/]+/g, '_')}_Prompt.txt`);

    }, [formData, currentStep, allAppSections, generateS2DPromptTextInternal, getSaleToDeliveryProcessQuestions]); // Añadido getSaleToDeliveryProcessQuestions

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