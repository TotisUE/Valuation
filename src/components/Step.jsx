// src/components/Step.jsx
import React, { useState, useEffect } from 'react';
import { getSubSectors } from '../naicsData';

// (props sin cambios: { stepIndex, questions, formData, handleChange, sectionTitle, errors = {} })
function Step({ stepIndex, questions, formData, handleChange, sectionTitle, errors = {} }) {

  // ... (useState y useEffect sin cambios) ...
  const [dependentOptions, setDependentOptions] = useState({});

  useEffect(() => {
    questions.forEach(q => {
      if (q.type === 'select_dependent') {
        const dependencyValue = formData[q.dependsOn];
        if (dependencyValue) {
          const options = q.optionsGetter(dependencyValue);
          setDependentOptions(prev => ({ ...prev, [q.id]: options }));
        } else {
          setDependentOptions(prev => ({ ...prev, [q.id]: [] }));
        }
      }
    });
  }, [formData, questions]);


  // ... (Handle case with no questions sin cambios) ...
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

        return (
          <div key={q.id} className={`question ${hasError ? 'input-error' : ''}`}>
            {/* MODIFICADO: Añadir contenedor para label y tooltip */}
            <div className="label-container">
              <label htmlFor={q.valueKey}>{q.text}</label>
              {/* NUEVO: Mostrar indicador de ayuda si existe helpText */}
              {q.helpText && (
                <span className="help-tooltip" title={q.helpText}>
                  (?) {/* Puedes usar un icono aquí si prefieres */}
                </span>
              )}
            </div>

            {/* ... (Resto del renderizado condicional para MCQ, number, email, select, etc. SIN CAMBIOS) ... */}
             {/* MCQ (Multiple Choice Question) */}
            {q.type === 'mcq' && (
              <div className="options">
                {q.options.map((option, index) => (
                  <div key={index} className="option">
                    <input
                      type="radio"
                      id={`${q.valueKey}-${index}`}
                      name={q.valueKey}
                      value={option.text}
                      checked={formData[q.valueKey] === option.text}
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
            {q.type === 'number' && (
              <input
                type="number"
                id={q.valueKey}
                name={q.valueKey}
                value={formData[q.valueKey] || ''}
                onChange={handleChange}
                placeholder={q.placeholder || 'Enter a number'}
                required={q.required}
                className="number-input"
                aria-invalid={hasError}
              />
            )}

            {/* Email Input Handling */}
            {q.type === 'email' && (
              <input
                type="email"
                id={q.valueKey}
                name={q.valueKey}
                value={formData[q.valueKey] || ''}
                onChange={handleChange}
                placeholder={q.placeholder || 'Enter email'}
                required={q.required}
                className="email-input"
                autoComplete="email"
                aria-invalid={hasError}
              />
            )}

            {/* Standard Select (Dropdown) */}
            {q.type === 'select' && (
              <select
                  id={q.valueKey}
                  name={q.valueKey}
                  value={formData[q.valueKey] || ''}
                  onChange={handleChange}
                  required={q.required}
                  className="select-input"
                  aria-invalid={hasError}
              >
                  <option value="" disabled>-- Select an option --</option>
                  {q.options.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                  ))}
              </select>
            )}

           {/* Dependent Select (Dropdown) */}
            {q.type === 'select_dependent' && (
               <select
                   id={q.valueKey}
                   name={q.valueKey}
                   value={formData[q.valueKey] || ''}
                   onChange={handleChange}
                   required={q.required}
                   className="select-input"
                   disabled={!formData[q.dependsOn]}
                   aria-invalid={hasError}
               >
                   <option value="" disabled>
                       {!formData[q.dependsOn] ? `-- Select ${q.dependsOn.replace('naics','')} first --` : '-- Select an option --'}
                   </option>
                   {(dependentOptions[q.id] || []).map((optionName, index) => (
                       <option key={index} value={optionName}>{optionName}</option>
                   ))}
               </select>
             )}


            {/* Mensaje de error (sin cambios) */}
            {hasError && (
                <span className="error-message" role="alert">
                  {/* This field is required or invalid. */}
                </span>
            )}

          </div>
        );
      })}
    </div>
  );
}

export default Step;