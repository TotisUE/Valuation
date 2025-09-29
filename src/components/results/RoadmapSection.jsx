// src/components/results/RoadmapSection.jsx
import React from 'react';

const styles = {
    container: {
        padding: '10px',
    },
    title: {
        fontSize: '1.3em',
        fontWeight: 'bold',
        marginBottom: '15px',
        color: '#333',
        borderBottom: '1px solid #eee',
        paddingBottom: '8px',
    },
    introText: {
        fontSize: '1em',
        color: '#444',
        marginBottom: '20px',
        lineHeight: '1.4',
    },
    roadmapItem: {
        marginBottom: '25px',
        paddingBottom: '15px',
        borderBottom: '1px dashed #eee',
    },
    itemTitleContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '10px',
    },
    itemTitle: {
        fontSize: '1.1em',
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginRight: '10px',
    },
    itemScore: {
        fontSize: '0.9em',
        color: '#666',
        whiteSpace: 'nowrap',
    },
    itemDescription: {
        fontSize: '1em',
        color: '#333',
        lineHeight: '1.5',
        paddingLeft: '10px',
    },
    finalLinkContainer: {
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #ccc',
        textAlign: 'center',
    },
    finalLink: {
        fontSize: '1.1em',
        fontWeight: 'bold',
        color: '#007bff',
        textDecoration: 'none',
    },
};

// Mapa para los enlaces dinámicos
const stageToUrlMap = {
    "Startup": "https://www.acquisition.com/training/stabilize",
    "Mature Start-up": "https://www.acquisition.com/training/stabilize",
    "Grow-up": "https://www.acquisition.com/training/value-acceleration",
    "Mature Grow-up": "https://www.acquisition.com/training/value-acceleration",
    "Scale Up": "https://www.acquisition.com/training/scale",
    "Mature Scaleup": "https://www.acquisition.com/training/scale",
    "Pre-Revenue / Negative EBITDA": "https://www.acquisition.com/training/stabilize",
};

function RoadmapSection({ roadmap = [], stage }) {

    const fallbackUrl = 'https://www.acquisition.com/training';
    const roadmapTargetUrl = stage ? (stageToUrlMap[stage] || fallbackUrl) : fallbackUrl;

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Personalized Improvement Roadmap</h3>
            {roadmap && roadmap.length > 0 ? (
                <div className="roadmap-section-inner">
                    <p style={styles.introText}>
                        Improving specific operational areas can significantly increase your business's value and attractiveness. This roadmap highlights your top <strong>{roadmap.length}</strong> opportunities based on your scores:
                    </p>
                    {roadmap.map((item, index) => (
                        <div key={item?.areaName || index} style={styles.roadmapItem}>
                            <div style={styles.itemTitleContainer}>
                                <span style={styles.itemTitle}>{index + 1}. {item?.title ?? 'N/A'}</span>
                                <span style={styles.itemScore}>({item?.areaScore ?? 0}/{item?.maxScore ?? 'N/A'} points)</span>
                            </div>
                            <p style={styles.itemDescription}>{item?.description ?? 'No details available.'}</p>
                        </div>
                    ))}
                    <div style={styles.finalLinkContainer}>
                        <a
                            href={roadmapTargetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.finalLink}
                        >
                            {`-> Access the "${stage}" Training Section on Acquisition.com for Detailed Guidance`}
                        </a>
                    </div>
                </div>
            ) : (
                <p style={styles.introText}>Your scores indicate a relatively balanced business or specific roadmap steps could not be determined.</p>
            )}
        </div>
    );
}

export default RoadmapSection;