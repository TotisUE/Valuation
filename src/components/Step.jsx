// src/components/Step.jsx
import React from 'react'; // Quitar useState y useEffect si ya no se usan aquí
import { NumericFormat } from 'react-number-format';
// --- QUITAR: import { getSubSectors } from '../naicsData'; --- Ya no se usa

// --- MODIFICACIÓN: Añadir props dynamicOptions e isSubSectorsLoading ---
function Step({
    stepIndex,
    questions,
    formData,
    handleChange,
    sectionTitle,
    errors = {},
    // --- Nuevas Props ---
    dynamicOptions,
    isSubSectorsLoading
}) {

    // --- QUITAR: El estado 'dependentOptions' y su 'useEffect' ya no son necesarios ---
    // const [dependentOptions, setDependentOptions] = useState({});
    // useEffect(() => { ... }, [formData, questions]); // Eliminar todo este bloque


    // --- Handle case with no questions (Sin cambios) ---
    if (!questions || questions.length === 0) {
        return (
            <div className="step">
                <h2>{sectionTitle || `Step ${stepIndex + 1}`}</h2>
                <p>No questions configured for this section.</p>
            </div>
        );
    }

    // Render the step with questions
    return (
        <div className="step">
            <h2>{sectionTitle}</h2>
            {questions.map((q) => {
                const hasError = errors && errors[q.valueKey];
                // Helper simple para obtener valor, evitando undefined directo en los inputs/selects
                const getValue = (key) => formData[key] ?? '';

                return (
                    <div key={q.id} className={`question ${hasError ? 'input-error' : ''}`}>
                        <div className="label-container">
                            <label htmlFor={q.valueKey}>{q.text}</label>
                            {q.required && <span className="required-asterisk" style={{color: 'red', marginLeft: '3px'}}>*</span>} {/* Estilo ejemplo */}
                            {q.helpText && (
                                <span className="help-tooltip" title={q.helpText} style={{marginLeft: '5px', cursor: 'help', borderBottom: '1px dotted gray'}}>
                                    (?)
                                </span>
                            )}
                        </div>

                        {/* --- Renderizado Condicional de Tipos de Pregunta --- */}

                        {/* MCQ (Sin cambios en su lógica interna) */}
                        {q.type === 'mcq' && (
                            <div className="options">
                                {q.options.map((option, index) => (
                                    <div key={index} className="option">
                                        <input
                                            type="radio"
                                            id={`${q.valueKey}-${index}`}
                                            name={q.valueKey}
                                            value={option.text}
                                            // --- Usar getValue para asegurar que no sea undefined ---
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

                        {/* Number Input (Tu lógica existente para NumericFormat) */}
                        {q.type === 'number' && (() => {
                            const isFinancialField = ['currentRevenue', 'grossProfit', 'ebitda', 'ebitdaAdjustments'].includes(q.valueKey);
                            if (isFinancialField) {
                                // --- Usar getValue para obtener el valor ---
                                const displayValue = (q.valueKey === 'ebitdaAdjustments' && (getValue(q.valueKey) === 0 || getValue(q.valueKey) === ''))
                                                    ? '' : getValue(q.valueKey);
                                return (
                                    <NumericFormat
                                        id={q.valueKey}
                                        name={q.valueKey}
                                        value={displayValue} // Usar displayValue calculado
                                        onValueChange={(values, sourceInfo) => {
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
                                        className={`number-input ${hasError ? 'input-error-field' : ''}`} // Aplicar clase de error directo al input
                                        aria-invalid={hasError}
                                        autoComplete="off"
                                    />
                                );
                            } else {
                                // Input numérico normal si no es financiero
                                return (
                                    <input
                                        type="number"
                                        id={q.valueKey}
                                        name={q.valueKey}
                                        value={getValue(q.valueKey)} // Usar getValue
                                        onChange={handleChange}
                                        placeholder={q.placeholder || 'Enter a number'}
                                        required={q.required}
                                        className={`number-input ${hasError ? 'input-error-field' : ''}`}
                                        aria-invalid={hasError}
                                    />
                                );
                            }
                        })()}

                        {/* Email Input (Usar getValue) */}
                        {q.type === 'email' && (
                            <input
                                type="email"
                                id={q.valueKey}
                                name={q.valueKey}
                                value={getValue(q.valueKey)} // Usar getValue
                                onChange={handleChange}
                                placeholder={q.placeholder || 'Enter email'}
                                required={q.required}
                                className={`email-input ${hasError ? 'input-error-field' : ''}`}
                                autoComplete="email"
                                aria-invalid={hasError}
                            />
                        )}

                        {/* --- MODIFICACIÓN: Standard Select (Dropdown para SECTOR) --- */}
                        {/* Asumimos que la pregunta con valueKey 'naicsSector' es de tipo 'select' */}
                        {q.type === 'select' && q.valueKey === 'naicsSector' && (
                            <select
                                id={q.valueKey}
                                name={q.valueKey}
                                value={getValue(q.valueKey)} // Usar getValue
                                onChange={handleChange}
                                required={q.required}
                                className={`select-input ${hasError ? 'input-error-field' : ''}`}
                                aria-invalid={hasError}
                            >
                                <option value="" disabled>-- Select an Industry Sector --</option>
                                {/* Mapear sobre la lista de SECTORES pasada por props */}
                                {dynamicOptions?.sectors?.map((sector) => (
                                    // Usar sector.id o sector.name como key si son únicos
                                    <option key={sector.id || sector.name} value={sector.name}>
                                        {sector.name}
                                    </option>
                                ))}
                                {/* Mostrar si la lista está vacía o aún no carga */}
                                {(!dynamicOptions?.sectors || dynamicOptions.sectors.length === 0) && (
                                    <option value="" disabled>(Loading sectors...)</option>
                                )}
                            </select>
                        )}

                        {/* --- MODIFICACIÓN: Dependent Select (Dropdown para SUB-SECTOR) --- */}
                        {/* Asumimos que la pregunta con valueKey 'naicsSubSector' es de tipo 'select_dependent' */}
                        {q.type === 'select_dependent' && q.valueKey === 'naicsSubSector' && (
                            <select
                                id={q.valueKey}
                                name={q.valueKey}
                                value={getValue(q.valueKey)} // Usar getValue
                                onChange={handleChange}
                                required={q.required}
                                className={`select-input ${hasError ? 'input-error-field' : ''}`}
                                // Deshabilitar si el sector no está seleccionado O si los subsectores están cargando
                                disabled={!formData.naicsSector || isSubSectorsLoading}
                                aria-invalid={hasError}
                            >
                                {/* Mostrar opción adecuada según el estado */}
                                {!formData.naicsSector ? (
                                    <option value="" disabled>-- Select a sector first --</option>
                                ) : isSubSectorsLoading ? (
                                    <option value="" disabled>Loading sub-sectors...</option>
                                ) : (
                                    // Si el sector está seleccionado y no está cargando:
                                    <>
                                        <option value="" disabled>-- Select a Sub-Sector --</option>
                                        {/* Mapear sobre la lista de SUB-SECTORES pasada por props */}
                                        {dynamicOptions?.subSectors?.map((subSector) => ( // <-- Cambia 'subSectorName' a 'subSector'
    <option key={subSector.name} value={subSector.name}> {/* <-- Usa subSector.name */}
        {subSector.name} {/* <-- Usa subSector.name */}
    </option>
))}
                                        {/* Mostrar mensaje si no se encontraron subsectores para el sector elegido */}
                                        {(!dynamicOptions?.subSectors || dynamicOptions.subSectors.length === 0) && (
                                             <option value="" disabled>(No specific sub-sectors listed for this sector)</option>
                                        )}
                                    </>
                                )}
                            </select>
                        )}

                         {/* --- MANTENER: Renderizado de otros tipos 'select' estándar (si existen) --- */}
                         {/* Este bloque manejaría cualquier otro dropdown que NO sea 'naicsSector' */}
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
                                  {/* Asume que las opciones están en q.options como antes */}
                                  {q.options?.map((option, index) => (
                                      // Si option es un string directamente
                                      typeof option === 'string' ?
                                      <option key={index} value={option}>{option}</option> :
                                      // Si es un objeto {text: ...} (adaptar si la estructura es diferente)
                                      <option key={index} value={option.text}>{option.text}</option>
                                  ))}
                              </select>
                          )}


                        {/* Mensaje de error (Pequeña mejora opcional) */}
                        {hasError && (
                            <span className="error-message" role="alert" style={{ color: 'red', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
                                This field is required or has an invalid format.
                            </span>
                        )}

                    </div>
                );
            })}
        </div>
    );
}

export default Step;