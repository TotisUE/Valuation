// src/components/SectionResultsPage.jsx
import React, { useState, useMemo } from 'react';

// -----------------------------------------------------------------------------
// HELPERS E INTERPRETACIONES (Mantener o mover a utils)
// -----------------------------------------------------------------------------
const getS2DInterpretationText = (score, maxScore, type) => { // Puedes renombrar a getSectionInterpretationText si se vuelve muy genérica
    const numericScore = Number(score);
    if (isNaN(numericScore)) return "N/A (Invalid Score)";

    let ranges;
    // S2D (ya existente)
    if (type === 's2d_process_maturity') { // Max 56
        ranges = [
            { limit: 48, text: "Excellent - Your Sale to Delivery process is a competitive advantage" },
            { limit: 39, text: "Good - Your process works well but has some improvement opportunities" },
            { limit: 28, text: "Developing - Basic processes exist but significant improvements would drive better results" },
            { limit: 12, text: "Basic - Major improvements needed to create consistent, scalable delivery" },
            { limit: 0,  text: "Critical - Immediate attention required to establish fundamental processes" }
        ];
    } else if (type === 's2d_owner_independence') { // Max 40
        ranges = [
            { limit: 32, text: "Excellent - Processes run independently with minimal owner involvement" },
            { limit: 24, text: "Good - Owner is appropriately positioned in oversight rather than execution" },
            { limit: 16, text: "Developing - Some delegation exists, but owner remains too involved in execution" },
            { limit: 8,  text: "Concerning - Owner is a critical bottleneck in multiple processes" },
            { limit: 0,  text: "Critical - Business is entirely dependent on owner involvement" }
        ];
    // --- AÑADIR LÓGICA PARA D2S ---
    } else if (type === 'd2s_process_maturity') { // D2S Process Maturity, Max 70 (según tu guía D2S)
        ranges = [
            { limit: 60, text: "Excellent - Your Delivery to Success process is a competitive advantage" }, // 85-100%
            { limit: 50, text: "Good - Your process works well but has some improvement opportunities" },    // 70-84%
            { limit: 35, text: "Developing - Basic processes exist but significant improvements would drive better results" }, // 50-69%
            { limit: 15, text: "Basic - Major improvements needed to create consistent, scalable success" }, // 21-49%
            { limit: 0,  text: "Critical - Immediate attention required to establish fundamental processes" }  // 0-20%
        ];
    } else if (type === 'd2s_owner_independence') { // D2S Owner Independence, Max 50 (según tu guía D2S)
        ranges = [
            { limit: 40, text: "Excellent - Processes run independently with minimal owner involvement" }, // 80-100%
            { limit: 30, text: "Good - Owner is appropriately positioned in oversight rather than execution" },    // 60-79%
            { limit: 20, text: "Developing - Some delegation exists, but owner remains too involved in execution" }, // 40-59%
            { limit: 10, text: "Concerning - Owner is a critical bottleneck in multiple processes" }, // 20-39%
            { limit: 0,  text: "Critical - Business is entirely dependent on owner involvement" }  // 0-19%
        ];
    // --- FIN DE LÓGICA PARA D2S ---
    } else if (type === 'sub_score') { // Para sub-scores S2D y D2S
        const percentage = maxScore > 0 ? (numericScore / maxScore) * 100 : 0;
        // Usaremos una interpretación genérica para sub-scores, puedes especializarla si es necesario
        if (percentage >= 75) return "Strong performance in this sub-area.";
        if (percentage >= 50) return "Adequate performance, some opportunities for optimization.";
        return "This sub-area may require focused improvement.";
    } else {
        return "N/A (Unknown score type)";
    }

    const interpretation = ranges.find(r => numericScore >= r.limit);
    return interpretation ? interpretation.text : (ranges.length > 0 ? ranges[ranges.length - 1].text : "N/A");
};

const D2SAssessmentDetails = ({ d2sData }) => {
    // Interpretaciones para los scores principales de D2S
    const processMaturityInterpretation = useMemo(() =>
        getS2DInterpretationText(d2sData.d2s_processMaturityScore, 70, 'd2s_process_maturity'),
        [d2sData.d2s_processMaturityScore]
    );
    const ownerIndependenceInterpretation = useMemo(() =>
        getS2DInterpretationText(d2sData.d2s_ownerIndependenceScore, 50, 'd2s_owner_independence'),
        [d2sData.d2s_ownerIndependenceScore]
    );

    // Estructura para los 6 sub-scores de D2S (tomados de d2sData.d2s_detailedAnswers)
    // Los títulos ya vienen de calculateD2SSectionData
    const subScoreGroupsD2S = d2sData.d2s_detailedAnswers ? Object.values(d2sData.d2s_detailedAnswers) : [];
    
    // Ordenar subScoreGroupsD2S según el orden deseado si es necesario
    // Por ejemplo, si los valueKeys de d2s_detailedAnswers no garantizan el orden:
    // const desiredOrder = ["resultsEffectiveness", "retentionEffectiveness", "reviewsIntegration", "referralsGeneration", "resaleOptimization", "journeyManagement"];
    // const subScoreGroupsD2S = desiredOrder.map(key => d2sData.d2s_detailedAnswers[key]).filter(Boolean);


    return (
        <div className="d2s-assessment-details">
            <h3 style={styles.pageSubHeader}>Delivery to Success Assessment</h3> {/* Título genérico o puedes pasar uno específico */}

            <div style={styles.sectionBox}>
                <h4>Overall D2S Scores</h4>
                <div style={styles.scoreItem}>
                    <p><strong>Process Maturity Score:</strong> {d2sData.d2s_processMaturityScore} / 70</p>
                    <p style={styles.interpretationText}><em>{processMaturityInterpretation}</em></p>
                </div>
                <div style={styles.scoreItem}>
                    <p><strong>Owner Independence Score:</strong> {d2sData.d2s_ownerIndependenceScore} / 50</p>
                    <p style={styles.interpretationText}><em>{ownerIndependenceInterpretation}</em></p>
                </div>
            </div>

            <div style={styles.sectionBox}>
                <h4>Detailed D2S "5 R's + Journey" Breakdown</h4>
                {subScoreGroupsD2S.map(group => {
                    if (!group || !group.title) return null; // Asegurar que el grupo y el título existen
                    return (
                        <div key={group.title} style={{ marginBottom: '20px' }}>
                            <h5>{group.title}: {group.score} / {group.maxScore} points</h5>
                            <p style={styles.interpretationTextSmall}>
                                <em>{getS2DInterpretationText(group.score, group.maxScore, 'sub_score')}</em>
                            </p>
                            {group.questions && group.questions.map(q => (
                                <div key={q.id} style={styles.detailedItemS2D}> {/* Puedes reusar estilos de S2D o crear D2S específicos */}
                                    <p style={styles.questionTextS2D}>
                                        <strong>{q.text ? q.text.substring(0, q.text.indexOf(':') + 1) : `Question ${q.id}`}</strong>
                                    </p>
                                    <p style={styles.answerTextS2D}>
                                        Your Answer: "{q.answerText}" (Score: {q.answerScore})
                                    </p>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const D2SReportDetails = ({ d2sData }) => {
    const processMaturityInterpretation = useMemo(() =>
        getS2DInterpretationText(d2sData.d2s_processMaturityScore, 70, 'd2s_process_maturity'),
        [d2sData.d2s_processMaturityScore]
    );
    const ownerIndependenceInterpretation = useMemo(() =>
        getS2DInterpretationText(d2sData.d2s_ownerIndependenceScore, 50, 'd2s_owner_independence'),
        [d2sData.d2s_ownerIndependenceScore]
    );

    const {
        d2s_ownerStrategicPositioning,
        // Podrías necesitar los sub-scores individuales aquí si quieres mencionarlos como en S2DReportDetails
        // d2s_resultsEffectivenessScore, 
        // d2s_retentionEffectivenessScore,
        // ...etc.
    } = d2sData;

    // Helper para el resumen ejecutivo, similar a getSubScoreLevel de S2D
    const getD2SSubScoreLevelText = (score, maxScore) => {
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
        if (percentage >= 75) return "strong";
        if (percentage >= 50) return "adequate";
        return "an area for development";
    };


    return (
        <div className="d2s-report-details">
            <h3 style={styles.pageSubHeader}>Report for: Delivery to Success</h3>

            <div style={styles.sectionBox}>
                <h4>Executive Summary (Delivery to Success)</h4>
                <p>
                    The Delivery to Success assessment reveals a
                    <strong> "{processMaturityInterpretation.toLowerCase().split(" - ")[0]}"</strong> level of process maturity for customer success and post-sale operations.
                    Regarding owner involvement in these D2S processes, the assessment indicates <strong>"{ownerIndependenceInterpretation.toLowerCase().split(" - ")[0]}"</strong>,
                    suggesting that {ownerIndependenceInterpretation.substring(ownerIndependenceInterpretation.indexOf("- ") + 2).toLowerCase()}.
                </p>
                <p>
                    Performance across the "5 R's + Journey" framework:
                    <ul>
                        {d2sData.d2s_detailedAnswers && Object.values(d2sData.d2s_detailedAnswers).map(sub => (
                            <li key={sub.title}>
                                {sub.title}: Rated as {getD2SSubScoreLevelText(sub.score, sub.maxScore)}.
                            </li>
                        ))}
                    </ul>
                </p>
            </div>

            <div style={styles.sectionBox}>
                <h4>Key Findings & Strategic Positioning (D2S)</h4>
                <h5>Process Maturity (D2S):</h5>
                <p><em>{processMaturityInterpretation}</em></p>

                <h5 style={{ marginTop: '15px' }}>Owner Independence (D2S):</h5>
                <p><em>{ownerIndependenceInterpretation}</em></p>

                {d2s_ownerStrategicPositioning && (
                    <>
                        <h5 style={{ marginTop: '15px' }}>Owner Strategic Positioning (D2S):</h5>
                        <p>
                            <strong>Areas for strategic oversight (delegation opportunities):</strong><br />
                            {d2s_ownerStrategicPositioning.areasForDelegation.length > 0
                                ? d2s_ownerStrategicPositioning.areasForDelegation.join(', ')
                                : "None specifically identified. Focus on general process improvement and team empowerment within D2S."}
                        </p>
                        <p>
                            <strong>Areas for active management (where D2S process is weak & owner not involved):</strong><br />
                            {d2s_ownerStrategicPositioning.areasForActiveManagement.length > 0
                                ? d2s_ownerStrategicPositioning.areasForActiveManagement.join(', ')
                                : "None specifically identified. Ensure key D2S processes are not neglected if owner oversight is low."}
                        </p>
                    </>
                )}
            </div>

            <div style={styles.sectionBox}>
                <h4>Focus Areas & Next Steps (D2S - Conceptual)</h4>
                {/* Puedes adaptar los "Next Steps" basados en los scores D2S y la guía del prompt que me diste */}
                <ul>
                    {d2sData.d2s_processMaturityScore < 35 && ( // "Developing" o peor
                        <li>Prioritize documenting and standardizing 1-2 core Delivery to Success processes that are currently rated low.</li>
                    )}
                    {d2sData.d2s_ownerIndependenceScore < 20 && ( // "Developing" o peor
                        <li>Identify 1-2 key D2S tasks currently handled by the owner that can be delegated.</li>
                    )}
                    {d2sData.d2s_resultsEffectivenessScore < (14 * 0.6) && (<li>Focus on improving service/product delivery execution and customer success measurement.</li>)}
                    {d2sData.d2s_retentionEffectivenessScore < (21 * 0.6) && (<li>Strengthen issue resolution, proactive support, and retention/renewal processes.</li>)}
                    {/* ... Añadir más para otros sub-scores si lo deseas ... */}
                    <li>Review the "Owner Strategic Positioning" for D2S to guide delegation or active management efforts.</li>
                    <li>Utilize the generated prompt to explore AI-driven suggestions for the identified areas of improvement.</li>
                </ul>
            </div>
        </div>
    );
};

const getSubScoreLevel = (score, maxScore) => { // Helper para S2DReportDetails
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (percentage >= 75) return "strong";
    if (percentage >= 50) return "adequate";
    return "an area for development";
};

// -----------------------------------------------------------------------------
// COMPONENTES DE DETALLE PARA LAS PESTAÑAS
// -----------------------------------------------------------------------------

// --- ASSESSMENT TAB DETAILS ---
const S2DAssessmentDetails = ({ s2dData }) => { // CAMBIO: Recibe props renombrada para claridad
    const processMaturityInterpretation = useMemo(() => 
        getS2DInterpretationText(s2dData.s2d_processMaturityScore, 56, 'process_maturity'),
        [s2dData.s2d_processMaturityScore]
    );
    const ownerIndependenceInterpretation = useMemo(() =>
        getS2DInterpretationText(s2dData.s2d_ownerIndependenceScore, 40, 'owner_independence'),
        [s2dData.s2d_ownerIndependenceScore]
    );

    const subScoreGroups = [
        { title: "Customer Experience Quality", score: s2dData.s2d_customerExperienceScore, max: 21, details: s2dData.s2d_detailedAnswers?.customerExperience },
        { title: "Growth Connection Effectiveness", score: s2dData.s2d_growthConnectionScore, max: 21, details: s2dData.s2d_detailedAnswers?.growthConnection },
        { title: "Measurement & Retention Effectiveness", score: s2dData.s2d_measurementRetentionScore, max: 14, details: s2dData.s2d_detailedAnswers?.measurementRetention }
    ];

    return (
        <div className="s2d-assessment-details">
            <h3 style={styles.pageSubHeader}>Sale to Delivery Assessment: {s2dData.s2d_productName || "N/A"}</h3>
            
            <div style={styles.sectionBox}>
                <h4>Product/Service Overview</h4>
                <p><strong>Description:</strong> {s2dData.s2d_productDescription || "N/A"}</p>
                <p><strong>Annual Revenue:</strong> ${s2dData.s2d_productRevenue?.toLocaleString() || "N/A"}</p>
            </div>

            <div style={styles.sectionBox}>
                <h4>Overall S2D Scores</h4>
                <div style={styles.scoreItem}>
                    <p><strong>Process Maturity Score:</strong> {s2dData.s2d_processMaturityScore} / 56</p>
                    <p style={styles.interpretationText}><em>{processMaturityInterpretation}</em></p>
                </div>
                <div style={styles.scoreItem}>
                    <p><strong>Owner Independence Score:</strong> {s2dData.s2d_ownerIndependenceScore} / 40</p>
                    <p style={styles.interpretationText}><em>{ownerIndependenceInterpretation}</em></p>
                </div>
            </div>

            <div style={styles.sectionBox}>
                <h4>Detailed S2D Breakdown</h4>
                {subScoreGroups.map(group => (
                    <div key={group.title} style={{ marginBottom: '20px' }}>
                        <h5>{group.title}: {group.score} / {group.max} points</h5>
                        <p style={styles.interpretationTextSmall}><em>{getS2DInterpretationText(group.score, group.max, 'sub_score')}</em></p>
                        {group.details && Object.keys(group.details).sort((a,b) => a.localeCompare(b, undefined, {numeric: true})).map(qKey => {
                            const item = group.details[qKey];
                            if (!item) return null;
                            return (
                                <div key={`${group.title}-${qKey}`} style={styles.detailedItemS2D}>
                                    <p style={styles.questionTextS2D}><strong>{item.questionText ? item.questionText.substring(0, item.questionText.indexOf(':') + 1) : `Item ${qKey}`}</strong></p>
                                    <p style={styles.answerTextS2D}>Your Answer: "{item.answerText}" (Score: {item.score})</p>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const StandardSectionAssessmentDetails = ({ sectionData }) => {
    return (
        <div className="standard-assessment-details">
            <h3 style={styles.pageSubHeader}>Assessment for: {sectionData.sectionTitle}</h3>
            <div style={styles.sectionBox}>
                <h4>Section Score</h4>
                <p><strong>Score:</strong> {sectionData.score} / {sectionData.maxScore}</p>
                <p style={styles.interpretationText}><em>{sectionData.interpretation}</em></p>
            </div>
            <div style={styles.sectionBox}>
                <h4>Your Answers:</h4>
                {sectionData.questions?.map((q, index) => (
                    <div key={q.id || `std-q-${index}`} style={styles.detailedItemStandard}>
                        <p style={styles.questionTextStandard}><strong>{q.text}</strong></p>
                        <p style={styles.answerTextStandard}>Your answer: {q.answer}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- REPORT TAB DETAILS ---
const S2DReportDetails = ({ s2dData }) => { // CAMBIO: Recibe props renombrada para claridad
    const processMaturityInterpretation = useMemo(() => 
        getS2DInterpretationText(s2dData.s2d_processMaturityScore, 56, 'process_maturity'),
        [s2dData.s2d_processMaturityScore]
    );
    const ownerIndependenceInterpretation = useMemo(() =>
        getS2DInterpretationText(s2dData.s2d_ownerIndependenceScore, 40, 'owner_independence'),
        [s2dData.s2d_ownerIndependenceScore]
    );

    const { 
        s2d_ownerStrategicPositioning,
        s2d_customerExperienceScore,
        s2d_growthConnectionScore,
        s2d_measurementRetentionScore,
        s2d_processMaturityScore, // Necesario para las condiciones de "Focus Areas"
        s2d_ownerIndependenceScore // Necesario para las condiciones de "Focus Areas"
    } = s2dData;

    return (
        <div className="s2d-report-details">
            <h3 style={styles.pageSubHeader}>Report for: {s2dData.s2d_productName || "S2D Assessment"}</h3>

            <div style={styles.sectionBox}>
                <h4>Executive Summary</h4>
                <p>
                    The Sale to Delivery process for <strong>{s2dData.s2d_productName}</strong> demonstrates a
                    <strong> "{processMaturityInterpretation.toLowerCase().split(" - ")[0]}"</strong> level of process maturity.
                    Regarding owner involvement, the assessment indicates <strong>"{ownerIndependenceInterpretation.toLowerCase().split(" - ")[0]}"</strong>,
                    suggesting that {ownerIndependenceInterpretation.substring(ownerIndependenceInterpretation.indexOf("- ") + 2).toLowerCase()}.
                </p>
                <p>
                    Key operational areas show varied performance:
                    Customer Experience Quality is rated as {getSubScoreLevel(s2d_customerExperienceScore, 21)},
                    Growth Connection Effectiveness is {getSubScoreLevel(s2d_growthConnectionScore, 21)},
                    and Measurement & Retention Effectiveness is {getSubScoreLevel(s2d_measurementRetentionScore, 14)}.
                </p>
            </div>

            <div style={styles.sectionBox}>
                <h4>Key Findings & Strategic Positioning</h4>
                <h5>Process Maturity:</h5>
                <p><em>{processMaturityInterpretation}</em></p>

                <h5 style={{marginTop: '15px'}}>Owner Independence:</h5>
                <p><em>{ownerIndependenceInterpretation}</em></p>
                
                {s2d_ownerStrategicPositioning && (
                    <>
                        <h5 style={{marginTop: '15px'}}>Owner Strategic Positioning:</h5>
                        <p>
                            <strong>Areas for strategic oversight (delegation opportunities):</strong><br/>
                            {s2d_ownerStrategicPositioning.areasForDelegation.length > 0 
                                ? s2d_ownerStrategicPositioning.areasForDelegation.join(', ') 
                                : "None specifically identified based on current responses. Focus on general process improvement and team empowerment."}
                        </p>
                        <p>
                            <strong>Areas for active management (where process is weak & owner not involved):</strong><br/>
                            {s2d_ownerStrategicPositioning.areasForActiveManagement.length > 0
                                ? s2d_ownerStrategicPositioning.areasForActiveManagement.join(', ')
                                : "None specifically identified. Ensure key processes are not neglected if owner oversight is low."}
                        </p>
                    </>
                )}
            </div>
            
            <div style={styles.sectionBox}>
                <h4>Focus Areas & Next Steps (Conceptual)</h4>
                <ul>
                    {s2d_processMaturityScore < 39 && (
                        <li>Prioritize documenting and standardizing 1-2 core S2D processes that are currently rated low.</li>
                    )}
                    {s2d_ownerIndependenceScore < 24 && (
                        <li>Identify 1-2 key tasks currently handled by the owner that can be delegated with appropriate training and support.</li>
                    )}
                     {s2d_customerExperienceScore < (21*0.6) && (<li>Review and enhance client onboarding and communication protocols to improve customer experience.</li>)}
                     {s2d_growthConnectionScore < (21*0.6) && (<li>Explore strategies to better integrate sales success with marketing efforts and generate more referrals.</li>)}
                     {s2d_measurementRetentionScore < (14*0.6) && (<li>Implement more robust methods for measuring delivery success and client retention.</li>)}
                    <li>Based on the "Owner Strategic Positioning", develop a plan to either delegate mature processes or actively improve underperforming, neglected ones.</li>
                </ul>
            </div>
        </div>
    );
};

const StandardSectionReportDetails = ({ sectionData }) => {
    return (
        <div className="standard-report-details">
            <h3 style={styles.pageSubHeader}>Report for: {sectionData.sectionTitle}</h3>
            <div style={styles.sectionBox}>
                <h4>Executive Summary</h4>
                <p>
                    Your assessment for <strong>{sectionData.sectionTitle}</strong> indicates
                    a score of {sectionData.score} out of {sectionData.maxScore}.
                    This suggests: <em>{sectionData.interpretation}</em>
                </p>
            </div>
            <div style={styles.sectionBox}>
                <h4>Key Insights</h4>
                <p>
                    The primary finding is that your current approach is <strong>{sectionData.interpretation.toLowerCase().replace(/\./g, '')}</strong>.
                </p>
                {sectionData.questions && sectionData.questions.length > 0 && sectionData.questions[0]?.text && sectionData.questions[0]?.answer && (
                    <p>Consider your answer to: "<em>{sectionData.questions[0].text}</em>" which was "<em>{sectionData.questions[0].answer}</em>". How does this align with your overall score?</p>
                )}
            </div>
            <div style={styles.sectionBox}>
                <h4>Suggested Focus</h4>
                <p>
                    Based on your score, a potential area to focus on could be
                    {sectionData.maxScore > 0 && sectionData.score / sectionData.maxScore < 0.5 ? " strengthening foundational elements and addressing key weaknesses identified in your answers." : " optimizing existing strengths and exploring advanced strategies for this area."}
                    Review your specific answers in the 'Assessment' tab for more detailed insights.
                </p>
            </div>
        </div>
    );
};

const AssessmentTabContent = ({ sectionData }) => {
    if (!sectionData) return <p>Loading assessment data...</p>;

    if (sectionData.isS2D) { // S2D tiene prioridad si ambos fueran true por error
        return <S2DAssessmentDetails s2dData={sectionData} />;
    } else if (sectionData.isD2S) { // <--- AÑADE ESTA CONDICIÓN
        return <D2SAssessmentDetails d2sData={sectionData} />;
    } else {
        return <StandardSectionAssessmentDetails sectionData={sectionData} />;
    }
};

const ReportTabContent = ({ sectionData }) => {
    if (!sectionData) return <p>Loading report data...</p>;

    if (sectionData.isS2D) {
        return <S2DReportDetails s2dData={sectionData} />;
    } else if (sectionData.isD2S) { // <--- AÑADE ESTA CONDICIÓN
        return <D2SReportDetails d2sData={sectionData} />;
    } else {
        return <StandardSectionReportDetails sectionData={sectionData} />;
    }
};

function SectionResultsPage({
    sectionName, // Este prop sigue siendo útil para el encabezado general de la página
    sectionData,
    onContinueToNextStep,
    onGeneratePrompt,
    isSubmitting,
}) {
    const [activeTab, setActiveTab] = useState('assessment');

    if (!sectionData) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Loading section results or section not applicable...</p>
                <button type="button" onClick={onContinueToNextStep} className="button primary">Continue</button>
            </div>
        );
    }
    
    const handleGeneratePromptClick = () => {
        if (onGeneratePrompt) {
            // sectionName se refiere al título general de la sección actual que viene de MultiStepForm
            onGeneratePrompt(sectionName); 
        }
    };

    return (
        <div className="section-results-page" style={styles.pageContainer}>
            <h2 style={styles.pageHeader}>Results for: {sectionName}</h2>

            <div className="tabs-navigation" style={styles.tabsNavigation}>
                <button
                    onClick={() => setActiveTab('assessment')}
                    style={activeTab === 'assessment' ? styles.activeTabButton : styles.tabButton}
                    disabled={activeTab === 'assessment'}
                >
                    Assessment
                </button>
                <button
                    onClick={() => setActiveTab('report')}
                    style={activeTab === 'report' ? styles.activeTabButton : styles.tabButton}
                    disabled={activeTab === 'report'}
                >
                    Report
                </button>
            </div>

            <div className="tab-content" style={styles.tabContent}>
                {activeTab === 'assessment' && (
                    <AssessmentTabContent sectionData={sectionData} />
                )}
                {activeTab === 'report' && (
                    <ReportTabContent sectionData={sectionData} />
                )}
            </div>

            <div className="section-results-actions" style={styles.actionsContainer}>
                <button
                    type="button"
                    onClick={handleGeneratePromptClick}
                    disabled={isSubmitting}
                    className="button info"
                >
                    Generate Prompt (.txt)
                </button>
                <button
                    type="button"
                    onClick={onContinueToNextStep}
                    disabled={isSubmitting}
                    className="button primary"
                >
                    Continue to Next Section
                </button>
            </div>
            
            <style jsx>{`
                .button {
                    padding: 0.8rem 1.5rem;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 500; // Consistencia
                    transition: background-color 0.2s ease, box-shadow 0.2s ease; // Consistencia
                    margin: 0 5px;
                    line-height: 1.5; // Consistencia
                }
                .button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Botón Primario (como el "Next" o "Submit") */
                .button.primary {
                    background-color: #007bff; /* Azul brillante */
                    color: white;
                    border: 1px solid #007bff;
                }
                .button.primary:hover:not(:disabled) {
                    background-color: #0056b3; /* Azul más oscuro */
                    border-color: #0056b3;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                /* Botón de Información/Secundario (para "Generate Prompt") */
                .button.info {
                    background-color: #17a2b8; /* Cian/Turquesa */
                    color: white;
                    border: 1px solid #17a2b8;
                }
                .button.info:hover:not(:disabled) {
                    background-color: #117a8b; /* Cian más oscuro */
                    border-color: #117a8b;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
             `}</style>
        </div>
    );
}


const styles = { /* ... tus estilos ... */ 
    pageContainer: { padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '20px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    pageHeader: { textAlign: 'center', marginBottom: '25px', color: '#333', fontSize: '1.8em' },
    pageSubHeader: { marginTop: '0', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px', fontSize: '1.4em', color: '#444' },
    tabsNavigation: { marginBottom: '20px', textAlign: 'center', borderBottom: '1px solid #ddd' },
    tabButton: {
        padding: '10px 20px', cursor: 'pointer', border: 'none', backgroundColor: 'transparent',
        marginRight: '5px', borderRadius: '5px 5px 0 0', fontSize: '1em', color: '#007bff',
        borderBottom: '3px solid transparent',
    },
    activeTabButton: {
        padding: '10px 20px', cursor: 'default', border: 'none', backgroundColor: 'transparent',
        marginRight: '5px', borderRadius: '5px 5px 0 0', fontSize: '1em', color: '#333', fontWeight: 'bold',
        borderBottom: '3px solid #007bff',
    },
    tabContent: { padding: '20px 0' },
    actionsContainer: { marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #eee' },
    sectionBox: { marginBottom: '25px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' },
    scoreItem: { marginBottom: '15px' },
    interpretationText: { fontSize: '1em', color: '#555', margin: '5px 0 0 0', lineHeight: '1.5' },
    interpretationTextSmall: { fontSize: '0.9em', color: '#666', margin: '3px 0 10px 0' },
    detailedItemS2D: { marginLeft: '15px', marginBottom: '12px', paddingLeft: '15px', borderLeft: '3px solid #007bff' },
    questionTextS2D: { margin: '0 0 4px 0', fontWeight: '500', color: '#222', fontSize: '0.95em' },
    answerTextS2D: { margin: '0', fontStyle: 'italic', color: '#454545', fontSize: '0.95em' },
    detailedItemStandard: { marginBottom: '15px', padding: '10px', border: '1px solid #f0f0f0', borderRadius: '4px' },
    questionTextStandard: { margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' },
    answerTextStandard: { margin: '0', fontStyle: 'italic', color: '#555' }
};

export default SectionResultsPage;