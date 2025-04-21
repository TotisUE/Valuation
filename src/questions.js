// src/questions.js
import { ScoringAreas } from './scoringAreas';

// --- PASO 3.2: MODIFICAR IMPORTACIÓN ---
// Quitar naicsSectors y getSubSectors de la importación
import { getIndustryAdjustmentFactor } from './naicsData'; // Assuming naicsData.js is in the same src folder

// --- Define Section Titles (9 Steps Total) ---
export const sections = [
    "Your Profile",             // Step 1 (Index 0)
    "Expansion Capability",     // Step 2 (Index 1) - E
    "Marketing & Brand Equity", // Step 3 (Index 2) - M
    "Profitability Metrics",    // Step 4 (Index 3) - P (Qualitative)
    "Offering Excellence",      // Step 5 (Index 4) - O
    "Workforce & Leadership",   // Step 6 (Index 5) - W
    "Execution Systems",        // Step 7 (Index 6) - E (Execution)
    "Robust Market Position",   // Step 8 (Index 7) - R
    "Your Financials & Industry" // Step 9 (Index 8) - Inputs
];

// --- Define the Main Array of All Questions ---
// --- SCORES MODIFIED BASED ON ISSUE #24 WEIGHTING (Critical=7, High=5, Moderate=3) ---
export const questionsData = [

    // === Section 0: Your Profile === (Sin cambios)
    {
        id: "profile1", section: sections[0],
        text: "What is your primary role in the business?",
        type: "mcq", valueKey: "ownerRole",
        options: [ { text: "Owner/Founder", score: 0 }, { text: "CEO", score: 0 }, { text: "Managing Partner", score: 0 }, { text: "Investor", score: 0 }, { text: "Other", score: 0 } ],
        required: true
    },
    {
        id: "profile2", section: sections[0],
        text: "How long have you been involved with this business?",
        type: "mcq", valueKey: "yearsInvolved",
        options: [ { text: "Less than 1 year", score: 0 }, { text: "1-3 years", score: 0 }, { text: "4-7 years", score: 0 }, { text: "8-15 years", score: 0 }, { text: "Over 15 years", score: 0 } ],
        required: true
    },
    {
        id: "profile3", section: sections[0],
        text: "Enter your email address. This is crucial for saving your progress and receiving results.",
        type: "email", valueKey: "userEmail",
        placeholder: "your.email@example.com",
        required: true
    },

    // === Section 1: Expansion Capability === (Sin cambios)
    // ... (todas las preguntas de exp1 a exp5) ...
    { id: "exp1", section: sections[1], scoringArea: ScoringAreas.EXPANSION, text: "...", type: "mcq", valueKey: "expansionVolumePrep", options: [/*...*/], required: true },
    { id: "exp2", section: sections[1], scoringArea: ScoringAreas.EXPANSION, text: "...", type: "mcq", valueKey: "expansionPlaybook", options: [/*...*/], required: true, helpText: "..." },
    { id: "exp3", section: sections[1], scoringArea: ScoringAreas.EXPANSION, text: "...", type: "mcq", valueKey: "expansionNewServices", options: [/*...*/], required: true, helpText: "..." },
    { id: "exp5", section: sections[1], scoringArea: ScoringAreas.EXPANSION, text: "...", type: "mcq", valueKey: "expansionProblemRate", options: [/*...*/], required: true, helpText: "..." },


    // === Section 2: Marketing & Brand Equity === (Sin cambios)
    // ... (todas las preguntas de mkt1 a mkt5) ...
    { id: "mkt1", section: sections[2], scoringArea: ScoringAreas.MARKETING, text: "...", type: "mcq", valueKey: "marketingBrandRec", options: [/*...*/], required: true },
    { id: "mkt2", section: sections[2], scoringArea: ScoringAreas.MARKETING, text: "...", type: "mcq", valueKey: "marketingDigitalPresence", options: [/*...*/], required: true },
    { id: "mkt3", section: sections[2], scoringArea: ScoringAreas.MARKETING, text: "...", type: "mcq", valueKey: "marketingLeadGen", options: [/*...*/], required: true, helpText: "..." },
    { id: "mkt4", section: sections[2], scoringArea: ScoringAreas.MARKETING, text: "...", type: "mcq", valueKey: "marketingComms", options: [/*...*/], required: true, helpText: "..." },
    { id: "mkt5", section: sections[2], scoringArea: ScoringAreas.MARKETING, text: "...", type: "mcq", valueKey: "marketingICPFocus", options: [/*...*/], required: true, helpText: "..." },


    // === Section 3: Profitability Metrics === (Sin cambios)
    // ... (todas las preguntas de prof1 a prof5) ...
    { id: "prof1", section: sections[3], scoringArea: ScoringAreas.PROFITABILITY, text: "...", type: "mcq", valueKey: "profitTrend", options: [/*...*/], required: true, helpText: "..." },
    { id: "prof2", section: sections[3], scoringArea: ScoringAreas.PROFITABILITY, text: "...", type: "mcq", valueKey: "profitMargins", options: [/*...*/], required: true, helpText: "..." },
    { id: "prof3", section: sections[3], scoringArea: ScoringAreas.PROFITABILITY, text: "...", type: "mcq", valueKey: "profitRecurringRev", options: [/*...*/], required: true, helpText: "..." },
    { id: "prof4", section: sections[3], scoringArea: ScoringAreas.PROFITABILITY, text: "...", type: "mcq", valueKey: "profitFinancialMgmt", options: [/*...*/], required: true, helpText: "..." },
    { id: "prof5", section: sections[3], scoringArea: ScoringAreas.PROFITABILITY, text: "...", type: "mcq", valueKey: "profitCompensationLevel", options: [/*...*/], required: true, helpText: "..." },


    // === Section 4: Offering Excellence === (Sin cambios)
    // ... (todas las preguntas de off1 a off5) ...
    { id: "off1", section: sections[4], scoringArea: ScoringAreas.OFFERING, text: "...", type: "mcq", valueKey: "offeringSatisfaction", options: [/*...*/], required: true, helpText: "..." },
    { id: "off2", section: sections[4], scoringArea: ScoringAreas.OFFERING, text: "...", type: "mcq", valueKey: "offeringDifferentiation", options: [/*...*/], required: true, helpText: "..." },
    { id: "off3", section: sections[4], scoringArea: ScoringAreas.OFFERING, text: "...", type: "mcq", valueKey: "offeringQualitySystems", options: [/*...*/], required: true, helpText: "..." },
    { id: "off4", section: sections[4], scoringArea: ScoringAreas.OFFERING, text: "...", type: "mcq", valueKey: "offeringInnovation", options: [/*...*/], required: true },
    { id: "off5", section: sections[4], scoringArea: ScoringAreas.OFFERING, text: "...", type: "mcq", valueKey: "offeringFollowOnRevenue", options: [/*...*/], required: true, helpText: "..." },


    // === Section 5: Workforce & Leadership === (Sin cambios)
    // ... (todas las preguntas de work1 a work4) ...
    { id: "work1", section: sections[5], scoringArea: ScoringAreas.WORKFORCE, text: "...", type: "mcq", valueKey: "workforceOwnerReliance", options: [/*...*/], required: true, helpText: "..." },
    { id: "work2", section: sections[5], scoringArea: ScoringAreas.WORKFORCE, text: "...", type: "mcq", valueKey: "workforceAccountability", options: [/*...*/], required: true, helpText: "..." },
    { id: "work3", section: sections[5], scoringArea: ScoringAreas.WORKFORCE, text: "...", type: "mcq", valueKey: "workforceRetention", options: [/*...*/], required: true },
    { id: "work4", section: sections[5], scoringArea: ScoringAreas.WORKFORCE, text: "...", type: "mcq", valueKey: "workforceAlignment", options: [/*...*/], required: true },


    // === Section 6: Execution Systems === (Sin cambios)
    // ... (todas las preguntas de sys2 a sys4) ...
    { id: "sys2", section: sections[6], scoringArea: ScoringAreas.SYSTEMS, text: "...", type: "mcq", valueKey: "systemsTech", options: [/*...*/], required: true, helpText: "..." },
    { id: "sys3", section: sections[6], scoringArea: ScoringAreas.SYSTEMS, text: "...", type: "mcq", valueKey: "systemsKPIs", options: [/*...*/], required: true, helpText: "..." },
    { id: "sys4", section: sections[6], scoringArea: ScoringAreas.SYSTEMS, text: "...", type: "mcq", valueKey: "systemsFinancials", options: [/*...*/], required: true, helpText: "..." },


    // === Section 7: Robust Market Position === (Sin cambios)
    // ... (todas las preguntas de mktpos1 a mktpos4) ...
    { id: "mktpos1", section: sections[7], scoringArea: ScoringAreas.MARKET, text: "...", type: "mcq", valueKey: "marketGrowthPotential", options: [/*...*/], required: true },
    { id: "mktpos2", section: sections[7], scoringArea: ScoringAreas.MARKET, text: "...", type: "mcq", valueKey: "marketCustConcentration", options: [/*...*/], required: true, helpText: "..." },
    { id: "mktpos_tam_size", section: sections[7], scoringArea: ScoringAreas.MARKET, text: "...", type: "mcq", valueKey: "marketTamSize", options: [/*...*/], required: true, helpText: "..." },
    { id: "mktpos_market_share", section: sections[7], scoringArea: ScoringAreas.MARKET, text: "...", type: "mcq", valueKey: "marketShare", options: [/*...*/], required: true, helpText: "..." },
    { id: "mktpos4", section: sections[7], scoringArea: ScoringAreas.MARKET, text: "...", type: "mcq", valueKey: "marketResilience", options: [/*...*/], required: true },


    // === Section 8: Your Financials & Industry ===
    // --- Preguntas Financieras (Sin cambios) ---
    {
        id: "finRev", section: sections[8], text: "What is your approximate Last Full Year Revenue?",
        type: "number", valueKey: "currentRevenue", placeholder: "e.g., $ 1,500,000", required: true, helpText: "..."
    },
    {
        id: "finGP", section: sections[8], text: "What is your approximate Last Full Year Gross Profit?",
        type: "number", valueKey: "grossProfit", placeholder: "e.g., $ 900,000", required: true, helpText: "..."
    },
    {
        id: "finEBITDA", section: sections[8], text: "What is your approximate Last Full Year EBITDA?",
        type: "number", valueKey: "ebitda", placeholder: "e.g., $ 300,000", required: true, helpText: "..."
    },
    {
        id: "finAdj", section: sections[8], text: "What are your typical annual EBITDA Add-backs / Adjustments?",
        type: "number", valueKey: "ebitdaAdjustments", placeholder: "e.g., $ 50,000 (can be 0)", required: false, helpText: "..."
    },
    // --- PASO 3.3: MODIFICAR PREGUNTA 'industrySector' ---
    {
        id: "industrySector", section: sections[8], text: "Select your primary Industry Sector:",
        type: "select", // El tipo sigue siendo 'select'
        // --- ELIMINAR la línea 'options: naicsSectors.map...' ---
        valueKey: "naicsSector", required: true
    },
    // --- PASO 3.4: MODIFICAR PREGUNTA 'industrySubSector' ---
    {
        id: "industrySubSector", section: sections[8], text: "Select your specific Industry Sub-Sector:",
        type: "select_dependent", dependsOn: "naicsSector", // El tipo y la dependencia se mantienen
        // --- ELIMINAR la línea 'optionsGetter: (sectorName) => ...' ---
        valueKey: "naicsSubSector", required: true
    },

]; // --- End of questionsData array ---


// --- Helper Functions and Derived Data ---

// isQualitativeQuestion (Sin cambios)
const isQualitativeQuestion = (q) => {
    return q && q.scoringArea && Object.values(ScoringAreas).includes(q.scoringArea);
};

// qualitativeQuestions (Sin cambios)
export const qualitativeQuestions = questionsData.filter(isQualitativeQuestion);

// getQuestionsForStep (Sin cambios)
export const getQuestionsForStep = (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= sections.length) {
        console.error(`Invalid stepIndex requested: ${stepIndex}`);
        return [];
    }
    const sectionName = sections[stepIndex];
    return questionsData.filter(q => q.section === sectionName);
};

// calculateMaxPossibleScore (Sin cambios)
export const calculateMaxPossibleScore = () => {
    // ... (Tu código existente)
    let totalMaxScore = 0;
    qualitativeQuestions.forEach(q => { /* ... */ });
    return totalMaxScore;
};

// calculateMaxScoreForArea (Sin cambios)
export const calculateMaxScoreForArea = (areaName) => {
    // ... (Tu código existente)
    if (!areaName) return 0;
    // ...
    return qualitativeQuestions.filter(/* ... */).reduce(/* ... */);
};

// --- Estructura ebitdaTiers (Sin cambios) ---
export const ebitdaTiers = [
    // ... (Tu estructura existente)
];

// --- getValuationParameters (Sin cambios, sigue usando getIndustryAdjustmentFactor) ---
export const getValuationParameters = (adjEbitda, sectorName, subSectorName) => {
    const validAdjEbitda = typeof adjEbitda === 'number' && !isNaN(adjEbitda) ? adjEbitda : -1;
    const tier = ebitdaTiers.find(t => validAdjEbitda >= t.threshold);

    if (!tier) {
        return { stage: "Pre-Revenue / Negative EBITDA", baseMultiple: 0, maxMultiple: 0, industryAdjustment: 1 };
    }

    // Sigue llamando a getIndustryAdjustmentFactor, que ahora existe en naicsData.js y devuelve 1.0
    const industryAdjustment = getIndustryAdjustmentFactor(sectorName, subSectorName);
    const adjustedBaseMultiple = tier.baseMultiple * industryAdjustment;
    const adjustedMaxMultiple = tier.maxMultiple * industryAdjustment;

    return {
        stage: tier.stage,
        baseMultiple: adjustedBaseMultiple,
        maxMultiple: adjustedMaxMultiple,
        industryAdjustment: industryAdjustment
    };
};