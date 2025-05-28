// src/components/SectionResultsPage.jsx
import React, { useState, useMemo } from 'react';

// -----------------------------------------------------------------------------
// HELPERS E INTERPRETACIONES (Mantener o mover a utils)
// -----------------------------------------------------------------------------
// src/components/SectionResultsPage.jsx

const getS2DInterpretationText = (score, maxScore, type) => {
    const numericScore = Number(score);
    if (isNaN(numericScore)) {
        console.warn(`[getS2DInterpretationText] Invalid score: ${score} for type: ${type}`);
        return "N/A (Invalid Score)";
    }

    let ranges; // Declarar ranges aquí

    if (type === 's2d_process_maturity') {
        ranges = [
            { limit: 48, text: "Excellent - Your Sale to Delivery process is a competitive advantage" },
            { limit: 39, text: "Good - Your process works well but has some improvement opportunities" },
            { limit: 28, text: "Developing - Basic processes exist but significant improvements would drive better results" },
            { limit: 12, text: "Basic - Major improvements needed to create consistent, scalable delivery" },
            { limit: 0,  text: "Critical - Immediate attention required to establish fundamental processes" }
        ];
    } else if (type === 's2d_owner_independence') {
        ranges = [
            { limit: 32, text: "Excellent - Processes run independently with minimal owner involvement" },
            { limit: 24, text: "Good - Owner is appropriately positioned in oversight rather than execution" },
            { limit: 16, text: "Developing - Some delegation exists, but owner remains too involved in execution" },
            { limit: 8,  text: "Concerning - Owner is a critical bottleneck in multiple processes" },
            { limit: 0,  text: "Critical - Business is entirely dependent on owner involvement" }
        ];
    } else if (type === 'd2s_process_maturity') {
        ranges = [
            { limit: 60, text: "Excellent - Your Delivery to Success process is a competitive advantage" },
            { limit: 50, text: "Good - Your process works well but has some improvement opportunities" },
            { limit: 35, text: "Developing - Basic processes exist but significant improvements would drive better results" },
            { limit: 15, text: "Basic - Major improvements needed to create consistent, scalable success" },
            { limit: 0,  text: "Critical - Immediate attention required to establish fundamental processes" }
        ];
    } else if (type === 'd2s_owner_independence') {
        ranges = [
            { limit: 40, text: "Excellent - Processes run independently with minimal owner involvement" },
            { limit: 30, text: "Good - Owner is appropriately positioned in oversight rather than execution" },
            { limit: 20, text: "Developing - Some delegation exists, but owner remains too involved in execution" },
            { limit: 10, text: "Concerning - Owner is a critical bottleneck in multiple processes" },
            { limit: 0,  text: "Critical - Business is entirely dependent on owner involvement" }
        ];
    } else if (type === 'm2l_process_maturity') {
        ranges = [
            { limit: 83, text: "Excellent - Your Market to Lead process is a competitive advantage" },
            { limit: 69, text: "Good - Your process works well but has improvement opportunities" },
            { limit: 49, text: "Developing - Basic processes exist but significant improvements would drive better results" },
            { limit: 25, text: "Basic - Major improvements needed to create consistent, scalable lead generation" },
            { limit: 0,  text: "Critical - Immediate attention required to establish fundamental marketing processes" }
        ];
    } else if (type === 'm2l_owner_independence') {
        ranges = [
            { limit: 56, text: "Excellent - Marketing processes run independently with minimal owner involvement" },
            { limit: 42, text: "Good - Owner is appropriately positioned in oversight rather than execution" },
            { limit: 28, text: "Developing - Some delegation exists, but owner remains too involved in execution" },
            { limit: 14, text: "Concerning - Owner is a critical bottleneck in multiple marketing processes" },
            { limit: 0,  text: "Critical - Marketing is entirely dependent on owner involvement" }
        ];
    } else if (type === 'sub_score') {
        const percentage = maxScore > 0 ? (numericScore / maxScore) * 100 : 0;
        if (percentage >= 75) return "Strong performance in this sub-area.";
        if (percentage >= 50) return "Adequate performance, some opportunities for optimization.";
        return "This sub-area may require focused improvement."; // Este return es correcto para 'sub_score'
    } else {
        console.warn(`[getS2DInterpretationText] Unknown score type: ${type} for score: ${numericScore}`);
        return `N/A (Unknown score type: ${type})`; // Este return es correcto para tipos desconocidos
    }

    // Si llegamos aquí, significa que 'type' era uno de los que definen 'ranges'
    // y no era 'sub_score' ni un tipo desconocido.
    if (ranges && ranges.length > 0) {
        const interpretation = ranges.find(r => numericScore >= r.limit);
        if (interpretation) {
            return interpretation.text;
        } else {
            // Esto no debería suceder si el último limit es 0 y el score es >= 0
            console.warn(`[getS2DInterpretationText] No range found for score ${numericScore} in type ${type}. Falling back to lowest range. Ranges:`, ranges);
            return ranges[ranges.length - 1].text; // Devuelve la interpretación del rango más bajo como fallback
        }
    }

    // Fallback final si algo salió muy mal (no debería alcanzarse)
    console.error(`[getS2DInterpretationText] Logic error. Ranges not defined for a type that should have them: ${type}`);
    return "N/A (Logic Error)";
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

const M2LAssessmentDetails = ({ m2lData }) => {
    // Interpretaciones para los scores principales de M2L
    // Asegúrate de que getS2DInterpretationText (o una nueva función) tenga los rangos para estos types
    const processMaturityInterpretation = useMemo(() =>
        getS2DInterpretationText(m2lData.m2l_processMaturityScore, 98, 'm2l_process_maturity'), // Necesitas este type en getS2DInterpretationText
        [m2lData.m2l_processMaturityScore]
    );
    const ownerIndependenceInterpretation = useMemo(() =>
        getS2DInterpretationText(m2lData.m2l_ownerIndependenceScore, 70, 'm2l_owner_independence'), // Necesitas este type
        [m2lData.m2l_ownerIndependenceScore]
    );

    return (
        <div className="m2l-assessment-details">
            <h3 style={styles.pageSubHeader}>Market to Lead Process Assessment</h3>

            <div style={styles.sectionBox}>
                <h4>Overall M2L Scores</h4>
                <div style={styles.scoreItem}>
                    <p><strong>Process Maturity Score:</strong> {m2lData.m2l_processMaturityScore} / 98</p>
                    <p style={styles.interpretationText}><em>{processMaturityInterpretation}</em></p>
                </div>
                <div style={styles.scoreItem}>
                    <p><strong>Owner Independence Score:</strong> {m2lData.m2l_ownerIndependenceScore} / 70</p>
                    <p style={styles.interpretationText}><em>{ownerIndependenceInterpretation}</em></p>
                </div>
                <div style={styles.scoreItem}>
                    <p><strong>Channel Diversification:</strong> {m2lData.m2l_activeChannelsCount} active channel(s)</p>
                    <p style={styles.interpretationText}><em>{m2lData.m2l_channelDiversificationInterpretation}</em></p>
                </div>
                <div style={styles.scoreItem}>
                    <p><strong>Unit Economics Health (LTV:CAC Ratio):</strong> {typeof m2lData.m2l_ltvToCacRatio === 'number' ? m2lData.m2l_ltvToCacRatio.toFixed(2) : 'N/A'}</p>
                    <p style={styles.interpretationText}><em>{m2lData.m2l_unitEconomicsHealthInterpretation}</em></p>
                </div>
            </div>
            
           {m2lData.m2l_processAssessmentDetails && m2lData.m2l_processAssessmentDetails.length > 0 && (
                <div style={styles.sectionBox}>
                    <h4>Detailed Process Assessment Breakdown</h4>
                    {m2lData.m2l_processAssessmentDetails.map((item, index) => (
                        <div key={item.id || `m2l-pa-${index}`} style={{ ...styles.detailedItemS2D, marginBottom: '15px' }}> {/* Reusar estilos o crear nuevos */}
                            <p style={styles.questionTextS2D}><strong>{item.processQuestionText}</strong></p>
                            <p style={styles.answerTextS2D}>Your Answer: "{item.processAnswerText}" (Score: {item.processAnswerScore})</p>
                            
                            {item.ownerQuestionText && ( // Mostrar solo si hay pregunta de owner
                                <>
                                    <p style={{...styles.questionTextS2D, marginTop: '8px', color: '#555'}}>{item.ownerQuestionText}</p>
                                    <p style={styles.answerTextS2D}>Owner Involvement: "{item.ownerAnswerText}" (Score: {item.ownerAnswerScore})</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const M2LReportDetails = ({ m2lData }) => {
    // Obtener interpretaciones para los scores principales de M2L
    const processMaturityInterpretation = useMemo(() =>
        getS2DInterpretationText(m2lData.m2l_processMaturityScore, 98, 'm2l_process_maturity'),
        [m2lData.m2l_processMaturityScore]
    );
    const ownerIndependenceInterpretation = useMemo(() =>
        getS2DInterpretationText(m2lData.m2l_ownerIndependenceScore, 70, 'm2l_owner_independence'),
        [m2lData.m2l_ownerIndependenceScore]
    );

    const {
        m2l_ownerStrategicPositioning,
        m2l_channelDiversificationInterpretation,
        m2l_unitEconomicsHealthInterpretation,
        m2l_activeChannelsCount,
        m2l_ltvToCacRatio,
        m2l_processMaturityScore, 
        m2l_ownerIndependenceScore 
    } = m2lData;

    return (
        <div className="m2l-report-details">
            <h3 style={styles.pageSubHeader}>Report for: Market to Lead Process Assessment</h3>

            {/* === SECCIÓN DE EXECUTIVE SUMMARY === */}
            <div style={styles.sectionBox}>
                <h4>Executive Summary (Market to Lead)</h4>
                <p>
                    Your Market to Lead process assessment indicates a
                    <strong> "{processMaturityInterpretation.toLowerCase().split(" - ")[0]}"</strong> level of process maturity.
                    Owner involvement in marketing processes is currently
                    <strong> "{ownerIndependenceInterpretation.toLowerCase().split(" - ")[0]}"</strong>.
                </p>
                <p>
                    Channel diversification is assessed as: <em>{m2l_channelDiversificationInterpretation}</em> (with {m2l_activeChannelsCount} active channel(s) identified).
                    The Unit Economics Health, based on an LTV:CAC ratio of {typeof m2l_ltvToCacRatio === 'number' ? m2l_ltvToCacRatio.toFixed(2) : 'N/A'}, is considered: <em>{m2l_unitEconomicsHealthInterpretation}</em>.
                </p>
            </div>

            {/* === SECCIÓN DE KEY FINDINGS & STRATEGIC POSITIONING === */}
            <div style={styles.sectionBox}>
                <h4>Key Findings & Strategic Positioning (M2L)</h4>
                <h5>Process Maturity (M2L):</h5>
                <p><em>{processMaturityInterpretation}</em></p>

                <h5 style={{ marginTop: '15px' }}>Owner Independence (M2L):</h5>
                <p><em>{ownerIndependenceInterpretation}</em></p>

                {m2l_ownerStrategicPositioning && (
                    <>
                        <h5 style={{ marginTop: '15px' }}>Owner Strategic Positioning (M2L):</h5>
                        <p>
                            <strong>Areas for strategic oversight (delegation opportunities):</strong><br />
                            {m2l_ownerStrategicPositioning.areasForDelegation.length > 0
                                ? m2l_ownerStrategicPositioning.areasForDelegation.join(', ')
                                : "None specifically identified from the 14 process areas. Review marketing tasks for delegation potential."}
                        </p>
                        <p>
                            <strong>Areas for active management (where process is weak & owner not involved):</strong><br />
                            {m2l_ownerStrategicPositioning.areasForActiveManagement.length > 0
                                ? m2l_ownerStrategicPositioning.areasForActiveManagement.join(', ')
                                : "None specifically identified. Ensure key marketing processes are not neglected."}
                        </p>
                    </>
                )}
            </div>
            
            {/* === SECCIÓN DE FOCUS AREAS & NEXT STEPS === */}
            <div style={styles.sectionBox}>
                <h4>Focus Areas & Next Steps (M2L - Conceptual)</h4>
                <ul>
                    {m2l_processMaturityScore < 49 && ( 
                        <li>Prioritize improving the 2-3 lowest-scoring areas from the 14 marketing process assessments.</li>
                    )}
                    {m2l_ownerIndependenceScore < 28 && ( 
                        <li>Identify specific marketing tasks currently handled by the owner that can be delegated or automated.</li>
                    )}
                    {m2l_activeChannelsCount < 3 && (
                        <li>Explore opportunities to diversify marketing channels to reduce risk and reach new audiences.</li>
                    )}
                    {(typeof m2l_ltvToCacRatio === 'number' && m2l_ltvToCacRatio < 1.5 && m2l_ltvToCacRatio !== Infinity) && (
                        <li>Urgently review marketing spend and customer value as unit economics may be unsustainable.</li>
                    )}
                    <li>Consider using the "Generate Prompt" feature for AI-driven suggestions tailored to your specific M2L assessment results.</li>
                </ul>
            </div>
        </div>
    );
};

// --- ASSESSMENT TAB DETAILS ---
const S2DAssessmentDetails = ({ s2dData }) => { 
    const processMaturityInterpretation = useMemo(() => {
        return getS2DInterpretationText(s2dData.s2d_processMaturityScore, 56, 's2d_process_maturity');
    }, [s2dData.s2d_processMaturityScore]);

    const ownerIndependenceInterpretation = useMemo(() => {
        return getS2DInterpretationText(s2dData.s2d_ownerIndependenceScore, 40, 's2d_owner_independence');
    }, [s2dData.s2d_ownerIndependenceScore]);

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
        getS2DInterpretationText(s2dData.s2d_processMaturityScore, 56, 's2d_process_maturity'),
        [s2dData.s2d_processMaturityScore]
    );
    const ownerIndependenceInterpretation = useMemo(() =>
        getS2DInterpretationText(s2dData.s2d_ownerIndependenceScore, 40, 's2d_owner_independence'),
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

// Actualizar AssessmentTabContent
const AssessmentTabContent = ({ sectionData }) => {
    if (!sectionData) return <p>Loading assessment data...</p>;

    if (sectionData.isS2D) {
        return <S2DAssessmentDetails s2dData={sectionData} />;
    } else if (sectionData.isD2S) {
        return <D2SAssessmentDetails d2sData={sectionData} />;
    } else if (sectionData.isM2L) { // <--- AÑADIR ESTA CONDICIÓN
        return <M2LAssessmentDetails m2lData={sectionData} />;
    } else {
        return <StandardSectionAssessmentDetails sectionData={sectionData} />;
    }
};

const ReportTabContent = ({ sectionData }) => { // sectionName ya no es necesario aquí
    if (!sectionData) return <p>Loading report data...</p>;

    if (sectionData.isS2D) {
        return <S2DReportDetails s2dData={sectionData} />;
    } else if (sectionData.isD2S) { 
        return <D2SReportDetails d2sData={sectionData} />;
    } else if (sectionData.isM2L) { // <--- AÑADIR ESTA CONDICIÓN
        return <M2LReportDetails m2lData={sectionData} />;
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