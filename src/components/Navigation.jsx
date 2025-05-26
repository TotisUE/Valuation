import React from 'react';

function Navigation({
    currentStep,
    totalSteps,
    onPrevious,
    onNext,
    isSubmitting,
    onSaveAndSendLink,
    isSendingLink,
    sendLinkResult,
    // --- NUEVAS PROPS AÑADIDAS ---
    currentSectionName,
    onGeneratePrompt,
    sectionsConfig // Array con todos los nombres de las secciones
}) {
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    // --- LÓGICA PARA MOSTRAR/OCULTAR EL BOTÓN "GENERATE PROMPT" ---
    let showGeneratePromptButton = false;
    if (onGeneratePrompt && sectionsConfig && sectionsConfig.length > 0) {
        const firstSectionName = sectionsConfig[0]; // Ej: "Your Profile"
        const lastSectionName = sectionsConfig[sectionsConfig.length - 1]; // Ej: "Your Financials & Industry"
        
        // No mostrar en la primera ni en la última sección
        if (currentSectionName !== firstSectionName && currentSectionName !== lastSectionName) {
            showGeneratePromptButton = true;
        }
    }
    // -------------------------------------------------------------

    return (
        <div className="navigation-controls">
             {/* Feedback del envío del link */}
             {sendLinkResult?.message && (
                 <div className={`send-link-feedback ${sendLinkResult.status}`}>
                     {sendLinkResult.message}
                 </div>
             )}

             <div className="button-group">
                {/* Botón "Previous" movido a la izquierda del todo */}
                {currentStep > 0 && (
                    <button
                        type="button"
                        onClick={onPrevious}
                        disabled={isSubmitting || isSendingLink}
                        className="button secondary"
                        style={{ marginRight: 'auto' }} // Empuja este botón a la izquierda
                    >
                        Previous
                    </button>
                )}
                
                {/* Contenedor para botones centrales (si los hay) */}
                <div className="center-buttons" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexGrow: isFirstStep ? 1 : 0 }}>
                    {/* Botón Guardar y Enviar Link */}
                    {onSaveAndSendLink && ( // Mostrar siempre si la función existe
                        <button
                            type="button"
                            onClick={onSaveAndSendLink}
                            disabled={isSendingLink || isSubmitting}
                            className="button secondary save-send-button"
                        >
                            {isSendingLink ? 'Sending Link...' : 'Save & Get Link'}
                        </button>
                    )}

                    {/* --- NUEVO BOTÓN "GENERAR PROMPT" --- */}
                    {showGeneratePromptButton && (
                        <button
                            type="button"
                            onClick={() => onGeneratePrompt(currentSectionName)} // Pasa el nombre de la sección actual
                            disabled={isSubmitting || isSendingLink}
                            className="button info generate-prompt-button" // Nueva clase para estilo
                        >
                            Generate Prompt
                        </button>
                    )}
                    {/* --- FIN NUEVO BOTÓN --- */}
                </div>

                {/* Botón "Next" / "Submit" a la derecha del todo */}
                <button
                    type="button"
                    onClick={onNext}
                    disabled={isSubmitting || isSendingLink}
                    className="button primary"
                    style={{ marginLeft: 'auto' }} // Empuja este botón a la derecha
                >
                    {isSubmitting ? 'Submitting...' : (isLastStep ? 'View Results & Submit' : 'Next')}
                </button>
             </div>

             {/* Estilos (añadir .info y .generate-prompt-button si es necesario) */}
             <style jsx>{`
                .navigation-controls {
                    margin-top: 2rem;
                    border-top: 1px solid #eee;
                    padding-top: 1rem;
                }
                .send-link-feedback {
                    margin-bottom: 1rem;
                    padding: 0.5rem;
                    border-radius: 4px;
                    text-align: center;
                }
                .send-link-feedback.success {
                    background-color: #e6ffed;
                    color: #006400;
                    border: 1px solid #b7ebc0;
                }
                .send-link-feedback.error {
                    background-color: #fff0f0;
                    color: #d8000c;
                    border: 1px solid #ffbaba;
                }
                .button-group {
                    display: flex;
                    justify-content: flex-end; /* Alinea Previous/Next a la derecha */
                    align-items: center;
                }
                .button {
                    padding: 0.8rem 1.5rem;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin-left: 0.5rem; /* Espacio entre botones */
                    transition: background-color 0.2s ease;
                }
                .button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .button.primary {
                    background-color: #007bff;
                    color: white;
                }
                .button.primary:hover:not(:disabled) {
                    background-color: #0056b3;
                }
                .button.secondary {
                    background-color: #6c757d;
                    color: white;
                }
                .button.secondary:hover:not(:disabled) {
                    background-color: #5a6268;
                }
                .save-send-button { /* Estilo específico si quieres */
                   background-color: #ffc107; /* Amarillo ejemplo */
                   color: #212529;
                }
                .save-send-button:hover:not(:disabled) {
                    background-color: #e0a800;
                }
             .button.info { /* Nuevo estilo para el botón de prompt */
                    background-color: #17a2b8; /* Color cian ejemplo */
                    color: white;
                }
                .button.info:hover:not(:disabled) {
                    background-color: #138496;
                }

             `}</style>
        </div>
    );
}

export default Navigation;