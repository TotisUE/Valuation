// src/components/product-services/ProductServiceAssessmentForm.jsx
import React, { useState, useEffect } from 'react';
import { getSaleToDeliveryProcessQuestions } from '../../sections-data/saleToDeliveryQuestions';
import Step from '../Step'; // Importamos nuestro componente Step


function ProductServiceAssessmentForm({ onSubmitProductService, initialData = {}, onCancel }) {
    // initialData podría usarse si estamos editando un P/S existente en el futuro
    const [s2dFormData, setS2dFormData] = useState(() => {
        // Inicializar formData con las valueKeys de las preguntas de S2D
        const questions = getSaleToDeliveryProcessQuestions();
        const initialFormState = {};
        questions.forEach(q => {
            // Usar valor de initialData si existe, sino el default (generalmente '')
            initialFormState[q.valueKey] = initialData[q.valueKey] || (q.type === 'number' ? null : '');
        });
        return initialFormState;
    });


    const [s2dQuestions, setS2dQuestions] = useState([]);
    const [errors, setErrors] = useState({}); // Para validaciones futuras


    useEffect(() => {
        // Obtenemos todas las preguntas para este formulario específico
        setS2dQuestions(getSaleToDeliveryProcessQuestions());
    }, []);


    const handleChange = (event) => {
        const { name, value, type, checked } = event.target; // Añadir 'checked' para radio/checkbox si se usa
        let processedValue = value;


        if (type === 'number') {
            processedValue = value === '' ? null : parseFloat(value);
            if (isNaN(processedValue)) processedValue = null;
        }
        // Para radio buttons, el valor ya es el 'value' de la opción seleccionada
        // Para checkboxes, sería 'checked' (booleano)


        setS2dFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));


        if (errors[name]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    };


    const handleSubmit = (event) => {
        event.preventDefault();
        const currentErrors = {};
        let isValid = true;


        s2dQuestions.forEach(q => {
            const value = s2dFormData[q.valueKey];
            let isEmptyOrInvalid = false;


            if (q.type === 'number') {
                isEmptyOrInvalid = (value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || isNaN(Number(value))) && value !== 0;
            } else {
                isEmptyOrInvalid = value == null || (typeof value === 'string' && value.trim() === '');
            }


            if (q.required && isEmptyOrInvalid) {
                currentErrors[q.valueKey] = `${q.text || 'This field'} is required.`;
                isValid = false;
            }
        });
        
        setErrors(currentErrors);


        if (isValid) {
            console.log("Submitting Product/Service Data:", s2dFormData);
            if (onSubmitProductService) {
                onSubmitProductService(s2dFormData);
            }
        } else {
            console.log("Validation errors in ProductServiceAssessmentForm:", currentErrors);
            alert("Please fill in all required fields.");
        }
    };


    if (s2dQuestions.length === 0) {
        return <div>Loading assessment questions...</div>;
    }


    return (
        <div className="product-service-assessment-form" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
            {/* No necesitamos el H2 "Sale to Delivery..." aquí porque AddProductServicePage ya tiene un H1 */}
            {/* <p>Please answer the following questions for the specified product or service.</p> */}
            <form onSubmit={handleSubmit}>
                <Step
                    stepIndex={0} // Solo un "paso" para este formulario
                    questions={s2dQuestions} // Pasamos todas las preguntas de S2D
                    formData={s2dFormData}
                    handleChange={handleChange}
                    sectionTitle={"Product/Service Details & Process Assessment"} // Título para este conjunto de preguntas
                    errors={errors}
                    // Estas props no son necesarias para las preguntas de S2D
                    dynamicOptions={null}
                    isSubSectorsLoading={false}
                />
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        type="button"
                        onClick={onCancel} // Asumimos que AddProductServicePage pasará un onCancel
                        style={{ padding: '10px 15px' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        Save Product/Service Assessment
                    </button>
                </div>
            </form>
        </div>
    );
}


export default ProductServiceAssessmentForm;



