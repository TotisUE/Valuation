// src/pages/AddProductServicePage.jsx
import React, { useState } from 'react'; // Asegúrate de tener useState
import { useNavigate } from 'react-router-dom';
import ProductServiceAssessmentForm from '../components/product-services/ProductServiceAssessmentForm';
import { getFunctionsBaseUrl } from '../utils/urlHelpers'; // Asegúrate de que esta importación exista

function AddProductServicePage() {
    const navigate = useNavigate();
    const [isSubmittingS2D, setIsSubmittingS2D] = useState(false); // Estado para la carga

    const handleFormSubmit = async (s2dAssessmentData) => {
        console.log("Data from SaleToDeliveryForm received in AddProductServicePage:", s2dAssessmentData);
        setIsSubmittingS2D(true); // Indicar que estamos guardando

        // Opcional: Si tienes usuarios logueados y quieres pasar el user_id
        // const supabase = useContext(SupabaseContext); // Necesitarías el contexto
        // const { data: { session } } = await supabase.auth.getSession();
        // const userId = session?.user?.id;
        // const dataToSend = { ...s2dAssessmentData, userId: userId /*, mainSubmissionId: tuIdDeSubmissionPrincipal */ };
        // Por ahora, enviaremos s2dAssessmentData directamente

        const functionsBase = getFunctionsBaseUrl();
        // El nombre del directorio de la función es el endpoint
        const functionUrl = `${functionsBase}/.netlify/functions/submit-s2d-assessment`; 
        console.log("Attempting to POST S2D data to:", functionUrl);

        try {
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(s2dAssessmentData) // Envía el paquete completo
            });

            // Es importante leer el cuerpo de la respuesta para obtener el JSON
            const resultText = await response.text();
            let result;
            try {
                result = JSON.parse(resultText);
            } catch (e) {
                console.error("Failed to parse JSON response from function:", resultText);
                throw new Error("Received non-JSON response from server.");
            }

            if (!response.ok || !result.success) {
                console.error("Error response from Netlify function:", result);
                throw new Error(result.error || 'Failed to save S2D assessment via function.');
            }

            console.log("S2D Assessment Saved Successfully via Netlify function:", result);
            //alert(`Assessment for "${s2dAssessmentData.s2d_productName}" saved successfully! Assessment ID: ${result.assessmentId}`);
              navigate('/s2d-results', { state: { s2dAssessmentData: s2dAssessmentData } });
        } catch (error) {
            console.error("Error saving S2D assessment:", error);
            alert(`Error saving assessment: ${error.message}`);
        } finally {
            setIsSubmittingS2D(false); // Terminar estado de carga
        }
    };

    const handleCancel = () => {
        console.log("S2D Assessment Canceled");
        navigate('/');
    };

    return (
        <div className="add-product-service-page" style={{ maxWidth: '800px', margin: '30px auto', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
            <header style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1>Add New Product/Service Assessment</h1>
            </header>
            <main>
                <ProductServiceAssessmentForm
                    onSubmitProductService={handleFormSubmit}
                    onCancel={handleCancel}
                    // Podrías pasar isSubmittingS2D al formulario para deshabilitar el botón
                    // isSaving={isSubmittingS2D} 
                />
                {isSubmittingS2D && (
                    <p style={{ textAlign: 'center', marginTop: '20px', color: 'blue' }}>
                        Saving your assessment, please wait...
                    </p>
                )}
            </main>
        </div>
    );
}

export default AddProductServicePage;