// src/App.jsx
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'; // Importar useLocation
import MultiStepForm from './components/MultiStepForm';
import AssessmentContinuation from './components/AssessmentContinuation'; // Asegúrate que esté descomentado
import RequestNewLink from './components/RequestNewLink'; // Asegúrate que esté importado
import './App.css';
import AdminLogin from './components/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import AdminSubmissionsPage from './pages/AdminSubmissionsPage';

function App() {
  const location = useLocation();

  return (
    <div className="App">
      {console.log("DEBUG: App.jsx - Rendering <Routes>...")}
      <Routes>
        {/* === Rutas Públicas === */}
        <Route path="/" element={<MultiStepForm operatingMode={'vc'} />} />
        <Route path="/assessment/continue" element={<AssessmentContinuation />} />
        <Route path="/request-link" element={<RequestNewLink />} />

        {/* === Rutas de Administrador === */}

        {/* 1. Ruta para la página de Login (Pública) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* 2. Ruta para la lista de Sumisiones (Protegida) */}
        <Route
          path="/admin/submissions"
          element={
            // Usamos ProtectedRoute para envolver la página real
            <ProtectedRoute>
              {/* El componente que se mostrará SI el usuario está autenticado */}
              <AdminSubmissionsPage />
            </ProtectedRoute>
          }
        />


{/* --- ASEGÚRATE QUE ESTA SECCIÓN ESTÉ COMENTADA O BORRADA --- */}
        {/*
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        */}
        {/* -------------------------------------------------------- */}



        {/* Ruta Comodín Opcional (para páginas no encontradas) */}
        <Route path="*" element={<div><h2>404 - Page Not Found</h2></div>} /> 

      </Routes>
    </div>
  );
}

export default App;