// src/questions.js
import { ScoringAreas } from './scoringAreas';
import { getIndustryAdjustmentFactor } from './naicsData'; // Correcto: Solo importar lo necesario

// --- Define Section Titles (Sin cambios) ---
export const sections = [
    "Your Profile", "Expansion Capability", "Marketing & Brand Equity",
    "Profitability Metrics", "Offering Excellence", "Workforce & Leadership",
    "Execution Systems", "Robust Market Position", "Your Financials & Industry"
];

// --- Define the Main Array of All Questions (Sin cambios en el contenido del array) ---
export const questionsData = [
    // ... (Todo tu array questionsData existente SIN NINGÚN CAMBIO INTERNO) ...
    // Ejemplo:
    { id: "profile1", section: sections[0], text: "...", type: "mcq", valueKey: "ownerRole", options: [/*...*/], required: true },
    // ... todas las demás preguntas ...
    { id: "finRev", section: sections[8], text: "...", type: "number", valueKey: "currentRevenue", placeholder: "...", required: true, helpText: "..." },
    { id: "finGP", section: sections[8], text: "...", type: "number", valueKey: "grossProfit", placeholder: "...", required: true, helpText: "..." },
    { id: "finEBITDA", section: sections[8], text: "...", type: "number", valueKey: "ebitda", placeholder: "...", required: true, helpText: "..." },
    { id: "finAdj", section: sections[8], text: "...", type: "number", valueKey: "ebitdaAdjustments", placeholder: "...", required: false, helpText: "..." },
    { id: "industrySector", section: sections[8], text: "Select your primary Industry Sector:", type: "select", valueKey: "naicsSector", required: true }, // Sin options
    { id: "industrySubSector", section: sections[8], text: "Select your specific Industry Sub-Sector:", type: "select_dependent", dependsOn: "naicsSector", valueKey: "naicsSubSector", required: true }, // Sin optionsGetter
];

// --- Helper Functions and Derived Data ---

// --- isQualitativeQuestion (SIN CAMBIOS) ---
// Función helper interna, no necesita exportarse si solo se usa aquí.
const isQualitativeQuestion = (q) => {
    // Asegurarse que ScoringAreas esté disponible
    return q && q.scoringArea && typeof ScoringAreas === 'object' && Object.values(ScoringAreas).includes(q.scoringArea);
};

// --- ELIMINADA LA EXPORTACIÓN DIRECTA de qualitativeQuestions ---
// export const qualitativeQuestions = questionsData.filter(isQualitativeQuestion); // <-- ELIMINADA

// --- getQuestionsForStep (SIN CAMBIOS) ---
export const getQuestionsForStep = (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= sections.length) {
        console.error(`Invalid stepIndex requested: ${stepIndex}`);
        return [];
    }
    const sectionName = sections[stepIndex];
    // Asegurarse que questionsData esté disponible
    return Array.isArray(questionsData) ? questionsData.filter(q => q.section === sectionName) : [];
};

// --- calculateMaxPossibleScore (MODIFICADO: Filtra internamente) ---
export const calculateMaxPossibleScore = () => {
    // Filtra las preguntas cualitativas aquí dentro
    const qualitativeQuestionsNow = Array.isArray(questionsData) ? questionsData.filter(isQualitativeQuestion) : [];
    let totalMaxScore = 0;
    qualitativeQuestionsNow.forEach(q => {
        if (q.type === 'mcq' && q.options && q.options.length > 0) {
            const maxOptionScore = Math.max(0, ...q.options.map(opt => opt.score || 0));
            totalMaxScore += maxOptionScore;
        }
    });
    // console.log("Calculated Total Max Possible Score:", totalMaxScore); // Descomentar si es necesario
    return totalMaxScore;
};

// --- calculateMaxScoreForArea (MODIFICADO: Filtra internamente) ---
export const calculateMaxScoreForArea = (areaName) => {
    if (!areaName) return 0;
    // Filtra las preguntas cualitativas aquí dentro
    const qualitativeQuestionsNow = Array.isArray(questionsData) ? questionsData.filter(isQualitativeQuestion) : [];

    if (!qualitativeQuestionsNow) {
        console.error("Could not filter qualitative questions in calculateMaxScoreForArea");
        return 0;
    }

    return qualitativeQuestionsNow
        .filter(q => q.scoringArea === areaName)
        .reduce((total, q) => {
            if (q.type === 'mcq' && q.options && q.options.length > 0) {
                const maxOptionScore = Math.max(0, ...q.options.map(opt => opt.score || 0));
                return total + maxOptionScore;
            }
            return total;
        }, 0);
};

// --- Estructura ebitdaTiers (SIN CAMBIOS) ---
export const ebitdaTiers = [
    { threshold: 5000000, stage: "Mature Scaleup", baseMultiple: 5, maxMultiple: 7 },
    { threshold: 3000000, stage: "Scale Up", baseMultiple: 4, maxMultiple: 6 },
    { threshold: 2000000, stage: "Mature Grow-up", baseMultiple: 3.5, maxMultiple: 5 },
    { threshold: 1500000, stage: "Grow-up", baseMultiple: 3, maxMultiple: 4.5 },
    { threshold: 1000000, stage: "Mature Start-up", baseMultiple: 2.5, maxMultiple: 3.5 },
    { threshold: 0, stage: "Startup", baseMultiple: 2, maxMultiple: 3 }
];

// --- getValuationParameters (SIN CAMBIOS) ---
export const getValuationParameters = (adjEbitda, sectorName, subSectorName) => {
    // ... (Tu código existente, sigue usando getIndustryAdjustmentFactor) ...
    const validAdjEbitda = typeof adjEbitda === 'number' && !isNaN(adjEbitda) ? adjEbitda : -1;
    const tier = ebitdaTiers.find(t => validAdjEbitda >= t.threshold);

    if (!tier) {
        return { stage: "Pre-Revenue / Negative EBITDA", baseMultiple: 0, maxMultiple: 0, industryAdjustment: 1 };
    }
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