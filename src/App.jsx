// src/App.jsx
import React from 'react';
import MultiStepForm from './components/MultiStepForm'; // Asegúrate que la ruta sea correcta
import './App.css'; // Restaura la importación de CSS si la necesitas

function App() {
  // Asegúrate de que estás renderizando el MultiStepForm aquí
  // Por ejemplo:
  return (
    <div className="App">
      {/* Puedes tener otros elementos aquí, como un encabezado */}
      <MultiStepForm />
      {/* Puedes tener otros elementos aquí, como un pie de página */}
    </div>
  );

  // O si tu código original era diferente, restáuralo
  // pero asegúrate de que MultiStepForm se importa y se usa.
}

export default App;