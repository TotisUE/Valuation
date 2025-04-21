// src/App.jsx
import React from 'react';
// --- DESCOMENTAR ESTA LÍNEA ---
import MultiStepForm from './components/MultiStepForm'; // Ensure this path is correct
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Business Valuation Questionnaire</h1>
        {/* Quitar mensaje de prueba */}
      </header>
      <main>
        {/* --- DESCOMENTAR ESTA LÍNEA --- */}
        <MultiStepForm />
         {/* Quitar mensaje de prueba */}
      </main>
      <footer>
        <p>© {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;