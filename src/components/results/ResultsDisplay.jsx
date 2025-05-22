// src/components/results/ResultsDisplay.jsx
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toJpeg } from 'html-to-image';
import { useNavigate } from 'react-router-dom';

import ValuationSnapshot from './ValuationSnapshot';
import ScoreDetails from './ScoreDetails';
import RoadmapSection from './RoadmapSection';
import ResultsCTA from './ResultsCTA';
import DiscussTabContent from './DiscussTabContent';
import ValuationReportPDF from './ValuationReportPDF';
import ScoreRadarChart from './ScoreRadarChart';
import S2DResultsSection from './S2DResultsSection'; // Importar el nuevo componente

// Importar definiciones de preguntas S2D para el prompt
import { getSaleToDeliveryProcessQuestions } from '../../sections-data/saleToDeliveryQuestions';
// Importar 'sections' para obtener el nombre de la sección S2D
import { sections as allAppSections } from '../../questions';


const ALL_TABS_CONFIG = [
    { id: 'snapshot', label: 'Valuation Summary', componentBuilder: (props) => <ValuationSnapshot {...props} /> },
    { id: 'scores', label: 'Score Detail', componentBuilder: (props) => <ScoreDetails scores={props.scores} /> }, // scores son los 7 originales
    { id: 'roadmap', label: 'Roadmap', componentBuilder: (props) => <RoadmapSection roadmap={props.roadmap} stage={props.stage} /> },
    { id: 'discuss', label: 'Discuss Your Results', componentBuilder: (props) => <DiscussTabContent calendlyLink={props.consultantCalendlyLink} userEmail={props.userEmail} /> },
];

const downloadAsTxt = (text, filename) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
};

const generateFullPromptText = (s2dAnswersFromFormData, s2dScores, s2dQuestionDefinitions) => {
    if (!s2dAnswersFromFormData || !s2dScores || !s2dQuestionDefinitions || s2dQuestionDefinitions.length === 0) {
        console.error("Generate Prompt: Missing critical data.", {s2dAnswersFromFormData, s2dScores, s2dQuestionDefinitions});
        return "Error: Could not generate prompt due to missing S2D assessment data or question definitions.";
    }

    let output = "##Sale to Delivery Current Company Scoring##\n\n";
    output += "**Owner Strategic Positioning**\n";
    const areasForDelegation = [];
    const areasForActiveManagement = [];

    // Asumimos que s2dQuestionDefinitions es el array de las 19 preguntas S2D
    // y las preguntas principales de proceso/owner están agrupadas de q1 a q8
    for (let i = 1; i <= 8; i++) {
        const processValueKey = `s2d_q${i}_process`;
        const ownerValueKey = `s2d_q${i}_owner`;

        const processAnswer = s2dAnswersFromFormData[processValueKey];
        const ownerAnswer = s2dAnswersFromFormData[ownerValueKey];

        const processQDef = s2dQuestionDefinitions.find(q => q.valueKey === processValueKey);
        const ownerQDef = s2dQuestionDefinitions.find(q => q.valueKey === ownerValueKey);

        if (processQDef && ownerQDef && processAnswer && ownerAnswer && processQDef.options && ownerQDef.options) {
            const processOpt = processQDef.options.find(o => o.value === processAnswer);
            const ownerOpt = ownerQDef.options.find(o => o.value === ownerAnswer);

            if (processOpt && ownerOpt && typeof processOpt.score === 'number' && typeof ownerOpt.score === 'number') {
                const pScore = processOpt.score;
                const oScore = ownerOpt.score;
                const qTitle = processQDef.text.substring(0, processQDef.text.indexOf(':')) || `Area ${i}`;

                if ((pScore === 7 || pScore === 5) && (oScore === 0 || oScore === 1)) {
                    areasForDelegation.push(qTitle.trim());
                }
                // La condición original era ownerScore 5-7, pero owner scores son 0,1,3,5. Asumo 5 es el "alto" aquí.
                if ((pScore <= 3) && (oScore === 5)) { 
                    areasForActiveManagement.push(qTitle.trim());
                }
            }
        }
    }
    output += "Areas for strategic oversight (delegation opportunities): " + (areasForDelegation.length > 0 ? areasForDelegation.join(', ') : "None identified") + ".\nUser wants to begin delegating these areas to other members of the team.\n\n";
    output += "Areas for active management: " + (areasForActiveManagement.length > 0 ? areasForActiveManagement.join(', ') : "None identified") + ".\nUser wants to become actively involved in these areas to bring up competency.  AI should share information whenever possible on best practices, templates, etc.\n\n";

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
        const answer = s2dAnswersFromFormData[valueKey];
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
};

function ResultsDisplay({
    calculationResult,
    onStartOver,
    onBackToEdit,
    consultantCalendlyLink,
    userEmail,
    formData // formData general del MultiStepForm (contiene respuestas s2d_)
}) {
    const navigate = useNavigate();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const hiddenChartRef = useRef(null);

    if (!calculationResult) {
        return <div className="submission-result" style={{padding: "20px", textAlign: "center"}}>Loading results...</div>;
    }

    const {
        stage = 'N/A', adjEbitda = 0, baseMultiple = 0, maxMultiple = 0,
        finalMultiple = 0, estimatedValuation = 0,
        scores = {}, // Scores originales de las 7 áreas
        roadmap = [], scorePercentage = 0,
        // Campos S2D directamente del calculationResult
        s2d_productName, s2d_productDescription, s2d_productRevenue,
        s2d_processMaturityScore, s2d_ownerIndependenceScore,
        s2d_clientExperienceOptimizationScore, s2d_resourceAllocationEffectivenessScore,
        s2d_detailedAnswers
    } = calculationResult; // No necesita || {} si ya se verifica !calculationResult arriba

    const visibleTabs = useMemo(() => ALL_TABS_CONFIG, []);
    const [activeTab, setActiveTab] = useState(() => visibleTabs.length > 0 ? visibleTabs[0].id : '');
    
    useEffect(() => {
        if (visibleTabs.length > 0 && !visibleTabs.find(tab => tab.id === activeTab)) {
            setActiveTab(visibleTabs[0].id);
        } else if (visibleTabs.length === 0 && activeTab !== '') {
            setActiveTab(''); 
        }
    }, [visibleTabs, activeTab]);

    const handleDownloadPdfWithChart = async () => { /* ...tu función sin cambios... */ };
    
    const handleGeneratePrompt = () => {
        // Las respuestas S2D están en el 'formData' general que se pasó como prop.
        // Los scores S2D están directamente en 'calculationResult'.
        const s2dAnswersFromMainForm = {};
        const s2dQuestionDefinitions = getSaleToDeliveryProcessQuestions(allAppSections[1]); // Nombre de sección es para q.section

        s2dQuestionDefinitions.forEach(qDef => {
            if (formData.hasOwnProperty(qDef.valueKey)) {
                s2dAnswersFromMainForm[qDef.valueKey] = formData[qDef.valueKey];
            }
        });

        const s2dScoresForPrompt = {
            processMaturityScore: s2d_processMaturityScore,
            ownerIndependenceScore: s2d_ownerIndependenceScore
        };

        // Verificar que los datos necesarios existen
        if (Object.keys(s2dAnswersFromMainForm).length < 3 || // Al menos las 3 preguntas de definición de P/S
            s2d_processMaturityScore === undefined || s2d_ownerIndependenceScore === undefined) {
            alert("Sale to Delivery assessment data seems incomplete. Cannot generate prompt.");
            return;
        }
        
        const promptText = generateFullPromptText(s2dAnswersFromMainForm, s2dScoresForPrompt, s2dQuestionDefinitions);
        downloadAsTxt(promptText, `S2D_Prompt_${s2d_productName || 'Report'}.txt`);
    };

    const renderTabContent = () => {
        const currentTabConfig = visibleTabs.find(tab => tab.id === activeTab);
        if (!currentTabConfig) return <div>Please select a tab.</div>;
        const tabComponentProps = {
            stage, adjEbitda, baseMultiple, maxMultiple, finalMultiple, estimatedValuation,
            scorePercentage, scores, roadmap, consultantCalendlyLink, userEmail, formData
        };
        return currentTabConfig.componentBuilder(tabComponentProps);
    };

    const s2dResultsForDisplay = {
        s2d_productName, s2d_productDescription, s2d_productRevenue,
        s2d_processMaturityScore, s2d_ownerIndependenceScore,
        s2d_clientExperienceOptimizationScore, s2d_resourceAllocationEffectivenessScore,
        s2d_detailedAnswers
    };

    return (
        <div className="submission-result results-display" style={{padding: '10px'}}>
            <div className="results-tabs-nav" style={styles.tabNav}>
                {visibleTabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            style={activeTab === tab.id ? styles.tabButtonActive : styles.tabButton}>
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="results-tab-content" style={styles.tabContent}>
                {renderTabContent()}
            </div>

            {/* Mostrar Resultados S2D si hay un nombre de producto S2D */}
            {s2d_productName && s2d_productName !== "N/A" && (
                <S2DResultsSection s2dResults={s2dResultsForDisplay} />
            )}

            <div ref={hiddenChartRef} style={styles.hiddenChart}>
                {scores && Object.keys(scores).length > 0 ? <ScoreRadarChart scores={scores} /> : <div />}
            </div>
            <p style={styles.disclaimer}>
                Disclaimer: This is a preliminary, automated estimate for informational purposes only...
            </p>
            <div className="results-actions-footer" style={styles.actionsFooter}>
                <ResultsCTA onDownloadClick={handleDownloadPdfWithChart} isLoading={isGeneratingPdf} />
                <button type="button" onClick={handleGeneratePrompt} style={styles.actionButton} className="generate-prompt-button">
                    GENERATE PROMPT
                </button>
                <button type="button" onClick={() => navigate('/add-product-service')} style={styles.actionButton} className="create-additional-product-button">
                    ASSESS ANOTHER PRODUCT/SERVICE
                </button>
                <button type="button" onClick={onStartOver} className="start-over-button" style={styles.actionButton}>Start Over</button>
                <button type="button" onClick={onBackToEdit} className="back-to-edit-button" style={styles.actionButton}>Back to Edit</button>
            </div>
        </div>
    );
}

const styles = {
    tabNav: { borderBottom: '1px solid #ccc', marginBottom: '0px', paddingLeft: '10px', display: 'flex', gap: '2px', flexWrap: 'wrap' },
    tabButton: { padding: '10px 15px', cursor: 'pointer', border: '1px solid #ccc', borderBottom: '1px solid #ccc', background: '#f0f0f0', borderTopLeftRadius: '5px', borderTopRightRadius: '5px', opacity: 0.8, marginBottom: '-1px', position: 'relative', zIndex: 1, color: '#333', transition: 'background-color 0.2s, color 0.2s', fontSize: '0.9em' },
    tabButtonActive: { padding: '10px 15px', cursor: 'pointer', border: '1px solid #ccc', borderBottom: '1px solid white', background: 'white', borderTopLeftRadius: '5px', borderTopRightRadius: '5px', fontWeight: 'bold', marginBottom: '-1px', position: 'relative', zIndex: 2, color: '#000000', transition: 'background-color 0.2s, color 0.2s', fontSize: '0.9em' },
    tabContent: { padding: '20px', border: '1px solid #ccc', borderTop: 'none', borderRadius: '0 0 5px 5px', background: 'white', marginBottom: '20px', minHeight: '200px' },
    hiddenChart: { position: 'absolute', left: '-9999px', top: '-9999px', width: '600px', height: '450px', padding: '10px', backgroundColor: 'white', boxSizing: 'content-box' },
    disclaimer: { marginTop: '2rem', fontSize: '0.9em', color: '#777', textAlign: 'center' },
    actionsFooter: { textAlign: 'center', marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
    actionButton: { padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em', backgroundColor: '#007bff', color: 'white' }
};
// Si ResultsCTA u otros botones necesitan un estilo diferente, aplícalo directamente o con clases.
styles.actionButton['.start-over-button'] = { backgroundColor: '#6c757d' }; // Ejemplo, no funciona así directamente
styles.actionButton['.back-to-edit-button'] = { backgroundColor: '#ffc107', color: '#212529' };

export default ResultsDisplay;