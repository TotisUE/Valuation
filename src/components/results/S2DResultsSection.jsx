// src/components/results/S2DResultsSection.jsx
import React from 'react';

const getS2DInterpretationText = (score, maxScore, type) => {
    // Máximos ajustados para 8 preguntas principales S2D
    const processMax = 8 * 7; // 56
    const ownerMax = 8 * 5;   // 40
    let currentMax = maxScore; 

    let ranges;
    if (type === 'process_maturity') {
        currentMax = processMax; // Asegurar que use el máximo correcto para el cálculo de %
        ranges = [ // Los límites deberían estar en orden descendente de score para que find funcione correctamente
            { limit: currentMax * 0.85, text: "Excellent - Your Sale to Delivery process is a competitive advantage" }, // 47.6+
            { limit: currentMax * 0.70, text: "Good - Your process works well but has some improvement opportunities" },   // 39.2 - 47.5
            { limit: currentMax * 0.50, text: "Developing - Basic processes exist but significant improvements would drive better results" }, // 28 - 39.1
            { limit: currentMax * 0.21, text: "Basic - Major improvements needed to create consistent, scalable delivery" },  // 11.76 - 27.9
            { limit: 0, text: "Critical - Immediate attention required to establish fundamental processes" }        // 0 - 11.75
        ];
    } else if (type === 'owner_independence') {
        currentMax = ownerMax; // Asegurar que use el máximo correcto
        ranges = [
            { limit: currentMax * 0.80, text: "Excellent - Processes run independently with minimal owner involvement" }, // 32+
            { limit: currentMax * 0.60, text: "Good - Owner is appropriately positioned in oversight rather than execution" }, // 24 - 31
            { limit: currentMax * 0.40, text: "Developing - Some delegation exists, but owner remains too involved in execution" }, // 16 - 23
            { limit: currentMax * 0.20, text: "Concerning - Owner is a critical bottleneck in multiple processes" }, // 8 - 15
            { limit: 0, text: "Critical - Business is entirely dependent on owner involvement" } // 0 - 7
        ];
    } else {
        return ""; 
    }
    // Asegurar que score sea un número para la comparación
    const numericScore = Number(score);
    if (isNaN(numericScore)) return "N/A (Invalid Score)";

    const interpretation = ranges.find(r => numericScore >= r.limit);
    return interpretation ? interpretation.text : "N/A (Range not found)";
};

function S2DResultsSection({ s2dResults }) {
    if (!s2dResults || !s2dResults.s2d_productName || s2dResults.s2d_productName === "N/A") {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#777', border: '1px dashed #ccc', margin: '20px 0' }}>
                <p>Sale to Delivery Process Assessment section was not completed or data is unavailable.</p>
            </div>
        );
    }

    const {
        s2d_productName,
        s2d_productDescription,
        s2d_productRevenue,
        s2d_processMaturityScore,
        s2d_ownerIndependenceScore,
        s2d_clientExperienceOptimizationScore,
        s2d_resourceAllocationEffectivenessScore,
        s2d_detailedAnswers
    } = s2dResults;

    const processMaxAdjusted = 8 * 7; // 56
    const ownerMaxAdjusted = 8 * 5;   // 40
    const subScoreMax = 21; // Para Client Experience y Resource Allocation (3 preguntas * 7 pts)

    return (
        <div className="s2d-results-section" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #007bff', fontFamily: 'Arial, sans-serif' }}>
            <h2 style={{ textAlign: 'center', color: '#007bff', marginBottom: '20px' }}>
                Sale to Delivery Process Assessment: {s2d_productName}
            </h2>

            <section style={styles.s2dSectionBox}>
                <h3 style={styles.s2dSubHeader}>Product/Service Overview</h3>
                <p><strong>Description:</strong> {s2d_productDescription || "N/A"}</p>
                <p><strong>Annual Revenue:</strong> ${s2d_productRevenue?.toLocaleString() || "N/A"}</p>
            </section>

            <section style={styles.s2dSectionBox}>
                <h3 style={styles.s2dSubHeader}>Overall S2D Scores</h3>
                <div style={styles.s2dScoreItem}>
                    <strong>Process Maturity Score:</strong> {s2d_processMaturityScore} / {processMaxAdjusted}
                    <p style={styles.s2dInterpretation}><em>{getS2DInterpretationText(s2d_processMaturityScore, processMaxAdjusted, 'process_maturity')}</em></p>
                </div>
                <div style={styles.s2dScoreItem}>
                    <strong>Owner Independence Score:</strong> {s2d_ownerIndependenceScore} / {ownerMaxAdjusted}
                    <p style={styles.s2dInterpretation}><em>{getS2DInterpretationText(s2d_ownerIndependenceScore, ownerMaxAdjusted, 'owner_independence')}</em></p>
                </div>
            </section>

            <section style={styles.s2dSectionBox}>
                <h3 style={styles.s2dSubHeader}>Detailed Breakdown</h3>
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={styles.s2dCategoryTitle}>Client Experience Optimization: {s2d_clientExperienceOptimizationScore} / {subScoreMax} points</h4>
                    {s2d_detailedAnswers?.clientExperience && Object.keys(s2d_detailedAnswers.clientExperience).sort((a,b) => a.localeCompare(b, undefined, {numeric: true})).map(qKey => {
                        const item = s2d_detailedAnswers.clientExperience[qKey];
                        if (!item) return null;
                        return (
                            <div key={`ce-${qKey}`} style={styles.s2dDetailedItem}>
                                <p style={styles.s2dQuestionText}><strong>{item.questionText ? item.questionText.substring(0, item.questionText.indexOf(':') + 1) : `Question ${qKey}`}</strong></p>
                                <p style={styles.s2dAnswerText}>Your Answer: "{item.answerText}" (Score: {item.score})</p>
                            </div>
                        );
                    })}
                </div>
                <div>
                    <h4 style={styles.s2dCategoryTitle}>Resource Allocation Effectiveness: {s2d_resourceAllocationEffectivenessScore} / {subScoreMax} points</h4>
                    {s2d_detailedAnswers?.resourceAllocation && Object.keys(s2d_detailedAnswers.resourceAllocation).sort((a,b) => a.localeCompare(b, undefined, {numeric: true})).map(qKey => {
                        const item = s2d_detailedAnswers.resourceAllocation[qKey];
                        if (!item) return null;
                        return (
                            <div key={`ra-${qKey}`} style={styles.s2dDetailedItem}>
                                <p style={styles.s2dQuestionText}><strong>{item.questionText ? item.questionText.substring(0, item.questionText.indexOf(':') + 1) : `Question ${qKey}`}</strong></p>
                                <p style={styles.s2dAnswerText}>Your Answer: "{item.answerText}" (Score: {item.score})</p>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

const styles = {
    s2dSectionBox: { marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' },
    s2dSubHeader: { marginTop: '0', marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px', fontSize: '1.3em', color: '#333' },
    s2dScoreItem: { marginBottom: '15px', paddingLeft: '10px' },
    s2dInterpretation: { fontSize: '0.95em', color: '#555', margin: '5px 0 0 0', lineHeight: '1.4' },
    s2dCategoryTitle: { fontSize: '1.15em', color: '#0056b3', marginBottom: '10px'},
    s2dDetailedItem: { marginLeft: '10px', marginBottom: '12px', paddingLeft: '10px', borderLeft: '3px solid #007bff' },
    s2dQuestionText: { margin: '0 0 3px 0', fontWeight: '500', color: '#222' },
    s2dAnswerText: { margin: '0 0 0 10px', fontStyle: 'italic', color: '#454545' }
};

export default S2DResultsSection;