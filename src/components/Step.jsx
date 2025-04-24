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
                const getValue = (key) => formData[key] ?? '';

                return (
                    <div key={q.id} className={`question ${hasError ? 'input-error' : ''}`}>
                        {/* Contenedor de la etiqueta y ayuda */}
                        <div className="label-container">
                            <label htmlFor={q.valueKey}>{q.text}</label>
                            {q.required && <span className="required-asterisk" style={{color: 'red', marginLeft: '3px'}}>*</span>}
                            {q.helpText && (
                                <span className="help-tooltip" title={q.helpText} style={{marginLeft: '5px', cursor: 'help', borderBottom: '1px dotted gray'}}>
                                    (?)
                                </span>
                            )}
                        </div>

                        {/* --- Renderizado Condicional de Tipos de Pregunta --- */}

                        {/* MCQ */}
                        {q.type === 'mcq' && (
                            <div className="options">
                                {q.options.map((option, index) => (
                                    <div key={index} className="option">
                                        <input
                                            type="radio"
                                            id={`${q.valueKey}-${index}`}
                                            name={q.valueKey}
                                            value={option.text}
                                            checked={getValue(q.valueKey) === option.text}
                                            onChange={handleChange}
                                            required={q.required}
                                            aria-invalid={hasError}
                                        />
                                        <label htmlFor={`${q.valueKey}-${index}`}>{option.text}</label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Number Input */}
                        {q.type === 'number' && (() => {
                            const isFinancialField = ['currentRevenue', 'grossProfit', 'ebitda', 'ebitdaAdjustments'].includes(q.valueKey);
                            if (isFinancialField) {
                                const displayValue = (q.valueKey === 'ebitdaAdjustments' && (getValue(q.valueKey) === 0 || getValue(q.valueKey) === ''))
                                                    ? '' : getValue(q.valueKey);
                                return (
                                    <NumericFormat
                                        id={q.valueKey}
                                        name={q.valueKey}
                                        value={displayValue}
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
                            } else {
                                return (
                                    <input
                                        type="number"
                                        id={q.valueKey}
                                        name={q.valueKey}
                                        value={getValue(q.valueKey)}
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
                                id={q.valueKey}
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

                        {/* Text Input (para Estado, Zip Code) */}
                        {q.type === 'text' && (
                            <input
                                type="text"
                                id={q.valueKey}
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

                        {/* Standard Select (Dropdown para SECTOR NAICS) */}
                        {q.type === 'select' && q.valueKey === 'naicsSector' && (
                            <select
                                id={q.valueKey}
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

                        {/* --- CORREGIDO: UNA SOLA VEZ Dependent Select (Dropdown para SUB-SECTOR NAICS) --- */}
                        {q.type === 'select_dependent' && q.valueKey === 'naicsSubSector' && (
                            <select
                                id={q.valueKey}
                                name={q.valueKey}
                                value={getValue(q.valueKey)}
                                onChange={handleChange}
                                required={q.required}
                                className={`select-input ${hasError ? 'input-error-field' : ''}`}
                                disabled={!formData.naicsSector || isSubSectorsLoading}
                                aria-invalid={hasError}
                            >
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
                        {/* --- FIN CORRECCIÓN --- */}


                         {/* Otros Select Standard (si existieran) */}
                         {q.type === 'select' && q.valueKey !== 'naicsSector' && (
                              <select
                                  id={q.valueKey}
                                  name={q.valueKey}
                                  value={getValue(q.valueKey)}
                                  onChange={handleChange}
                                  required={q.required}
                                  className={`select-input ${hasError ? 'input-error-field' : ''}`}
                                  aria-invalid={hasError}
                              >
                                  <option value="" disabled>-- Select an option --</option>
                                  {q.options?.map((option, index) => (
                                      typeof option === 'string' ?
                                      <option key={index} value={option}>{option}</option> :
                                      <option key={index} value={option.text}>{option.text}</option>
                                  ))}
                              </select>
                          )}

                        {/* Mensaje de error */}
                        {hasError && (
                            <span className="error-message" role="alert" style={{ color: 'red', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
                                This field is required or has an invalid format.
                            </span>
                        )}

                    </div> // Fin de .question
                );
            })} {/* Fin de .map(questions) */}
        </div> // Fin de .step
    );
}

export default Step;