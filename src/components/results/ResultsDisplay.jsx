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
// El componente S2DResultsSection ya no es necesario aquí.
// import S2DResultsSection from './S2DResultsSection'; 

// Las importaciones para generar el prompt ya no son necesarias.
// import { getSaleToDeliveryProcessQuestions } from '../../sections-data/saleToDeliveryQuestions';
// import { sections as allAppSections } from '../../questions';


const ALL_TABS_CONFIG = [
    { id: 'snapshot', label: 'Valuation Summary', componentBuilder: (props) => <ValuationSnapshot {...props} /> },
    { id: 'scores', label: 'Score Detail', componentBuilder: (props) => <ScoreDetails scores={props.scores} /> },
    { id: 'roadmap', label: 'Roadmap', componentBuilder: (props) => <RoadmapSection roadmap={props.roadmap} stage={props.stage} /> },
    { id: 'discuss', label: 'Discuss Your Results', componentBuilder: (props) => <DiscussTabContent calendlyLink={props.consultantCalendlyLink} userEmail={props.userEmail} /> },
];

// La función para generar el prompt S2D ya no es necesaria y se ha eliminado.

function ResultsDisplay({
    calculationResult,
    onStartOver,
    onBackToEdit,
    consultantCalendlyLink,
    userEmail,
    formData 
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
        scores = {}, 
        roadmap = [], scorePercentage = 0,
    } = calculationResult; 

    const visibleTabs = useMemo(() => ALL_TABS_CONFIG, []);
    const [activeTab, setActiveTab] = useState(() => visibleTabs.length > 0 ? visibleTabs[0].id : '');
    
    useEffect(() => {
        if (visibleTabs.length > 0 && !visibleTabs.find(tab => tab.id === activeTab)) {
            setActiveTab(visibleTabs[0].id);
        } else if (visibleTabs.length === 0 && activeTab !== '') {
            setActiveTab(''); 
        }
    }, [visibleTabs, activeTab]);

    const handleDownloadPdfWithChart = async () => {
        if (isGeneratingPdf || !hiddenChartRef.current) {
            console.log("PDF generation already in progress or ref is not available.");
            return;
        }
        
        setIsGeneratingPdf(true);
        console.log("Starting PDF generation...");

        try {
            // 1. Generar la imagen del gráfico oculto
            const chartImage = await toJpeg(hiddenChartRef.current, { 
                quality: 0.95, 
                backgroundColor: '#ffffff' 
            });
            console.log("Chart image generated successfully.");

            // 2. Crear la instancia del documento PDF con los datos y la imagen
            const pdfBlob = await pdf(
                <ValuationReportPDF
                    calculationResult={calculationResult}
                    formData={formData}
                    chartImage={chartImage}
                />
            ).toBlob();
            console.log("PDF blob created.");

            // 3. Crear un enlace temporal y simular un clic para descargar el archivo
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Valuation_Report_${formData?.businessName || 'Business'}.pdf`;
            document.body.appendChild(link);
            link.click();
            
            // 4. Limpiar
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log("PDF download triggered.");

        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("Sorry, there was an error creating the PDF report.");
        } finally {
            setIsGeneratingPdf(false);
            console.log("PDF generation process finished.");
        }
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

            {/* SECCIÓN DE RESULTADOS S2D ELIMINADA */}

            <div ref={hiddenChartRef} style={styles.hiddenChart}>
                {scores && Object.keys(scores).length > 0 ? <ScoreRadarChart scores={scores} /> : <div />}
            </div>
            <p style={styles.disclaimer}>
                Disclaimer: This is a preliminary, automated estimate for informational purposes only...
            </p>
            <div className="results-actions-footer" style={styles.actionsFooter}>
                <ResultsCTA onDownloadClick={handleDownloadPdfWithChart} isLoading={isGeneratingPdf} />

                {/* BOTONES "GENERATE PROMPT" Y "ASSESS ANOTHER" ELIMINADOS */}
                
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
styles.actionButton['.start-over-button'] = { backgroundColor: '#6c757d' };
styles.actionButton['.back-to-edit-button'] = { backgroundColor: '#ffc107', color: '#212529' };

export default ResultsDisplay;