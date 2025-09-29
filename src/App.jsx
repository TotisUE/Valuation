// src/App.jsx (Modificado)
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Se importa el HomePageGuard ya modificado para ser la página principal.
import HomePageGuard from './components/HomePageGuard'; 

// Se mantienen los otros componentes y páginas.
import AssessmentContinuation from './components/AssessmentContinuation';
import RequestNewLink from './components/RequestNewLink';
import AddProductServicePage from './pages/AddProductServicePage';
import S2DResultsDisplayPage from './pages/S2DResultsDisplayPage';

// Estilos e imágenes
import './App.css';
import logoImage from './assets/mi-logo.png.png';

function App() {
  // Se eliminó toda la lógica de sesión y el header con login/logout.
  return (
    <div className="App">
      <header className="app-global-header">
        <div className="app-global-header-banner">
          {/* La barra de navegación <nav> con login/logout ha sido eliminada. */}
        </div>
      </header>

      <main className="app-main-content">
        <div className="main-content-logo-container">
          <img src={logoImage} alt="Logo de la Empresa" className="app-logo" />
        </div>

        <Routes>
          {/* La ruta principal ahora muestra HomePageGuard (que contiene el formulario) */}
          <Route path="/" element={<HomePageGuard />} />
          
          {/* El resto de las rutas funcionales se conservan */}
          <Route path="/assessment/continue" element={<AssessmentContinuation />} />
          <Route path="/request-link" element={<RequestNewLink />} />
          <Route path="/add-product-service" element={<AddProductServicePage />} />
          <Route path="/s2d-results" element={<S2DResultsDisplayPage />} />

          {/* Ruta para páginas no encontradas */}
          <Route path="*" element={<div><h2>404 - Page Not Found</h2></div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;