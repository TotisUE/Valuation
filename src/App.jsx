// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MultiStepForm from './components/MultiStepForm';
import AssessmentContinuation from './components/AssessmentContinuation'; // Aún comentado
import './App.css';
import RequestNewLink from './components/RequestNewLink';

function App() {
  return (
    <div className="App">
      {/* <Header /> */}
      
      <Routes>
        <Route path="/" element={<MultiStepForm />} />
        <Route path="/assessment/continue"element={ <div> element={<AssessmentContinuation />} </div> }/>
        <Route path="/request-link" element={<RequestNewLink />} />
        {/* <Route path="*" element={<div><h2>Page Not Found</h2></div>} /> */}
      </Routes>
      {/* <Footer /> */}
    </div>
  );
}

export default App;
// -----------> ¡NADA MÁS DESPUÉS DE ESTA LÍNEA! <-----------