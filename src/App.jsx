// src/App.jsx
import React from 'react';
// --- COMENTAR ESTA LÍNEA ---
// import MultiStepForm from './components/MultiStepForm'; // Ensure this path is correct
import './App.css'; // Keep or adjust default styling import

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Business Valuation Questionnaire</h1>
        {/* Mensaje temporal para indicar que el App carga */}
        <p style={{color: 'lightgreen', fontStyle: 'italic'}}>(App component rendered successfully)</p>
      </header>
      <main>
        {/* --- COMENTAR ESTA LÍNEA --- */}
        {/* <MultiStepForm /> */}
        <p style={{textAlign: 'center', padding: '20px'}}>[MultiStepForm commented out for testing]</p>
      </main>
      <footer>
        {/* Add footer content if needed */}
         <p>© {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;