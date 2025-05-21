// src/pages/S2DResultsDisplayPage.jsx
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

// Función para obtener la interpretación del score (ajusta los rangos si es necesario)
// (Esta función podría vivir en un archivo utils/scoringHelpers.js)
const getInterpretationText = (score, maxScore, type) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    let ranges;
    // Máximos ajustados para 8 preguntas principales
    const processMax = 8 * 7; // 56
    const ownerMax = 8 * 5;   // 40

    if (type === 'process_maturity') {
        ranges = [
            { limit: processMax * 0.85, text: "Excellent - Your Sale to Delivery process is a competitive advantage" },
            { limit: processMax * 0.70, text: "Good - Your process works well but has some improvement opportunities" },
            { limit: processMax * 0.50, text: "Developing - Basic processes exist but significant improvements would drive better results" },
            { limit: processMax * 0.21, text: "Basic - Major improvements needed to create consistent, scalable delivery" },
            { limit: 0, text: "Critical - Immediate attention required to establish fundamental processes" }
        ];
    } else if (type === 'owner_independence') {
        ranges = [
            { limit: ownerMax * 0.80, text: "Excellent - Processes run independently with minimal owner involvement" },
            { limit: ownerMax * 0.60, text: "Good - Owner is appropriately positioned in oversight rather than execution" },
            { limit: ownerMax * 0.40, text: "Developing - Some delegation exists, but owner remains too involved in execution" },
            { limit: ownerMax * 0.20, text: "Concerning - Owner is a critical bottleneck in multiple processes" },
            { limit: 0, text: "Critical - Business is entirely dependent on owner involvement" }
        ];
    } else {
        return "N/A"; // Para sub-scores que no tienen esta interpretación de texto
    }
    const interpretation = ranges.find(r => score >= r.limit);
    return interpretation ? interpretation.text : "N/A";
};


function S2DResultsDisplayPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const s2dResults = location.state?.s2dAssessmentData; // Obtener datos pasados por navigate

    if (!s2dResults) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>No assessment data found.</h2>
                <p>Please complete a Sale to Delivery assessment first.</p>
                <Link to="/">Go to Main Form</Link>
            </div>
        );
    }

    const {
        s2d_productName,
        s2d_productDescription,
        s2d_productRevenue,
        processMaturityScore,
        ownerIndependenceScore,
        clientExperienceOptimizationScore,
        resourceAllocationEffectivenessScore,
        detailedAnswers
    } = s2dResults;
    
    const processMaxAdjusted = 8 * 7; // 56
    const ownerMaxAdjusted = 8 * 5;   // 40
    const subScoreMax = 21; // Para Client Experience y Resource Allocation

    return (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #007bff', paddingBottom: '15px' }}>
                <h1>Sale to Delivery Process Assessment Results</h1>
                <h2>For: {s2d_productName || "N/A"}</h2>
            </header>

            <section style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <h3>Product/Service Overview</h3>
                <p><strong>Description:</strong> {s2d_productDescription || "N/A"}</p>
                <p><strong>Annual Revenue:</strong> ${s2d_productRevenue?.toLocaleString() || "N/A"}</p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h3>Overall Scores</h3>
                <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                    <strong>Process Maturity Score:</strong> {processMaturityScore} / {processMaxAdjusted}
                    <p style={{ fontSize: '0.9em', color: '#555' }}><em>{getInterpretationText(processMaturityScore, processMaxAdjusted, 'process_maturity')}</em></p>
                </div>
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                    <strong>Owner Independence Score:</strong> {ownerIndependenceScore} / {ownerMaxAdjusted}
                    <p style={{ fontSize: '0.9em', color: '#555' }}><em>{getInterpretationText(ownerIndependenceScore, ownerMaxAdjusted, 'owner_independence')}</em></p>
                </div>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h3>Detailed Breakdown</h3>
                <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#e9f5ff', borderRadius: '5px' }}>
                    <h4>Client Experience Optimization: {clientExperienceOptimizationScore} / {subScoreMax} points</h4>
                    {detailedAnswers?.clientExperience && Object.keys(detailedAnswers.clientExperience).map(key => {
                        const item = detailedAnswers.clientExperience[key];
                        return (
                            <div key={key} style={{ marginLeft: '20px', marginTop: '10px' }}>
                                <p style={{margin: '5px 0'}}><strong>{item.questionText.substring(0, item.questionText.indexOf(':') + 1)}</strong></p>
                                <p style={{margin: '5px 0 10px 15px', fontStyle: 'italic'}}>Your Answer: "{item.answerText}" (Score: {item.score})</p>
                            </div>
                        );
                    })}
                </div>
                <div style={{ padding: '15px', backgroundColor: '#e9f5ff', borderRadius: '5px' }}>
                    <h4>Resource Allocation Effectiveness: {resourceAllocationEffectivenessScore} / {subScoreMax} points</h4>
                    {detailedAnswers?.resourceAllocation && Object.keys(detailedAnswers.resourceAllocation).map(key => {
                        const item = detailedAnswers.resourceAllocation[key];
                        return (
                            <div key={key} style={{ marginLeft: '20px', marginTop: '10px' }}>
                                <p style={{margin: '5px 0'}}><strong>{item.questionText.substring(0, item.questionText.indexOf(':') + 1)}</strong></p>
                                <p style={{margin: '5px 0 10px 15px', fontStyle: 'italic'}}>Your Answer: "{item.answerText}" (Score: {item.score})</p>
                            </div>
                        );
                    })}
                </div>
            </section>
            
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button 
                    onClick={() => navigate('/')} // Volver al formulario principal
                    style={{ padding: '10px 20px', fontSize: '1em', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
                >
                    Back to Main Dashboard
                </button>
                {/* Aquí podrías añadir el botón "CREATE FOR AN ADDITIONAL PRODUCT/SERVICE" si quieres
                    que desde aquí puedan iniciar otra evaluación S2D.
                    <button onClick={() => navigate('/add-product-service')} style={{ marginLeft: '10px', ... }}>
                        Assess Another Product/Service
                    </button>
                */}
            </div>
        </div>
    );
}

export default S2DResultsDisplayPage;