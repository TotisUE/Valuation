// src/main.jsx
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css'; // Importar CSS aquí
import App from './App.jsx'; // Importar App aquí

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <BrowserRouter> {/* Envolver App aquí */}
      <App />
    </BrowserRouter>
  </StrictMode>,
);