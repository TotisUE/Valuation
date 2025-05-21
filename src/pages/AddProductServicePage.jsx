// src/pages/AddProductServicePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductServiceAssessmentForm from '../components/product-services/ProductServiceAssessmentForm';


function AddProductServicePage() {
    const navigate = useNavigate();


    const handleFormSubmit = (productServiceData) => {
        console.log("Product/Service Data Submitted from Page:", productServiceData);
        // Futuro: Guardar datos, calcular scores específicos de S2D
        alert("Product/Service assessment data logged to console. Functionality to save is next.");
        navigate('/'); // O a una página de resultados/dashboard de P/S
    };


    const handleCancel = () => {
        console.log("Cancelled adding product/service assessment.");
        navigate(-1); // Volver a la página anterior (probablemente la de resultados)
    };


    return (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
            <header style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1>Add New Product/Service Assessment</h1>
            </header>
            <main>
                <ProductServiceAssessmentForm
                    onSubmitProductService={handleFormSubmit}
                    onCancel={handleCancel} // Pasar la función de cancelar
                    // initialData={{}} // Pasar datos iniciales si se está editando
                />
            </main>
        </div>
    );
}


export default AddProductServicePage;



