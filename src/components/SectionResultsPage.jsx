// src/components/SectionResultsPage.jsx
import React, { useState, useMemo } from 'react';

const getS2DInterpretationText = (score, maxScore, type) => {
    const numericScore = Number(score);
    if (isNaN(numericScore)) return "N/A (Invalid Score)";
    let ranges;

    if (type === 'process_maturity') { // Max 70 para S2D (antes D2S)
        // Nuevos rangos basados en la guía del cliente para Process Maturity (max 70)
        ranges = [
            { limit: 60, text: "Excellent - Your Delivery to Success process is a competitive advantage" }, // 85%+ de 70 es ~59.5, redondeado a 60
            { limit: 50, text: "Good - Your process works well but has some improvement opportunities" },   // 70% de 70 es 49, redondeado a 50
            { limit: 35, text: "Developing - Basic processes exist but significant improvements would drive better results" }, // 50% de 70 es 35
            { limit: 15, text: "Basic - Major improvements needed to create consistent, scalable success" },  // 21% de 70 es ~14.7, redondeado a 15
            { limit: 0,  text: "Critical - Immediate attention required to establish fundamental processes" } // 0-20%
        ];
    } else if (type === 'owner_independence') { // Max 50 para S2D (antes D2S)
        // Nuevos rangos basados en la guía del cliente para Owner Independence (max 50)
        ranges = [
            { limit: 40, text: "Excellent - Processes run independently with minimal owner involvement" }, // 80% de 50 es 40
            { limit: 30, text: "Good - Owner is appropriately positioned in oversight rather than execution" }, // 60% de 50 es 30
            { limit: 20, text: "Developing - Some delegation exists, but owner remains too involved in execution" }, // 40% de 50 es 20
            { limit: 10, text: "Concerning - Owner is a critical bottleneck in multiple processes" }, // 20% de 50 es 10
            { limit: 0,  text: "Critical - Business is entirely dependent on owner involvement" } // 0-19%
        ];
    } else if (type === 'sub_score') {
        const percentage = maxScore > 0 ? (numericScore / maxScore) * 100 : 0;
        if (percentage >= 75) return "Strong performance in this sub-area.";
        if (percentage >= 50) return "Adequate performance, some opportunities for optimization.";
        return "This sub-area may require focused improvement.";
    } else {
        return "N/A (Unknown score type)"; 
    }
    
    const interpretation = ranges.find(r => numericScore >= r.limit);
    return interpretation ? interpretation.text : (ranges.length > 0 ? ranges[ranges.length - 1].text : "N/A");
};

const getSubScoreLevel = (score, maxScore) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (percentage >= 75) return "strong";
    if (percentage >= 50) return "adequate";
    return "an area for development";
};


const S2DAssessmentDetails = ({ s2dData }) => {
    const processMaturityInterpretation = useMemo(() => 
        getS2DInterpretationText(s2dData.s2d_processMaturityScore, 70, 'process_maturity'), // Max 70
        [s2dData.s2d_processMaturityScore]
    );
    const ownerIndependenceInterpretation = useMemo(() =>
        getS2DInterpretationText(s2dData.s2d_ownerIndependenceScore, 50, 'owner_independence'), // Max 50
        [s2dData.s2d_ownerIndependenceScore]
    );

    // Nuevos sub-grupos para S2D
    const subScoreGroups = [
        { title: "Results Effectiveness (Q1-2)", score: s2dData.s2d_resultsEffectivenessScore, max: 14, details: s2dData.s2d_detailedAnswers?.resultsEffectiveness },
        { title: "Retention Effectiveness (Q3-5)", score: s2dData.s2d_retentionEffectivenessScore, max: 21, details: s2dData.s2d_detailedAnswers?.retentionEffectiveness },
        { title: "Reviews Integration (Q6)", score: s2dData.s2d_reviewsIntegrationScore, max: 7, details: s2dData.s2d_detailedAnswers?.reviewsIntegration },
        { title: "Referrals Generation (Q7)", score: s2dData.s2d_referralsGenerationScore, max: 7, details: s2dData.s2d_detailedAnswers?.referralsGeneration },
        { title: "Resale Optimization (Q8, Q10)", score: s2dData.s2d_resaleOptimizationScore, max: 14, details: s2dData.s2d_detailedAnswers?.resaleOptimization },
        { title: "Journey Management (Q9)", score: s2dData.s2d_journeyManagementScore, max: 7, details: s2dData.s2d_detailedAnswers?.journeyManagement }
    ];

    return (
        <div className="s2d-assessment-details">
            {/* El título puede seguir siendo el del producto o un título genérico para la sección S2D */}
            <h3 style={styles.pageSubHeader}>Sale to Delivery Process Assessment: {s2dData.s2d_productName || "Overview"}</h3> 
            
            {/* Mantener Product/Service Overview si s2d_productName, etc. siguen siendo parte de S2D */}
            {s2dData.s2d_productName && ( // Mostrar solo si hay nombre de producto
                <div style={styles.sectionBox}>
                    <h4>Product/Service Context</h4>
                    <p><strong>Product/Service Name:</strong> {s2dData.s2d_productName}</p>
                    <p><strong>Description:</strong> {s2dData.s2d_productDescription || "N/A"}</p>
                    <p><strong>Annual Revenue:</strong> ${s2dData.s2d_productRevenue?.toLocaleString() || "N/A"}</p>
                </div>
            )}

            <div style={styles.sectionBox}>
                <h4>Overall S2D Scores</h4>
                <div style={styles.scoreItem}>
                    <p><strong>Process Maturity Score:</strong> {s2dData.s2d_processMaturityScore} / 70</p> {/* Max 70 */}
                    <p style={styles.interpretationText}><em>{processMaturityInterpretation}</em></p>
                </div>
                <div style={styles.scoreItem}>
                    <p><strong>Owner Independence Score:</strong> {s2dData.s2d_ownerIndependenceScore} / 50</p> {/* Max 50 */}
                    <p style={styles.interpretationText}><em>{ownerIndependenceInterpretation}</em></p>
                </div>
            </div>

            <div style={styles.sectionBox}>
                <h4>The 5 R's (+Journey) Performance Breakdown</h4>
                {subScoreGroups.map(group => (
                    <div key={group.title} style={{ marginBottom: '20px' }}>
                        <h5>{group.title}: {group.score} / {group.max} points</h5>
                        <p style={styles.interpretationTextSmall}><em>{getS2DInterpretationText(group.score, group.max, 'sub_score')}</em></p>
                        {group.details && Object.keys(group.details).sort((a,b) => a.localeCompare(b, undefined, {numeric: true})).map(qKey => {
                            const item = group.details[qKey];
                            if (!item) return null;
                            return (
                                <div key={`${group.title}-s2d-${qKey}`} style={styles.detailedItemS2D}>
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

const S2DReportDetails = ({ s2dData }) => {
    const processMaturityInterpretation = useMemo(() => 
        getS2DInterpretationText(s2dData.s2d_processMaturityScore, 70, 'process_maturity'),
        [s2dData.s2d_processMaturityScore]
    );
    const ownerIndependenceInterpretation = useMemo(() =>
        getS2DInterpretationText(s2dData.s2d_ownerIndependenceScore, 50, 'owner_independence'),
        [s2dData.s2d_ownerIndependenceScore]
    );

    // --- INICIO DE LA MODIFICACIÓN ---
    const { 
        s2d_ownerStrategicPositioning,
        // Usar los nombres correctos de los 6 sub-scores que vienen de s2dData
        s2d_resultsEffectivenessScore,     // Antes: s2d_customerExperienceScore
        s2d_retentionEffectivenessScore,   // Este es uno nuevo/diferente
        s2d_reviewsIntegrationScore,       // Nuevo
        s2d_referralsGenerationScore,    // Antes: s2d_growthConnectionScore (parcialmente)
        s2d_resaleOptimizationScore,       // Nuevo, también parte de Growth Connection en el prompt
        s2d_journeyManagementScore,        // Nuevo
        s2d_processMaturityScore,
        s2d_ownerIndependenceScore 
    } = s2dData;
 return (
        <div className="s2d-report-details">
            <h3 style={styles.pageSubHeader}>Sale to Delivery Process Report: {s2dData.s2d_productName || "Overview"}</h3>

            <div style={styles.sectionBox}>
                <h4>Executive Summary</h4>
                <p>
                    The Sale to Delivery process {s2dData.s2d_productName ? `for <strong>${s2dData.s2d_productName}</strong> ` : ""} 
                    demonstrates a <strong>"{processMaturityInterpretation.toLowerCase().split(" - ")[0]}"</strong> level of process maturity.
                    Regarding owner involvement, the assessment indicates <strong>"{ownerIndependenceInterpretation.toLowerCase().split(" - ")[0]}"</strong>,
                    suggesting that {ownerIndependenceInterpretation.substring(ownerIndependenceInterpretation.indexOf("- ") + 2).toLowerCase()}.
                </p>
                <p>
                    Performance breakdown across "The 5 R's (+Journey)":
                    {/* Actualizar para usar los nombres correctos y sus máximos */}
                    Results Effectiveness (Q1-2) is {getSubScoreLevel(s2d_resultsEffectivenessScore, 14)},
                    Retention Effectiveness (Q3-5) is {getSubScoreLevel(s2d_retentionEffectivenessScore, 21)},
                    Reviews Integration (Q6) is {getSubScoreLevel(s2d_reviewsIntegrationScore, 7)},
                    Referrals Generation (Q7) is {getSubScoreLevel(s2d_referralsGenerationScore, 7)},
                    Resale Optimization (Q8, Q10) is {getSubScoreLevel(s2d_resaleOptimizationScore, 14)},
                    and Journey Management (Q9) is {getSubScoreLevel(s2d_journeyManagementScore, 7)}.
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
                                : "None specifically identified. Focus on general process improvement."}
                        </p>
                        <p>
                            <strong>Areas for active management (process weak & owner not involved):</strong><br/>
                            {s2d_ownerStrategicPositioning.areasForActiveManagement.length > 0
                                ? s2d_ownerStrategicPositioning.areasForActiveManagement.join(', ')
                                : "None specifically identified. Ensure key processes are not neglected."}
                        </p>
                    </>
                )}
            </div>
            
            <div style={styles.sectionBox}>
                <h4>Focus Areas & Next Steps (Conceptual)</h4>
                <ul>
                    {/* Estas condiciones ahora usarán los scores de s2dData */}
                    {s2d_processMaturityScore < 50 && ( // Ajustar umbral si es necesario (ej. "Good" empieza en 50/70)
                        <li>Prioritize documenting and standardizing 1-2 core S2D processes that are currently rated low.</li>
                    )}
                    {s2d_ownerIndependenceScore < 30 && ( // Ajustar umbral (ej. "Good" empieza en 30/50)
                        <li>Identify 1-2 key tasks currently handled by the owner that can be delegated with appropriate training and support.</li>
                    )}
                    {/* Condiciones para los sub-scores */}
                    {s2d_resultsEffectivenessScore < (14 * 0.6) && (<li>Review and enhance client onboarding and communication protocols to improve customer experience and results tracking.</li>)}
                    {s2d_retentionEffectivenessScore < (21 * 0.6) && (<li>Strengthen issue resolution, proactive support, and renewal processes to improve customer retention.</li>)}
                    {/* ... puedes añadir más <li> basados en los otros sub-scores si lo deseas */}
                    <li>Based on the "Owner Strategic Positioning", develop a plan to either delegate mature processes or actively improve underperforming, neglected ones.</li>
                </ul>
            </div>
        </div>
    );
};

const D2SReportDetails = ({ d2sData }) => {
    const processMaturityInterpretation_D2S = useMemo(() => 
        getS2DInterpretationText(d2sData.d2s_processMaturityScore, 56, 'process_maturity'),
        [d2sData.d2s_processMaturityScore]
    );
    const ownerIndependenceInterpretation_D2S = useMemo(() =>
        getS2DInterpretationText(d2sData.d2s_ownerIndependenceScore, 40, 'owner_independence'),
        [d2sData.d2s_ownerIndependenceScore]
    );

    const { 
        d2s_ownerStrategicPositioning,
        d2s_customerExperienceScore,
        d2s_growthConnectionScore,
        d2s_measurementRetentionScore,
        d2s_processMaturityScore,
        d2s_ownerIndependenceScore
    } = d2sData;

    return (
        <div className="d2s-report-details">
            <h3 style={styles.pageSubHeader}>Delivery to Success Assessment Report</h3>

            <div style={styles.sectionBox}>
                <h4>Executive Summary</h4>
                <p>
                    Your Delivery to Success assessment indicates a
                    <strong> "{processMaturityInterpretation_D2S.toLowerCase().split(" - ")[0]}"</strong> level of process maturity.
                    Regarding owner involvement, the assessment suggests 
                    <strong> "{ownerIndependenceInterpretation_D2S.toLowerCase().split(" - ")[0]}"</strong>, meaning that {ownerIndependenceInterpretation_D2S.substring(ownerIndependenceInterpretation_D2S.indexOf("- ") + 2).toLowerCase()}.
                </p>
                <p>
                    Performance in key operational areas:
                    Customer Experience Quality is rated as {getSubScoreLevel(d2s_customerExperienceScore, 21)},
                    Growth Connection Effectiveness is {getSubScoreLevel(d2s_growthConnectionScore, 21)},
                    and Measurement & Retention Effectiveness is {getSubScoreLevel(d2s_measurementRetentionScore, 14)}.
                </p>
            </div>

            <div style={styles.sectionBox}>
                <h4>Key Findings & Strategic Positioning</h4>
                <h5>Process Maturity:</h5>
                <p><em>{processMaturityInterpretation_D2S}</em></p>

                <h5 style={{marginTop: '15px'}}>Owner Independence:</h5>
                <p><em>{ownerIndependenceInterpretation_D2S}</em></p>
                
                {d2s_ownerStrategicPositioning && (
                    <>
                        <h5 style={{marginTop: '15px'}}>Owner Strategic Positioning:</h5>
                        <p>
                            <strong>Areas for strategic oversight (delegation opportunities):</strong><br/>
                            {d2s_ownerStrategicPositioning.areasForDelegation.length > 0 
                                ? d2s_ownerStrategicPositioning.areasForDelegation.join(', ') 
                                : "None specifically identified. Focus on general process improvement."}
                        </p>
                        <p>
                            <strong>Areas for active management (process weak & owner not involved):</strong><br/>
                            {d2s_ownerStrategicPositioning.areasForActiveManagement.length > 0
                                ? d2s_ownerStrategicPositioning.areasForActiveManagement.join(', ')
                                : "None specifically identified. Ensure key processes are not neglected."}
                        </p>
                    </>
                )}
            </div>
            
            {/* Aquí podríamos añadir un resumen de las recomendaciones que irán al prompt, si se desea */}
            {/* O una sección de "Focus Areas" más general como en S2DReportDetails */}
            <div style={styles.sectionBox}>
                <h4>Conceptual Next Steps</h4>
                <p>Based on this assessment, consider focusing on the improvement areas highlighted by the Master Prompt templates that will be generated. Key themes often revolve around systematizing processes, enhancing customer feedback loops, and strategically managing owner involvement.</p>
                {/* Podrías añadir puntos más específicos si d2s_processMaturityScore es bajo, etc. */}
            </div>
        </div>
    );
};

const StandardSectionReportDetails = ({ sectionData }) => {

    const interpretationText = sectionData.interpretation || "No interpretation available";
    const sectionTitleText = sectionData.sectionTitle || "Section Report";
    const scoreText = sectionData.score !== undefined ? sectionData.score : "N/A";
    const maxScoreText = sectionData.maxScore !== undefined ? sectionData.maxScore : "N/A";

    return (
        <div className="standard-report-details">
            <h3 style={styles.pageSubHeader}>Report for: {sectionTitleText}</h3>
            <div style={styles.sectionBox}>
                <h4>Executive Summary</h4>
                <p>
                    Your assessment for <strong>{sectionTitleText}</strong> indicates
                    a score of {scoreText} out of {maxScoreText}.
                    This suggests: <em>{interpretationText}</em> {/* Ya no se llama toLowerCase aquí directamente */}
                </p>
            </div>
            <div style={styles.sectionBox}>
                <h4>Key Insights</h4>
                <p>
                    The primary finding is that your current approach is <strong>{interpretationText.toLowerCase().replace(/\./g, '')}</strong>.
                </p>
                {/* ... (resto del componente con comprobaciones similares si es necesario) ... */}
                 {sectionData.questions && sectionData.questions.length > 0 && sectionData.questions[0]?.text && sectionData.questions[0]?.answer && (
                    <p>Consider your answer to: "<em>{sectionData.questions[0].text}</em>" which was "<em>{sectionData.questions[0].answer}</em>". How does this align with your overall score?</p>
                )}
            </div>
            <div style={styles.sectionBox}>
                <h4>Suggested Focus</h4>
                <p>
                    Based on your score, a potential area to focus on could be
                    {(maxScoreText !== "N/A" && maxScoreText > 0 && scoreText !== "N/A" && (scoreText / maxScoreText) < 0.5) 
                        ? " strengthening foundational elements and addressing key weaknesses identified in your answers." 
                        : " optimizing existing strengths and exploring advanced strategies for this area."}
                    Review your specific answers in the 'Assessment' tab for more detailed insights.
                </p>
            </div>
        </div>
    );
};

const D2SAssessmentDetails = ({ d2sData }) => {
    // Ajustar los rangos de puntos según los máximos de 56 y 40 para D2S
    const processMaturityInterpretation_D2S = useMemo(() => 
        getS2DInterpretationText(d2sData.d2s_processMaturityScore, 56, 'process_maturity'), // Usamos la misma función de interpretación
        [d2sData.d2s_processMaturityScore]
    );
    const ownerIndependenceInterpretation_D2S = useMemo(() =>
        getS2DInterpretationText(d2sData.d2s_ownerIndependenceScore, 40, 'owner_independence'),
        [d2sData.d2s_ownerIndependenceScore]
    );

    const subScoreGroups_D2S = [
        { title: "Customer Experience Quality", score: d2sData.d2s_customerExperienceScore, max: 21, details: d2sData.d2s_detailedAnswers?.customerExperience },
        { title: "Growth Connection Effectiveness", score: d2sData.d2s_growthConnectionScore, max: 21, details: d2sData.d2s_detailedAnswers?.growthConnection },
        { title: "Measurement & Retention Effectiveness", score: d2sData.d2s_measurementRetentionScore, max: 14, details: d2sData.d2s_detailedAnswers?.measurementRetention }
    ];

    return (
        <div className="d2s-assessment-details">
            <h3 style={styles.pageSubHeader}>Delivery to Success Assessment</h3> {/* Título genérico para D2S */}
            
            {/* Puedes añadir aquí una breve introducción si la tienes para D2S */}
            {/* <p style={{ ...styles.introductionText, marginBottom: '20px' }}>
                Introduction: This assessment focuses on your entire service/product delivery process...
            </p> */}


            <div style={styles.sectionBox}>
                <h4>Overall D2S Scores</h4>
                <div style={styles.scoreItem}>
                    <p><strong>Process Maturity Score:</strong> {d2sData.d2s_processMaturityScore} / 56</p>
                    <p style={styles.interpretationText}><em>{processMaturityInterpretation_D2S}</em></p>
                </div>
                <div style={styles.scoreItem}>
                    <p><strong>Owner Independence Score:</strong> {d2sData.d2s_ownerIndependenceScore} / 40</p>
                    <p style={styles.interpretationText}><em>{ownerIndependenceInterpretation_D2S}</em></p>
                </div>
            </div>

            <div style={styles.sectionBox}>
                <h4>Detailed D2S Breakdown</h4>
                {subScoreGroups_D2S.map(group => (
                    <div key={group.title} style={{ marginBottom: '20px' }}>
                        <h5>{group.title}: {group.score} / {group.max} points</h5>
                        <p style={styles.interpretationTextSmall}><em>{getS2DInterpretationText(group.score, group.max, 'sub_score')}</em></p>
                        {group.details && Object.keys(group.details).sort((a,b) => a.localeCompare(b, undefined, {numeric: true})).map(qKey => {
                            const item = group.details[qKey];
                            if (!item) return null;
                            return (
                                <div key={`${group.title}-d2s-${qKey}`} style={styles.detailedItemS2D}> {/* Reusar estilos si son aplicables */}
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

const AssessmentTabContent = ({ sectionData }) => {
    if (!sectionData) return <p>Loading assessment data...</p>;

    if (sectionData.isS2D) {
        return <S2DAssessmentDetails s2dData={sectionData} />;
    } else if (sectionData.isD2S) { // +++ AÑADIR CONDICIÓN PARA D2S +++
        return <D2SAssessmentDetails d2sData={sectionData} />;
    } else {
        return <StandardSectionAssessmentDetails sectionData={sectionData} />;
    }
};

const ReportTabContent = ({ sectionData }) => {
    if (!sectionData) return <p>Loading report data...</p>;

    if (sectionData.isS2D) {
        return <S2DReportDetails s2dData={sectionData} />;
    } else if (sectionData.isD2S) { // +++ AÑADIR CONDICIÓN PARA D2S +++
        return <D2SReportDetails d2sData={sectionData} />;
    } else {
        return <StandardSectionReportDetails sectionData={sectionData} />;
    }
};

function SectionResultsPage({
    sectionName,
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


const styles = {
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