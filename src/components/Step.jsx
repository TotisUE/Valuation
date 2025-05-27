// src/components/Step.jsx
import React from 'react';
import { NumericFormat } from 'react-number-format'; // Asegúrate que esté importado

const D2SIntroductoryText = () => (
    <div className="d2s-intro-text" style={{ marginBottom: '25px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '5px', backgroundColor: '#f9f9f9', lineHeight: '1.6' }}>
        <h3 style={{ marginTop: '0', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>The 5 R's of Customer Success Framework</h3>
        <h4 style={{ marginTop: '15px' }}>Understanding Customer Success as a Business Growth Engine</h4>
        <p>The "Delivery to Success" process isn't just about fulfilling what you promised—it's about turning every customer into a growth engine for your business. Great Customer Success departments focus on five key outcomes, which we call The 5 R's:</p>
        <ul style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '10px' }}>
                <strong>Results – The customer achieves the promised outcome</strong>
                <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '5px' }}>
                    <li>How many milestones are customers meeting?</li>
                    <li>How long do they take to achieve success?</li>
                    <li>NPS and CSAT scores at key customer journey moments</li>
                    <li>Customer support metrics and resolution times</li>
                    <li>Measurable business impact for the customer</li>
                </ul>
            </li>
            <li style={{ marginBottom: '10px' }}>
                <strong>Retention – The customer stays and keeps using the product or service</strong>
                <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '5px' }}>
                    <li>Renewal rates and contract extensions</li>
                    <li>Usage metrics and engagement levels</li>
                    <li>Early warning systems for at-risk customers</li>
                    <li>Proactive intervention strategies</li>
                    <li>Customer lifetime value optimization</li>
                </ul>
            </li>
            <li style={{ marginBottom: '10px' }}>
                <strong>Reviews – The customer leaves feedback that drives improvement</strong>
                <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '5px' }}>
                    <li>Detractors (NPS 0-6): Feedback should be internal and inform strategic planning</li>
                    <li>Promoters (NPS 9-10): Feedback should become public testimonials and case studies</li>
                    <li>Systematic review collection at optimal moments</li>
                    <li>Review response and follow-up processes</li>
                </ul>
            </li>
            <li style={{ marginBottom: '10px' }}>
                <strong>Referrals – The customer actively recommends your product or service</strong>
                <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '5px' }}>
                    <li>Systematic referral request workflows</li>
                    <li>Referral tracking and attribution systems</li>
                    <li>Community building among successful customers</li>
                    <li>Partner/affiliate programs emerging from customer advocacy</li>
                    <li>Timing referral requests with customer success milestones</li>
                </ul>
            </li>
            <li style={{ marginBottom: '10px' }}>
                <strong>Resale – The customer buys again (upsells, renewals, cross-sells)</strong>
                <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '5px' }}>
                    <li>Identifying key ascension moments in the customer journey</li>
                    <li>Upsell and cross-sell opportunity identification</li>
                    <li>Renewal process optimization</li>
                    <li>Expansion revenue tracking</li>
                    <li>Success-based pricing models</li>
                </ul>
            </li>
        </ul>
        <h4 style={{ marginTop: '20px' }}>The Customer Journey Foundation</h4>
        <p>Before diving into processes, successful businesses map their Customer Journey with clear stages and Ascension Points—moments when customers are most likely to:</p>
        <ul style={{ paddingLeft: '20px', listStyleType: 'circle', marginTop: '5px' }}>
            <li>Provide testimonials or case studies</li>
            <li>Make referrals to colleagues</li>
            <li>Upgrade or expand their engagement</li>
            <li>Become community advocates</li>
        </ul>
        <p>This journey mapping directly informs when and how you implement each of the 5 R's.</p>
        
        <hr style={{ margin: '25px 0', border: '0', borderTop: '1px solid #ddd' }} />

        <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Delivery to Success Process Assessment</h3>
        <h4 style={{ marginTop: '15px' }}>Introduction</h4>
        <p>This assessment focuses on your entire service/product delivery process, examining how effectively you execute your core offering, ensure customer satisfaction, and convert customers into advocates using the 5 R's framework. We're evaluating your ability to deliver quality consistently, measure outcomes, address issues, and develop long-term customer relationships that fuel business growth.</p>
        
        <h4 style={{ marginTop: '20px' }}>Scoring Scale:</h4>
        <ul style={{ paddingLeft: '20px', listStyleType: 'square', marginTop: '5px' }}>
            <li>7 points = Excellent systems and processes in place</li>
            <li>5 points = Good systems that need minor improvements</li>
            <li>3 points = Basic systems exist but need significant improvement</li>
            <li>1 point = Minimal or ad-hoc approach</li>
            <li>0 points = No systems exist or unknown</li>
        </ul>

        <h4 style={{ marginTop: '20px' }}>Owner Involvement Scoring:</h4>
        <ul style={{ paddingLeft: '20px', listStyleType: 'square', marginTop: '5px' }}>
            <li>Not at all / Informed = 5 points (best delegation)</li>
            <li>Consulted = 3 points</li>
            <li>Accountable = 1 point</li>
            <li>Responsible = 0 points (owner dependency)</li>
        </ul>
    </div>
);
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
const D2S_SECTION_NAME = "Delivery to Success Assessment";
    // --- Renderizado principal del paso ---
    return (
        <div className="step">
            <h2>{sectionTitle}</h2>
            {sectionTitle === D2S_SECTION_NAME && <D2SIntroductoryText />}
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