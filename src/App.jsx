// src/App.jsx
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'; // Importar useLocation
import MultiStepForm from './components/MultiStepForm';
import AssessmentContinuation from './components/AssessmentContinuation'; // Asegúrate que esté descomentado
import RequestNewLink from './components/RequestNewLink'; // Asegúrate que esté importado
import './App.css';

function App() {
  // +++ LOG: Ver la ubicación actual (ruta) +++
  const location = useLocation();
  console.log(`DEBUG: App.jsx - Current location: ${location.pathname}${location.search}`);
  // +++ FIN LOG +++

  // +++ LOG: Confirmar que App se renderiza +++
  console.log("DEBUG: App.jsx - Rendering App component");
  // +++ FIN LOG +++

  return (
    <div className="App">
      {/* <Header /> */}

      {/* +++ LOG: Antes de Routes +++ */}
      {console.log("DEBUG: App.jsx - Rendering <Routes>...")}
      {/* +++ FIN LOG +++ */}

      <Routes>
        {/* Ruta Principal */}
        <Route
            path="/"
            element={
                <>
                    {/* +++ LOG: Renderizando elemento para ruta / +++ */}
                    {console.log("DEBUG: App.jsx - Rendering element for path='/'")}
                    {/* +++ FIN LOG +++ */}
                    <MultiStepForm operatingMode={'vc'} />
                </>
            }
        />

        {/* Ruta de Continuación */}
        <Route
          path="/assessment/continue"
          element={
            <>
                {/* +++ LOG: Renderizando elemento para ruta /assessment/continue +++ */}
                {console.log("DEBUG: App.jsx - Rendering element for path='/assessment/continue'")}
                {/* +++ FIN LOG +++ */}
                <AssessmentContinuation />
            </>
           }
        />

        {/* Ruta para solicitar nuevo link */}
        <Route
          path="/request-link"
          element={
            <>
                {/* +++ LOG: Renderizando elemento para ruta /request-link +++ */}
                {console.log("DEBUG: App.jsx - Rendering element for path='/request-link'")}
                {/* +++ FIN LOG +++ */}
                <RequestNewLink />
            </>
          }
        />

        {/* Puedes añadir una ruta comodín (*) para páginas no encontradas si quieres */}
        {/* <Route path="*" element={<div><h2>Page Not Found</h2></div>} /> */}
      </Routes>

      {/* <Footer /> */}
    </div>
  );
}

export default App;