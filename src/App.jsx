// src/App.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom';

import HomePageGuard from './components/HomePageGuard';
import AssessmentContinuation from './components/AssessmentContinuation';
import RequestNewLink from './components/RequestNewLink';
import './App.css';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import logoImage from './assets/logobrain.png';

import { SupabaseContext } from './context/SupabaseProvider';
import AddProductServicePage from './pages/AddProductServicePage';

// --- PRIMERA Y ÚNICA DEFINICIÓN DE LogoutButton ---
function LogoutButton() {
    const supabase = useContext(SupabaseContext);
    const navigate = useNavigate();
    const [session, setSession] = useState(null);

    useEffect(() => {
        if (!supabase) return;
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
        });
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
        });
        return () => authListener?.subscription?.unsubscribe();
    }, [supabase]);

    const handleLogout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (!session) return null;

    return <button onClick={handleLogout} style={{ margin: '10px', padding: '8px 15px' }}>Logout</button>;
}
// --- FIN DE LA DEFINICIÓN DE LogoutButton ---


function App() {
  // ... (resto del código de App se mantiene igual) ...
  const location = useLocation();
  const [currentSession, setCurrentSession] = useState(null);
  const supabase = useContext(SupabaseContext);

  useEffect(() => {
      if (supabase) {
          supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
              setCurrentSession(initialSession);
          });
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
              setCurrentSession(newSession);
          });
          return () => {
              subscription?.unsubscribe();
          };
      }
  }, [supabase]);

  return (
    <div className="App">
      <header className="app-global-header">
         <div className="app-global-header-banner">
          <nav style={{ padding: '10px', textAlign: 'right', backgroundColor: '#f0f0f0' }}>
            {!currentSession ? (
              <>
                <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>
                <Link to="/signup">Sign Up</Link>
              </>
            ) : (
              <LogoutButton /> // Se usa la definición de arriba
            )}
          </nav>
        </div>
      </header>

      {/* ... (resto del JSX de App se mantiene igual) ... */}
       <main className="app-main-content">
        <div className="main-content-logo-container">
          <img src={logoImage} alt="Logo de la Empresa" className="app-logo" />
        </div>

        <Routes>
          <Route path="/" element={<HomePageGuard />} />
          <Route path="/assessment/continue" element={<AssessmentContinuation />} />
          <Route path="/request-link" element={<RequestNewLink />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="*" element={<div><h2>404 - Page Not Found</h2></div>} />
          <Route path="/add-product-service" element={<AddProductServicePage />} />
        </Routes>
      </main>
    </div>
  );
}

// ELIMINA CUALQUIER OTRA DEFINICIÓN DE LogoutButton DE AQUÍ ABAJO

export default App;


