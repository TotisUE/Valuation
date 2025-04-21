// src/questions.js [VERSIÓN DE PRUEBA SIMPLIFICADA]
// import { ScoringAreas } from './scoringAreas'; // <<< COMENTADO TEMPORALMENTE
import { getIndustryAdjustmentFactor } from './naicsData';

// --- Define Section Titles (Se mantiene exportado) ---
export const sections = [
    "Your Profile", "Expansion Capability", "Marketing & Brand Equity",
    "Profitability Metrics", "Offering Excellence", "Workforce & Leadership",
    "Execution Systems", "Robust Market Position", "Your Financials & Industry"
];

// --- getQuestionsDataArray (Dependencias internas eliminadas temporalmente) ---
const getQuestionsDataArray = () => {
    // No verificar sections/ScoringAreas aquí por ahora
    const theQuestionsArray = [
        // === Section 0: Your Profile ===
        // Usar strings literales en lugar de sections[0]
        { id: "profile1", section: "Your Profile", text: "What is your primary role in the business?", type: "mcq", valueKey: "ownerRole", options: [/*...*/], required: true },
        { id: "profile2", section: "Your Profile", text: "How long have you been involved with this business?", type: "mcq", valueKey: "yearsInvolved", options: [/*...*/], required: true },
        { id: "profile3", section: "Your Profile", text: "Enter your email address...", type: "email", valueKey: "userEmail", placeholder: "...", required: true },

        // === Section 1: Expansion Capability ===
        // Usar strings literales en lugar de sections[1] y ScoringAreas.EXPANSION
        { id: "exp1", section: "Expansion Capability", scoringArea: "Expansion Capability", text: "...", type: "mcq", valueKey: "expansionVolumePrep", options: [/*...*/], required: true },
        { id: "exp2", section: "Expansion Capability", scoringArea: "Expansion Capability", text: "...", type: "mcq", valueKey: "expansionPlaybook", options: [/*...*/], required: true, helpText: "..." },
        { id: "exp3", section: "Expansion Capability", scoringArea: "Expansion Capability", text: "...", type: "mcq", valueKey: "expansionNewServices", options: [/*...*/], required: true, helpText: "..." },
        { id: "exp5", section: "Expansion Capability", scoringArea: "Expansion Capability", text: "...", type: "mcq", valueKey: "expansionProblemRate", options: [/*...*/], required: true, helpText: "..." },

        // === Section 2: Marketing & Brand Equity ===
        // Usar strings literales en lugar de sections[2] y ScoringAreas.MARKETING
        { id: "mkt1", section: "Marketing & Brand Equity", scoringArea: "Marketing & Brand Equity", text: "...", type: "mcq", valueKey: "marketingBrandRec", options: [/*...*/], required: true },
        { id: "mkt2", section: "Marketing & Brand Equity", scoringArea: "Marketing & Brand Equity", text: "...", type: "mcq", valueKey: "marketingDigitalPresence", options: [/*...*/], required: true },
        { id: "mkt3", section: "Marketing & Brand Equity", scoringArea: "Marketing & Brand Equity", text: "...", type: "mcq", valueKey: "marketingLeadGen", options: [/*...*/], required: true, helpText: "..." },
        { id: "mkt4", section: "Marketing & Brand Equity", scoringArea: "Marketing & Brand Equity", text: "...", type: "mcq", valueKey: "marketingComms", options: [/*...*/], required: true, helpText: "..." },
        { id: "mkt5", section: "Marketing & Brand Equity", scoringArea: "Marketing & Brand Equity", text: "...", type: "mcq", valueKey: "marketingICPFocus", options: [/*...*/], required: true, helpText: "..." },

        // === CONTINUAR ESTE PATRÓN PARA TODAS LAS SECCIONES Y PREGUNTAS CUALITATIVAS ===
        // Reemplaza sections[N] y ScoringAreas.XXX con sus valores de string correspondientes

        // === Section 8: Your Financials & Industry === (Ejemplo final)
        { id: "finRev", section: "Your Financials & Industry", text: "...", type: "number", valueKey: "currentRevenue", placeholder: "...", required: true, helpText: "..." },
        { id: "finGP", section: "Your Financials & Industry", text: "...", type: "number", valueKey: "grossProfit", placeholder: "...", required: true, helpText: "..." },
        { id: "finEBITDA", section: "Your Financials & Industry", text: "...", type: "number", valueKey: "ebitda", placeholder: "...", required: true, helpText: "..." },
        { id: "finAdj", section: "Your Financials & Industry", text: "...", type: "number", valueKey: "ebitdaAdjustments", placeholder: "...", required: false, helpText: "..." },
        { id: "industrySector", section: "Your Financials & Industry", text: "Select your primary Industry Sector:", type: "select", valueKey: "naicsSector", required: true },
        { id: "industrySubSector", section: "Your Financials & Industry", text: "Select your specific Industry Sub-Sector:", type: "select_dependent", dependsOn: "naicsSector", valueKey: "naicsSubSector", required: true },
    ];
    return theQuestionsArray;
};

// --- Helper Functions and Derived Data ---

// isQualitativeQuestion (MODIFICADO TEMPORALMENTE para usar strings)
// ¡¡ESTO ROMPERÁ LOS CÁLCULOS DE SCORE, ES SOLO PARA VER SI EL MÓDULO CARGA!!
const isQualitativeQuestion = (q) => {
    // Comprobar simplemente si tiene la propiedad scoringArea (que ahora es un string)
    return q && q.scoringArea;
};

// --- getQuestionsForStep (Usa la nueva getQuestionsDataArray) ---
export const getQuestionsForStep = (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= sections.length) { return []; }
    const sectionName = sections[stepIndex]; // Usar sections está bien aquí
    const allQuestions = getQuestionsDataArray();
    return allQuestions.filter(q => q.section === sectionName); // Comparar con el string de sección
};

// --- Funciones de cálculo (SE MANTIENEN, pero usarán la versión simplificada de isQualitativeQuestion) ---
// Es probable que NO calculen correctamente el score con este cambio, pero queremos ver si el *error de inicialización* desaparece.
export const calculateMaxPossibleScore = () => {
    const allQuestions = getQuestionsDataArray();
    const qualitativeQuestionsNow = allQuestions.filter(isQualitativeQuestion); // Usa la versión simplificada
    let totalMaxScore = 0;
    qualitativeQuestionsNow.forEach(q => { /* ... */ });
    return totalMaxScore;
};
export const calculateMaxScoreForArea = (areaName) => {
    if (!areaName) return 0;
    const allQuestions = getQuestionsDataArray();
    const qualitativeQuestionsNow = allQuestions.filter(isQualitativeQuestion); // Usa la versión simplificada
    if (!qualitativeQuestionsNow) { return 0; }
    // El filtro .filter(q => q.scoringArea === areaName) comparará ahora strings
    return qualitativeQuestionsNow.filter(q => q.scoringArea === areaName).reduce((total, q) => { /* ... */ }, 0);
};

// --- Estructuras y funciones restantes (SIN CAMBIOS) ---
export const ebitdaTiers = [ /* ... */ ];
export const getValuationParameters = (adjEbitda, sectorName, subSectorName) => { /* ... */ };