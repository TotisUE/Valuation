// src/components/product-services/ProductServiceAssessmentForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getSaleToDeliveryProcessQuestions } from '../../sections-data/saleToDeliveryQuestions';

// --- INICIO: QuestionInput Placeholder (o tu componente reutilizable) ---
// Este es el componente que renderizará cada pregunta individual.
// Necesitas asegurarte de que maneje 'text', 'textarea', 'number', y 'mcq'.
function QuestionInput({ question, value, handleChange, error }) {
    const inputName = question.valueKey;

    const handleInputChange = (e) => {
        handleChange({ target: { name: inputName, value: e.target.value, type: e.target.type } });
    };

    const handleMcqChange = (optionValue) => {
        // Para S2D, queremos que el valor sea option.value ("a", "b", etc.)
        handleChange({ target: { name: inputName, value: optionValue, type: 'mcq' } });
    };

    if (question.type === 'mcq') {
        return (
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <legend style={{ fontWeight: 'bold', marginBottom: '0.5em', fontSize: '1em' }}>
                    {question.text} {question.required && <span style={{ color: 'red' }}>*</span>}
                </legend>
                {question.options && question.options.map((option) => (
                    <div key={question.id + '-' + option.value} style={{ marginBottom: '0.5em' }}>
                        <input
                            type="radio"
                            id={`${question.id}-${option.value}`}
                            name={inputName} // El name del grupo de radios
                            value={option.value} // EL VALOR DEL RADIO ES option.value
                            checked={value === option.value} // Comparamos con option.value
                            onChange={() => handleMcqChange(option.value)} // Llamamos con option.value
                            required={question.required}
                        />
                        <label htmlFor={`${question.id}-${option.value}`} style={{ marginLeft: '0.5em', fontWeight: 'normal' }}>
                            {option.text}
                        </label>
                    </div>
                ))}
                {error && <p style={{ color: 'red', fontSize: '0.9em', marginTop: '0.25em' }}>{error}</p>}
            </fieldset>
        );
    }

    // Inputs para text, textarea, number
    return (
        <div>
            <label htmlFor={inputName} style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5em', fontSize: '1em' }}>
                {question.text} {question.required && <span style={{ color: 'red' }}>*</span>}
            </label>
            {question.type === 'textarea' ? (
                <textarea
                    id={inputName}
                    name={inputName} // importante para handleChange
                    value={value || ''}
                    onChange={handleInputChange}
                    required={question.required}
                    rows={question.rows || 4}
                    placeholder={question.placeholder}
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                />
            ) : (
                <input
                    type={question.type} // "text" o "number"
                    id={inputName}
                    name={inputName} // importante para handleChange
                    value={value || (question.type === 'number' && value === null ? '' : value)} // Manejar null para números
                    onChange={handleInputChange}
                    required={question.required}
                    placeholder={question.placeholder}
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                />
            )}
            {error && <p style={{ color: 'red', fontSize: '0.9em', marginTop: '0.25em' }}>{error}</p>}
        </div>
    );
}
// --- FIN: QuestionInput Placeholder ---


function ProductServiceAssessmentForm({ onSubmitProductService, initialData = {}, onCancel }) {
    const [s2dQuestions, setS2dQuestions] = useState([]);
    const [s2dFormData, setS2dFormData] = useState({});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        console.log("ProductServiceAssessmentForm: useEffect to set questions and initial form data - RUNS ONCE.");
        
        const questions = getSaleToDeliveryProcessQuestions();
        setS2dQuestions(questions); // Establece las preguntas

        // Inicializa s2dFormData basándose en las preguntas, ignorando initialData por ahora para romper el bucle
        const initialFormState = {};
        questions.forEach(q => {
            // Por ahora, solo inicializa con el valor por defecto (ignora initialData temporalmente)
            initialFormState[q.valueKey] = (q.type === 'number' ? null : '');
        });
        setS2dFormData(initialFormState); // Establece el estado del formulario

    }, []);

    const handleChange = useCallback((event) => {
        const { name, value, type } = event.target;
        let processedValue = value;
        if (type === 'number') {
            processedValue = value === '' ? null : parseFloat(value);
            if (isNaN(processedValue)) processedValue = null;
        }
        setS2dFormData(prev => ({ ...prev, [name]: processedValue }));
        if (errors[name]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]);

    const validateS2DForm = useCallback(() => { /* ...tu lógica de validación sin cambios... */ 
        const currentErrors = {};
        let isValid = true;
        s2dQuestions.forEach(q => {
            const value = s2dFormData[q.valueKey];
            let isEmptyOrInvalid = false;
            if (q.type === 'number') {
                isEmptyOrInvalid = (value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || isNaN(Number(value))) && Number(value) !== 0;
            } else {
                isEmptyOrInvalid = value == null || (typeof value === 'string' && value.trim() === '');
            }
            if (q.required && isEmptyOrInvalid) {
                currentErrors[q.valueKey] = `${q.text || 'This field'} is required.`;
                isValid = false;
            }
        });
        setErrors(currentErrors);
        return isValid;
    }, [s2dQuestions, s2dFormData]);

const handleSubmit = useCallback((event) => {
        event.preventDefault();
        if (!validateS2DForm()) { // Asumiendo que validateS2DForm ya llama a setErrors
            console.warn("Validation errors in ProductServiceAssessmentForm:", errors); // 'errors' es del estado
            alert("Please fill in all required fields.");
            return;
        }

        // --- INICIO: CÁLCULO DE SCORES Y DETAILED ANSWERS ---
        // --- DECLARACIÓN CORRECTA DE LAS VARIABLES DE SCORE ---
        let processMaturityScore = 0;
        let ownerIndependenceScore = 0; // <--- ESTA ES LA LÍNEA QUE FALTABA O ESTABA MAL
        let clientExperienceOptimizationScore = 0;
        let resourceAllocationEffectivenessScore = 0;
        // ---------------------------------------------------

        const clientExperienceValueKeys = ["s2d_q3_process", "s2d_q2_process", "s2d_q5_process"];
        const resourceAllocationValueKeys = ["s2d_q6_process", "s2d_q4_process", "s2d_q7_process"];
        
        const detailedAnswers = { 
            clientExperience: {}, 
            resourceAllocation: {} 
        };

        // s2dQuestions y s2dFormData vienen del estado y son correctas aquí
        s2dQuestions.forEach(q => {
            const answerValue = s2dFormData[q.valueKey];
            if (answerValue && q.options && q.type === 'mcq') {
                const selectedOption = q.options.find(opt => opt.value === answerValue);
                if (selectedOption && typeof selectedOption.score === 'number') {
                    let questionKeyForDetailed = "";
                    const idParts = q.id.split('_');
                    if (idParts.length >= 2) {
                        questionKeyForDetailed = idParts[1];
                    }

                    if (q.id.includes('_process')) {
                        processMaturityScore += selectedOption.score;
                        if (clientExperienceValueKeys.includes(q.valueKey) && questionKeyForDetailed) {
                            clientExperienceOptimizationScore += selectedOption.score;
                            detailedAnswers.clientExperience[questionKeyForDetailed] = { 
                                questionText: q.text, 
                                answerText: selectedOption.text, 
                                score: selectedOption.score 
                            };
                        }
                        if (resourceAllocationValueKeys.includes(q.valueKey) && questionKeyForDetailed) {
                            resourceAllocationEffectivenessScore += selectedOption.score;
                            detailedAnswers.resourceAllocation[questionKeyForDetailed] = { 
                                questionText: q.text, 
                                answerText: selectedOption.text, 
                                score: selectedOption.score 
                            };
                        }
                    } else if (q.id.includes('_owner')) {
                        // Aquí es donde se usa ownerIndependenceScore
                        ownerIndependenceScore += selectedOption.score; 
                    }
                }
            }
        });
        
        const s2dResultsPackage = {
            s2d_productName: s2dFormData.s2d_productName || "N/A",
            s2d_productDescription: s2dFormData.s2d_productDescription || "N/A",
            s2d_productRevenue: parseFloat(s2dFormData.s2d_productRevenue) || 0,
            processMaturityScore,
            ownerIndependenceScore, // Ahora está definida y debería tener un valor
            clientExperienceOptimizationScore,
            resourceAllocationEffectivenessScore,
            detailedAnswers,
            s2d_all_answers: { ...s2dFormData } 
        };
        console.log("Submitting Product/Service Data with Calculated Scores:", s2dResultsPackage);
        if (onSubmitProductService) {
            onSubmitProductService(s2dResultsPackage); 
        }
    }, [s2dFormData, s2dQuestions, onSubmitProductService, validateS2DForm, errors]);

    if (s2dQuestions.length === 0) {
        return <div>Loading assessment questions...</div>;
    }

    return (
        <div className="product-service-assessment-form" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
            <form onSubmit={handleSubmit}>
                {/* YA NO USAMOS <Step />, RENDERIZAMOS DIRECTAMENTE */}
                {s2dQuestions.map(question => (
                    <div key={question.id} style={{ marginBottom: '1.5em', paddingBottom: '1.5em', borderBottom: '1px solid #f0f0f0' }}>
                        <QuestionInput
                            question={question}
                            value={s2dFormData[question.valueKey] || (question.type === 'number' ? '' : '')} // Ajustar el valor para number
                            handleChange={handleChange}
                            error={errors[question.valueKey]}
                        />
                    </div>
                ))}
                {/* ... (botones sin cambios) ... */}
                 <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Save Product/Service Assessment
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ProductServiceAssessmentForm;