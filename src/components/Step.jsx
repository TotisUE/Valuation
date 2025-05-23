// src/components/Step.jsx
import React from 'react';
import { NumericFormat } from 'react-number-format'; // Asegúrate que esté importado

// --- Función del componente ---
function Step({
    stepIndex,
    questions,
    formData,
    handleChange,
    sectionTitle,
    errors = {},
    dynamicOptions, // Para NAICS
    isSubSectorsLoading // Para NAICS
}) {

    // --- Manejo si no hay preguntas ---
    if (!questions || questions.length === 0) {
        return (
            <div className="step">
                <h2>{sectionTitle || `Step ${stepIndex + 1}`}</h2>
                <p>No questions configured for this section.</p>
            </div>
        );
    }

    // --- Renderizado principal del paso ---
    return (
        <div className="step">
            <h2>{sectionTitle}</h2>
            {/* Mapeo sobre las preguntas para este paso */}
            {questions.map((q) => {
                const hasError = errors && errors[q.valueKey];
                // Si formData[key] es null o undefined, getValue devuelve ''.
                // Esto es importante para que los inputs controlados no reciban null/undefined como valor.
                const getValue = (key) => {
                    const val = formData[key];
                    return val == null ? '' : val; //  Covers null and undefined
                }

                return (
                    <div key={q.id} className={`question ${hasError ? 'input-error' : ''}`}>
                        {/* Contenedor de la etiqueta y ayuda */}
                        <div className="label-container">
                            <label htmlFor={q.id || q.valueKey}>{q.text}</label> {/* Usar q.id para htmlFor si es más único */}
                            {q.required && <span className="required-asterisk" style={{color: 'red', marginLeft: '3px'}}>*</span>}
                            {q.helpText && (
                                <span className="help-tooltip" title={q.helpText} style={{marginLeft: '5px', cursor: 'help', borderBottom: '1px dotted gray'}}>
                                    (?)
                                </span>
                            )}
                        </div>
                        
   {q.industryContext && (
                            <div className="industry-context" style={{ 
                                fontSize: '0.85em', 
                                color: '#555', 
                                backgroundColor: '#f9f9f9', 
                                borderLeft: '3px solid #007bff', 
                                padding: '10px', 
                                marginTop: '5px', // Ajusta este margen si es necesario
                                marginBottom: '10px',
                                whiteSpace: 'pre-line' 
                            }}>
                                <strong>Industry Examples:</strong>
                                <p style={{margin: '5px 0 0 0'}}>{q.industryContext}</p>
                            </div>
                        )}
                        {/* --- Renderizado Condicional de Tipos de Pregunta --- */}
                        
                        {/* ======================= INICIO BLOQUE MCQ MODIFICADO ======================= */}
                        {q.type === 'mcq' && (
                            <div className="options">
                                {q.options && q.options.map((option, index) => {
                                    // Determinar qué valor usar para el radio input y para la comparación 'checked'.
                                    // Si la opción tiene una propiedad 'value' definida explícitamente (como en S2D: "a", "b"), úsala.
                                    // De lo contrario, usa option.text (comportamiento para las preguntas originales del form principal).
                                    const valueForInput = option.hasOwnProperty('value') ? option.value : option.text;
                                    
                                    // Para id y key, una combinación que sea única.
                                    // Usar option.value (si existe) o index para diferenciarlos.
                                    const optionIdentifier = option.hasOwnProperty('value') ? option.value : index;

                                    return (
                                        <div key={`${q.id}-${optionIdentifier}`} className="option">
                                            <input
                                                type="radio"
                                                id={`${q.id}-${optionIdentifier}`}
                                                name={q.valueKey} // El name del grupo de radios es el valueKey de la pregunta
                                                value={valueForInput} // <-- USA valueForInput
                                                checked={getValue(q.valueKey) === valueForInput} // <-- USA valueForInput para la comparación
                                                onChange={handleChange} // Pasa el evento directamente, handleChange en el padre lo procesará
                                                required={q.required}
                                                aria-invalid={hasError}
                                            />
                                            <label htmlFor={`${q.id}-${optionIdentifier}`}>{option.text}</label>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {/* ======================= FIN BLOQUE MCQ MODIFICADO ======================= */}

                        {/* Number Input */}
                        {q.type === 'number' && (() => {
                            const financialFieldsForNumericFormat = [
                                'currentRevenue', 
                                'grossProfit', 
                                'ebitda', 
                                'ebitdaAdjustments',
                                's2d_productRevenue' // Incluir la pregunta de revenue de S2D
                            ];
                            const useNumericFormat = financialFieldsForNumericFormat.includes(q.valueKey);
                            
                            let currentValue = getValue(q.valueKey); // getValue ya devuelve '' si es null/undefined

                            if (useNumericFormat) {
                                const displayValueForNumericFormat = (q.valueKey === 'ebitdaAdjustments' && (currentValue === 0 || currentValue === ''))
                                                                    ? '' 
                                                                    : currentValue;
                                return (
                                    <NumericFormat
                                        id={q.id || q.valueKey}
                                        name={q.valueKey}
                                        value={displayValueForNumericFormat}
                                        onValueChange={(values) => {
                                            handleChange({
                                                target: {
                                                    name: q.valueKey,
                                                    value: values.floatValue === undefined ? null : values.floatValue,
                                                    type: 'number',
                                                }
                                            });
                                        }}
                                        thousandSeparator=","
                                        allowNegative={q.valueKey === 'ebitda' || q.valueKey === 'ebitdaAdjustments'}
                                        decimalScale={0}
                                        prefix="$ "
                                        placeholder={q.placeholder || 'e.g., $ 1,500,000'}
                                        required={q.required}
                                        className={`number-input ${hasError ? 'input-error-field' : ''}`}
                                        aria-invalid={hasError}
                                        autoComplete="off"
                                    />
                                );
                            } else { // Para otros inputs numéricos (ej. employeeCount)
                                return (
                                    <input
                                        type="number"
                                        id={q.id || q.valueKey}
                                        name={q.valueKey}
                                        value={currentValue} // currentValue ya es '' si era null
                                        onChange={handleChange} 
                                        placeholder={q.placeholder || 'Enter a number'}
                                        required={q.required}
                                        className={`number-input ${hasError ? 'input-error-field' : ''}`}
                                        aria-invalid={hasError}
                                    />
                                );
                            }
                        })()}

                        {/* Email Input */}
                        {q.type === 'email' && (
                            <input
                                type="email"
                                id={q.id || q.valueKey}
                                name={q.valueKey}
                                value={getValue(q.valueKey)}
                                onChange={handleChange}
                                placeholder={q.placeholder || 'Enter email'}
                                required={q.required}
                                className={`email-input ${hasError ? 'input-error-field' : ''}`}
                                autoComplete="email"
                                aria-invalid={hasError}
                            />
                        )}

                        {/* Text Input */}
                        {q.type === 'text' && (
                            <input
                                type="text"
                                id={q.id || q.valueKey}
                                name={q.valueKey}
                                value={getValue(q.valueKey)}
                                onChange={handleChange}
                                placeholder={q.placeholder || 'Enter text'}
                                required={q.required}
                                className={`text-input ${hasError ? 'input-error-field' : ''}`}
                                aria-invalid={hasError}
                                pattern={q.valueKey === 'locationZip' ? "[0-9]{5}" : undefined}
                                title={q.valueKey === 'locationZip' ? "Please enter a 5-digit Zip Code" : undefined}
                                autoComplete={q.valueKey === 'locationState' ? 'address-level1' : q.valueKey === 'locationZip' ? 'postal-code' : 'off'}
                            />
                        )}

                        {/* Standard Select (NAICS SECTOR) */}
                        {q.type === 'select' && q.valueKey === 'naicsSector' && (
                            <select
                                id={q.id || q.valueKey}
                                name={q.valueKey}
                                value={getValue(q.valueKey)}
                                onChange={handleChange}
                                required={q.required}
                                className={`select-input ${hasError ? 'input-error-field' : ''}`}
                                aria-invalid={hasError}
                            >
                                <option value="" disabled>-- Select an Industry Sector --</option>
                                {dynamicOptions?.sectors?.map((sector) => (
                                    <option key={sector.id || sector.name} value={sector.name}>
                                        {sector.name}
                                    </option>
                                ))}
                                {(!dynamicOptions?.sectors || dynamicOptions.sectors.length === 0) && (
                                    <option value="" disabled>(Loading sectors...)</option>
                                )}
                            </select>
                        )}

                        {/* Dependent Select (NAICS SUB-SECTOR) */}
                        {q.type === 'select_dependent' && q.valueKey === 'naicsSubSector' && (
                            <select
                                id={q.id || q.valueKey}
                                name={q.valueKey}
                                value={getValue(q.valueKey)}
                                onChange={handleChange}
                                required={q.required}
                                className={`select-input ${hasError ? 'input-error-field' : ''}`}
                                disabled={!formData.naicsSector || isSubSectorsLoading}
                                aria-invalid={hasError}
                            >
                                {/* ... tus options ... */}
                                {!formData.naicsSector ? (
                                    <option value="" disabled>-- Select a sector first --</option>
                                ) : isSubSectorsLoading ? (
                                    <option value="" disabled>Loading sub-sectors...</option>
                                ) : (
                                    <>
                                        <option value="" disabled>-- Select a Sub-Sector --</option>
                                        {dynamicOptions?.subSectors?.map((subSector) => (
                                            <option key={subSector.name} value={subSector.name}>
                                                {subSector.name}
                                            </option>
                                        ))}
                                        {(!dynamicOptions?.subSectors || dynamicOptions.subSectors.length === 0) && (
                                             <option value="" disabled>(No specific sub-sectors listed for this sector)</option>
                                        )}
                                    </>
                                )}
                            </select>
                        )}
                        
                         {/* Otros Select Standard (si los tienes) */}
                         {q.type === 'select' && q.valueKey !== 'naicsSector' && (
                              <select
                                  id={q.id || q.valueKey}
                                  name={q.valueKey}
                                  value={getValue(q.valueKey)}
                                  onChange={handleChange}
                                  required={q.required}
                                  className={`select-input ${hasError ? 'input-error-field' : ''}`}
                                  aria-invalid={hasError}
                              >
                                  <option value="" disabled>-- Select an option --</option>
                                  {q.options?.map((option, index) => ( // Asume que q.options puede ser un array de strings o de objetos {text: string}
                                      typeof option === 'string' ?
                                      <option key={index} value={option}>{option}</option> :
                                      <option key={option.value !== undefined ? option.value : option.text} value={option.value !== undefined ? option.value : option.text}>{option.text}</option>
                                  ))}
                              </select>
                          )}
                          
                        {/* Textarea */}
                        {q.type === 'textarea' && (
                            <textarea
                                id={q.id || q.valueKey}
                                name={q.valueKey}
                                value={getValue(q.valueKey)}
                                onChange={handleChange}
                                placeholder={q.placeholder || 'Enter details...'}
                                required={q.required}
                                className={`textarea-input ${hasError ? 'input-error-field' : ''}`}
                                aria-invalid={hasError}
                                rows={q.rows || 4}
                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginTop: '5px', minHeight: '80px' }}
                            />
                        )}

                        {/* Mensaje de error */}
                        {hasError && (
                            <span className="error-message" role="alert" style={{ color: 'red', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
                                {errors[q.valueKey] || "This field is required or has an invalid format."} {/* Mostrar mensaje específico si existe */}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default Step;