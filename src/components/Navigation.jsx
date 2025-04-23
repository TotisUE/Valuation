// src/components/Navigation.jsx (Ejemplo)
import React from 'react';

function Navigation({
    currentStep,
    totalSteps,
    onPrevious,
    onNext,
    isSubmitting,
    // --- Nuevas Props ---
    onSaveAndSendLink,
    isSendingLink,
    sendLinkResult // Para mostrar feedback
}) {
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    return (
        <div className="navigation-controls">
             {/* Feedback del envío del link */}
             {sendLinkResult?.message && (
                 <div className={`send-link-feedback ${sendLinkResult.status}`}>
                     {sendLinkResult.message}
                 </div>
             )}

             <div className="button-group">
                {/* Botón Nuevo: Guardar y Enviar Link */}
                {/* Mostrar siempre excepto quizás en el último paso? O siempre? */}
                {/* { !isLastStep && ( // Condición opcional para no mostrar en el último paso */}
                <button
                    type="button"
                    onClick={onSaveAndSendLink}
                    disabled={isSendingLink || isSubmitting} // Deshabilitar si ya está enviando o submitiendo
                    className="button secondary save-send-button" // Estilo diferente
                    style={{ marginRight: 'auto' }} // Ejemplo para empujar a la izquierda
                >
                    {isSendingLink ? 'Sending Link...' : 'Save & Send Link'}
                </button>
                {/* )} */}


                {/* Botones Existentes */}
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={isFirstStep || isSubmitting || isSendingLink}
                    className="button secondary"
                >
                    Previous
                </button>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={isSubmitting || isSendingLink}
                    className="button primary"
                >
                    {isSubmitting ? 'Submitting...' : (isLastStep ? 'Submit Valuation' : 'Next')}
                </button>
             </div>

             {/* Estilos de ejemplo (puedes ponerlos en tu CSS) */}
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
             `}</style>
        </div>
    );
}

export default Navigation;