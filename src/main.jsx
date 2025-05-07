// src/main.jsx (Modificado para incluir SupabaseProvider)
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
// --- Nueva importación ---
import { SupabaseProvider } from './context/SupabaseProvider.jsx'; // Importa el proveedor que creamos

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <BrowserRouter>
      {/* --- Envolver App con SupabaseProvider --- */}
      {/* Ahora, App y todos sus hijos pueden usar useContext(SupabaseContext) */}
      <SupabaseProvider>
        <App />
      </SupabaseProvider>
      {/* ------------------------------------------- */}
    </BrowserRouter>
  </StrictMode>,
);