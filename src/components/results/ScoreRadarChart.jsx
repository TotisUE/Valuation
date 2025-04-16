// src/components/results/ScoreRadarChart.jsx
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ScoringAreas } from '../../scoringAreas';

const getMaxScore = (areaName) => {
    if (areaName === ScoringAreas.MARKET) return 25;
    return 20;
};

function ScoreRadarChart({ scores }) {
    // Quitamos el console.log de "prueba simple"
    // console.log('ScoreRadarChart RENDERIZANDO (prueba simple)');

    if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0) {
        return <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Score data not available for chart.</div>;
    }

    const chartData = Object.values(ScoringAreas)
        .map(areaKey => {
            const scoreValue = scores[areaKey] ?? 0;
            const maxScore = getMaxScore(areaKey);
            return {
                subject: areaKey,
                score: scoreValue,
                fullMark: maxScore,
            };
        })
        .filter(item => item.fullMark > 0);

     if (chartData.length === 0) {
         return <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No valid score data to display chart.</div>;
     }

     // Quitamos el log de "Datos finales" también, ya sabemos que funcionan
     // console.log('--- Datos finales para Recharts Radar:', JSON.stringify(chartData, null, 2));

    return (
        <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 25]} tickCount={6} />
                <Radar name="Your Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip formatter={(value, name, props) => [`${value} / ${props.payload.fullMark}`, name]} />
                {/* <Legend /> */}
            </RadarChart>
        </ResponsiveContainer>
    );
}

export default ScoreRadarChart;