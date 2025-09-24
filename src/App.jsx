// src/App.jsx
import React, { useEffect } from 'react';
import MultiStepForm from './components/MultiStepForm';
import './App.css';
import logoImage from './assets/logobrain.png';

function App() {
  useEffect(() => {
    // Aplicar fondo azul que cubra toda la página
    document.body.style.background = 'linear-gradient(to bottom, #5DADE2 250px, #f4f6f8 250px)';
    document.body.style.minHeight = '100vh';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    return () => {
      document.body.style.background = '';
      document.body.style.minHeight = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      padding: '0',
      margin: '0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: '80px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '800px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        padding: '30px',
        margin: '0 20px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{marginBottom: '25px'}}>
          <img src={logoImage} alt="Logo de Acquira" style={{height: '45px'}} />
        </div>
        <MultiStepForm />
      </div>
    </div>
  );
}

export default App;