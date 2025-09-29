// src/components/HomePageGuard.jsx (Modificado)
import React from 'react';
import MultiStepForm from './MultiStepForm';

function HomePageGuard() {
  // Se eliminó toda la lógica de sesión y bypass.
  // Ahora este componente solo se encarga de mostrar el formulario de preguntas.
  return (
    <MultiStepForm />
  );
}

export default HomePageGuard;