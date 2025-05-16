// src/components/HomePageGuard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Añadir useNavigate
import { SupabaseContext } from '../context/SupabaseProvider';
import MultiStepForm from './MultiStepForm';

function HomePageGuard() {
    const supabase = useContext(SupabaseContext);
    const navigate = useNavigate(); // Para el logout del bypass
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBypassLoggedIn, setIsBypassLoggedIn] = useState(false);

    useEffect(() => {
        // Verificar si hay un bypass activo desde localStorage
        const bypassStatus = localStorage.getItem('devBypassUserLoggedIn');
        if (bypassStatus === 'true') {
            console.log("HomePageGuard: Detected bypass login from localStorage.");
            setIsBypassLoggedIn(true);
            setIsLoading(false); // Consideramos cargado si el bypass está activo
            return; // No necesitamos verificar la sesión real de Supabase si el bypass está activo
        }

        // Si no hay bypass, proceder con la verificación normal de Supabase
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            setIsLoading(false);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            // Si el usuario hace logout real de Supabase, también quitar el bypass
            if (!newSession) {
                localStorage.removeItem('devBypassUserLoggedIn');
                setIsBypassLoggedIn(false);
            }
            if (isLoading) setIsLoading(false);
        });

        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, [supabase, isLoading]);

    const handleBypassLogout = () => {
        localStorage.removeItem('devBypassUserLoggedIn');
        setIsBypassLoggedIn(false);
        // Opcionalmente, si tienes un logout real de Supabase que quieres llamar:
        // if (supabase && session) supabase.auth.signOut();
        navigate('/login'); // Redirigir a login
    };

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Loading...</h2>
            </div>
        );
    }

    // Si hay sesión REAL de Supabase O si el bypass está activo
    if (session || isBypassLoggedIn) {
        // Opcional: Mostrar botón de logout para el modo bypass
       let logoutButtonForBypass = null;
        if (isBypassLoggedIn && !session) { // Solo mostrar si es bypass y no hay sesión real
             logoutButtonForBypass = (
                <button onClick={handleBypassLogout} style={{position: 'absolute', top: '10px', right: '10px', backgroundColor: 'orange'}}>
                    Logout (Bypass)
                </button>
            );
        }
        return (
            <>
                {logoutButtonForBypass}
                <MultiStepForm />
            </>
        );
    }

    // Si no hay sesión ni bypass, mostrar la página de bienvenida/login
    return (
        <div style={{ textAlign: 'center', padding: '50px', border: '1px solid #e0e0e0', borderRadius: '8px', margin: '20px auto', maxWidth: '600px' }}>
            <h2>Welcome to the Business Valuation Tool</h2>
            <p style={{ fontSize: '1.1em', margin: '20px 0' }}>
                To access the valuation form, please log in or create an account.
            </p>
            <div style={{ marginTop: '30px' }}>
                <Link to="/login" style={{ textDecoration: 'none', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', borderRadius: '5px', marginRight: '15px' }}>
                    Login
                </Link>
                <Link to="/signup" style={{ textDecoration: 'none', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', borderRadius: '5px' }}>
                    Sign Up
                </Link>
            </div>
        </div>
    );
}

export default HomePageGuard;


