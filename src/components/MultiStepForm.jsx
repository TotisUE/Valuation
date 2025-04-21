// src/components/MultiStepForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ScoringAreas, initialScores } from '../scoringAreas';
import {
    sections, getQuestionsForStep, calculateMaxPossibleScore,
    getValuationParameters, qualitativeQuestions,
    calculateMaxScoreForArea
// --- ¡QUITAR getSubSectors de aquí si aún estaba! ---
// Ya no se usa getSubSectors de naicsData.js
} from '../questions';
import Step from './Step';
import ProgressIndicator from './ProgressIndicator';
import Navigation from './Navigation';
import ResultsDisplay from './results/ResultsDisplay';

// --- Constantes ---
const TOTAL_STEPS = sections.length;
const LOCAL_STORAGE_KEY = 'valuationFormData';
const LOCAL_STORAGE_STEP_KEY = 'valuationFormStep';

// --- Helper: calculateScores (Sin cambios) ---
function calculateScores(formData) {
    // ... (Tu código existente)
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
                scores[area] += selectedOption.score;
            } else if (selectedOption) {
                console.warn(`Score value missing/invalid for Question ID: ${question.id}, Answer: "${answer}"`);
            }
        }
    });
    // console.log("Calculated Scores (inside calculateScores):", scores); // Puedes mantenerlo para debug
    return scores;
}

// --- Helper: generateImprovementRoadmap (Sin cambios) ---
function generateImprovementRoadmap(scores, stage) {
    // ... (Tu código existente)
    console.log("Generating roadmap for stage:", stage, "with scores:", scores);
    const roadmapItems = [];
    const numberOfAreasToShow = 3;
    const stageToUrlMap = { /* ... */ };
    const fallbackUrl = 'https://www.acquisition.com/training/stabilize';
    const targetUrl = stageToUrlMap[stage] || fallbackUrl;
    const roadmapContent = { /* ... */ };

    if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0) { return []; }
    const sortedScores = Object.entries(scores) /* ... */ .sort(([, scoreA], [, scoreB]) => (scoreA || 0) - (scoreB || 0));
    const areasToImprove = sortedScores.slice(0, numberOfAreasToShow);

    areasToImprove.forEach(([areaKey, areaScore]) => {
        const content = roadmapContent[areaKey];
        if (content) {
            /* ... push a roadmapItems ... */
        }
    });
    // console.log("Generated roadmap items:", roadmapItems); // Puedes mantenerlo para debug
    return roadmapItems;
}

// --- Componente Principal ---
// --- MODIFICACIÓN: Aceptar props iniciales (para Magic Link futuro) ---
// Aunque no las usemos *ahora* para NAICS, las dejamos preparadas.
function MultiStepForm({ initialFormData, initialSubmissionId }) {

    // --- Estados Existentes ---
    const [currentStep, setCurrentStep] = useState(() => {
        // --- MODIFICACIÓN (Menor): Usar initialFormData si existe para resetear el paso a 0 ---
        if (initialFormData) {
            console.log("MultiStepForm: Received initial data, starting step at 0.");
            return 0;
        }
        const savedStep = localStorage.getItem(LOCAL_STORAGE_STEP_KEY);
        const initialStep = savedStep ? parseInt(savedStep, 10) : 0;
        return !isNaN(initialStep) && initialStep >= 0 && initialStep < TOTAL_STEPS ? initialStep : 0;
    });

    const [formData, setFormData] = useState(() => {
        // --- MODIFICACIÓN: Usar initialFormData si existe ---
        if (initialFormData && typeof initialFormData === 'object') {
            console.log("MultiStepForm: Initializing form with RECOVERED data via props:", initialFormData);
            const defaultStructure = { currentRevenue: null, grossProfit: null, ebitda: null, ebitdaAdjustments: 0, userEmail: '', naicsSector: '', naicsSubSector: '' };
            return { ...defaultStructure, ...initialFormData };
        }
        // Lógica de localStorage existente si no hay initialFormData
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        let baseData = {};
        if (savedData) { /* ... tu try/catch existente ... */ }
        const defaultStructure = { currentRevenue: null, grossProfit: null, ebitda: null, ebitdaAdjustments: 0, userEmail: '', naicsSector: '', naicsSubSector: '' };
        return { ...defaultStructure, ...baseData };
    });

    const [submissionId, setSubmissionId] = useState(initialSubmissionId || null); // Para Magic Link futuro

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const [errors, setErrors] = useState({});

    // --- PASO 4.3: AÑADIR NUEVOS ESTADOS PARA DATOS NAICS ---
    const [sectors, setSectors] = useState([]); // Lista de sectores principales {id, name, subSectorFile}
    const [subSectors, setSubSectors] = useState([]); // Lista de subsectores para el sector seleccionado (array de strings)
    const [isSubSectorsLoading, setIsSubSectorsLoading] = useState(false); // Indicador de carga para subsectores


    // --- Effects ---
    // useEffects para localStorage (Sin cambios)
    useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData)); }, [formData]);
    useEffect(() => {
        // --- MODIFICACIÓN (Menor): No guardar si estamos inicializando desde props ---
        // Esto evita que el paso 0 se guarde inmediatamente si se recuperan datos
        if (!initialFormData) {
            if(currentStep >= 0 && currentStep < TOTAL_STEPS) {
               localStorage.setItem(LOCAL_STORAGE_STEP_KEY, currentStep.toString());
            }
        }
     }, [currentStep, initialFormData]); // Añadir initialFormData como dependencia


    // --- PASO 4.4: AÑADIR USEEFFECT PARA CARGAR SECTORES ---
    useEffect(() => {
        const fetchSectors = async () => {
            try {
                console.log("Fetching main sectors list from /naics-data/sectors.json");
                const response = await fetch('/naics-data/sectors.json'); // Ruta relativa a /public
                if (!response.ok) {
                    throw new Error(`Failed to fetch sectors: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                if (Array.isArray(data)) {
                    console.log("Sectors fetched successfully:", data.length, "sectors");
                    setSectors(data);
                } else {
                    console.error("Fetched sectors data is not an array:", data);
                    setSectors([]);
                }
            } catch (error) {
                console.error("Error fetching main sectors:", error);
                setSectors([]);
            }
        };
        fetchSectors();
    }, []); // [] -> Ejecutar solo una vez al montar


    // --- PASO 4.5: AÑADIR USEEFFECT PARA CARGAR SUBSECTORES ---
    useEffect(() => {
        const loadSubSectors = async (selectedSectorName) => {
            if (!selectedSectorName || sectors.length === 0) {
                setSubSectors([]);
                return;
            }
            const selectedSector = sectors.find(s => s.name === selectedSectorName);
            if (!selectedSector || !selectedSector.subSectorFile) {
                console.warn(`Configuration error: No subSectorFile found for sector: "${selectedSectorName}"`);
                setSubSectors([]);
                setIsSubSectorsLoading(false);
                return;
            }

            setIsSubSectorsLoading(true);
            setSubSectors([]); // Limpiar mientras carga
            const subSectorFilePath = `/naics-data/${selectedSector.subSectorFile}`;
            console.log(`Fetching sub-sectors from: ${subSectorFilePath}`);

            try {
                const response = await fetch(subSectorFilePath);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${subSectorFilePath}: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                if (Array.isArray(data)) {
                    console.log(`Sub-sectors for "${selectedSectorName}" fetched:`, data.length);
                    setSubSectors(data);
                } else {
                     console.error(`Fetched sub-sectors data (${selectedSector.subSectorFile}) is not an array:`, data);
                     setSubSectors([]);
                }
            } catch (error) {
                console.error(`Error fetching sub-sectors from ${subSectorFilePath}:`, error);
                setSubSectors([]);
            } finally {
                setIsSubSectorsLoading(false);
            }
        };

        loadSubSectors(formData.naicsSector);

    }, [formData.naicsSector, sectors]); // Dependencias correctas


    // --- Handlers ---

    // --- PASO 4.6: MODIFICAR HANDLER 'handleChange' ---
    const handleChange = useCallback((event) => {
        const { name, value, type } = event.target;
        let resetData = {};

        // --- Lógica Añadida para resetear subsector ---
        if (name === 'naicsSector') {
            console.log(`Sector changed to: ${value}. Resetting sub-sector field and clearing options.`);
            resetData.naicsSubSector = ''; // Resetear el *valor* seleccionado en formData
            setSubSectors([]);           // Limpiar la *lista de opciones* en el estado
            // Opcionalmente, indicar carga si la carga de subsectores no fuera instantánea
            // setIsSubSectorsLoading(true);
        }
        // --- Fin Lógica Añadida ---

        setFormData(prevData => ({
            ...prevData,
            ...resetData, // Aplicar el reseteo
            [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value
        }));

        // Limpiar errores (sin cambios)
        if (errors[name]) {
            setErrors(prevErrors => { const newErrors = { ...prevErrors }; delete newErrors[name]; return newErrors; });
        }
    }, [errors]); // Dependencia 'errors' está bien si solo afecta a la lógica de errores.


    // --- handleSubmit (MODIFICADO para Magic Link futuro, si aplicaste el paso anterior) ---
    const handleSubmit = useCallback(async () => {
        // ... (Tu código existente de validación y cálculo local) ...
        try {
             // ... Validaciones ...
             // ... Cálculos locales ...
             localCalcResult = { /* ... */ };

             // --- Preparar Payload (Incluye ID para Magic Link futuro) ---
             const payloadToSend = {
                 formData: formData,
                 results: { /* ... resultados ... */ },
                 isCompletion: true, // Indicar finalización
                 existingSubmissionId: submissionId // Pasar ID (será null si no se recuperó)
             };

             console.log("Payload to send (FINAL SUBMISSION):", payloadToSend);
             // --- IMPORTANTE: Asegúrate de usar la URL correcta (relativa o absoluta con VITE_) ---
             const functionsBaseUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE_URL || '';
             const functionUrl = `${functionsBaseUrl}/.netlify/functions/submit-valuation`;

             console.log(`Sending final data to: ${functionUrl}`);
             const response = await fetch(functionUrl, { /* ... POST ... */ });
             // ... (Manejo de respuesta y errores) ...
             const result = await response.json();
             if (!response.ok) { /* ... throw error ... */ }

             // ... (Actualizar estado local, limpiar localStorage y submissionId) ...
              setCalculationResult(localCalcResult);
              setSubmissionResult({ success: true, message: result.message || "Submission processed!" });
              localStorage.removeItem(LOCAL_STORAGE_KEY);
              localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
              setSubmissionId(null); // Limpiar ID local


        } catch (error) {
             // ... (Tu manejo de errores) ...
             console.error("handleSubmit Error:", error);
             setSubmissionResult({ success: false, message: `Error: ${error.message}` });
             setCalculationResult(null);
        } finally {
            setIsSubmitting(false);
        }
         // --- ELIMINAR la llamada fetch duplicada que tenías aquí ---

    }, [formData, submissionId]); // Añadir submissionId a las dependencias


    // --- Otros Handlers (handleNext, handlePrevious, etc. sin cambios necesarios aquí) ---
    const handleNext = useCallback(() => {
         // ... Tu lógica de validación ...
         if (isValid) {
             if (currentStep < TOTAL_STEPS - 1) { /* ... Siguiente paso ... */ }
             else { handleSubmit(); } // Llama al handleSubmit modificado
         }
    }, [currentStep, formData, handleSubmit]);

    const handlePrevious = useCallback(() => { /* ... */ }, [currentStep]);

    const handleStartOver = useCallback(() => {
        // ... Limpiar localStorage ...
        setSubmissionId(null); // Asegurarse de limpiar ID
        setErrors({});
        window.location.reload(); // O reseteo manual de estados
    }, []);

    const handleBackToEdit = useCallback(() => { /* ... */ }, []);


    // --- Get Questions and Title (Sin cambios) ---
    const currentQuestions = getQuestionsForStep(currentStep);
    const currentSectionTitle = sections[currentStep];


    // --- Conditional Rendering Logic (Sin cambios) ---
    if (submissionResult && submissionResult.success && calculationResult) {
        /* ... Render ResultsDisplay ... */
         const userEmailFromFormData = formData?.userEmail;
         return ( <ResultsDisplay calculationResult={calculationResult} /* ... other props ... */ /> );
    } else if (submissionResult && !submissionResult.success) {
        /* ... Render Submission Error ... */
         return ( <div className="submission-result error"> /* ... */ </div>);
    }

    // --- Renderizado principal del formulario ---
    return (
        <div className="multi-step-form">
            <ProgressIndicator currentStep={currentStep + 1} totalSteps={TOTAL_STEPS} sections={sections} />
            <form onSubmit={(e) => e.preventDefault()}>
                {/* --- PASO 4.7: PASAR PROPS A STEP --- */}
                <Step
                    key={currentStep}
                    stepIndex={currentStep}
                    questions={currentQuestions}
                    formData={formData}
                    handleChange={handleChange}
                    sectionTitle={currentSectionTitle}
                    errors={errors}
                    // --- Props Añadidas para NAICS ---
                    dynamicOptions={{
                        sectors: sectors,       // Pasar la lista de sectores cargada
                        subSectors: subSectors  // Pasar la lista de subsectores (o vacía)
                    }}
                    isSubSectorsLoading={isSubSectorsLoading} // Pasar estado de carga
                    // --- Fin Props Añadidas ---
                />
                <Navigation
                    currentStep={currentStep}
                    totalSteps={TOTAL_STEPS}
                    onPrevious={handlePrevious}
                    onNext={handleNext} // Llama a handleNext (que valida y puede llamar a handleSubmit)
                    isSubmitting={isSubmitting} // Muestra estado en el botón final
                />
                {/* --- SECCIÓN OPCIONAL PARA MAGIC LINK (Si la añadiste antes, puede quedar) --- */}
                {/* <div style={{ marginTop: '20px', ... }}> ... Botón Send Link ... </div> */}
            </form>
        </div>
    );
}

export default MultiStepForm;