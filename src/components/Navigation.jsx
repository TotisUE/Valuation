import React from 'react';

function Navigation({
    currentStep,
    totalSteps, // Este es TOTAL_STEPS_QUESTIONS de MultiStepForm
    onPrevious,
    onNext,
    isSubmitting,
    onSaveAndSendLink,
    isSendingLink,
    sendLinkResult,
    currentSectionName, // Sigue siendo útil para otras lógicas si las hubiera
    onGeneratePrompt,   // La prop puede seguir existiendo, pero no la usaremos para mostrar el botón aquí
    sectionsConfig 
}) {
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    // --- LÓGICA PARA MOSTRAR/OCULTAR EL BOTÓN "GENERATE PROMPT" ---
    // MODIFICACIÓN: Simplemente lo ponemos a false para que nunca se muestre aquí.
    // La funcionalidad se ha movido a SectionResultsPage.
    const showGeneratePromptButton = false; 
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
                {/* Botón "Previous" */}
                {currentStep > 0 && (
                    <button
                        type="button"
                        onClick={onPrevious}
                        disabled={isSubmitting || isSendingLink}
                        className="button secondary"
                        style={{ marginRight: 'auto' }} 
                    >
                        Previous
                    </button>
                )}
                
                <div className="center-buttons" style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    justifyContent: isFirstStep ? 'flex-end' : 'center', // Ajuste para primera página
                    flexGrow: 1 // Permite que los botones centrales ocupen espacio
                }}>
                    {/* Botón Guardar y Enviar Link */}
                    {onSaveAndSendLink && (
                        <button
                            type="button"
                            onClick={onSaveAndSendLink}
                            disabled={isSendingLink || isSubmitting}
                            className="button secondary save-send-button" // Puedes darle un estilo específico si quieres
                        >
                            {isSendingLink ? 'Sending Link...' : 'Save & Get Link'}
                        </button>
                    )}

                    {/* Botón "Generate Prompt" - YA NO SE MUESTRA AQUÍ */}
                    {/* {showGeneratePromptButton && (
                        <button
                            type="button"
                            onClick={() => onGeneratePrompt(currentSectionName)}
                            disabled={isSubmitting || isSendingLink}
                            className="button info generate-prompt-button"
                        >
                            Generate Prompt
                        </button>
                    )} */}
                </div>

                {/* Botón "Next" / "Submit" */}
                <button
                    type="button"
                    onClick={onNext}
                    disabled={isSubmitting || isSendingLink}
                    className="button primary"
                    // Si no hay botón "Previous", el "Next" no necesita margen izquierdo automático
                    style={{ marginLeft: currentStep > 0 ? 'auto' : '0' }} 
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