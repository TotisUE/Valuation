// src/pages/AdminSubmissionsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
// Asegúrate que la ruta a tu contexto Supabase sea correcta
import { SupabaseContext } from '../context/SupabaseProvider';
// Podrías añadir un componente Link de react-router-dom si quieres enlazar a detalles
// import { Link } from 'react-router-dom';

function AdminSubmissionsPage() {
    const supabase = useContext(SupabaseContext);
    // Estado para guardar la lista de sumisiones
    const [submissions, setSubmissions] = useState([]);
    // Estado para indicar si se están cargando los datos
    const [loading, setLoading] = useState(true);
    // Estado para guardar cualquier error que ocurra al cargar
    const [error, setError] = useState(null);

    // --- Efecto para Cargar Datos al Montar el Componente ---
    useEffect(() => {
        // Define una función asíncrona dentro del efecto para poder usar await
        const fetchSubmissions = async () => {
            setLoading(true);
            setError(null);
            console.log("AdminSubmissionsPage: Attempting to fetch submissions...");

            if (!supabase) {
                setError("Supabase client not available.");
                setLoading(false);
                return;
            }

            try {
                // --- Obtener el token JWT de la sesión actual ---
                // Es necesario para autenticar la llamada a la Netlify Function
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError; // Error al obtener sesión

                if (!session) {
                    // Esto no debería pasar si ProtectedRoute funciona, pero es una doble verificación
                    console.warn("AdminSubmissionsPage: No active session found. Cannot fetch data.");
                    setError("No active session. Please log in again.");
                    // Podríamos redirigir aquí, pero ProtectedRoute ya debería haberlo hecho
                    setLoading(false);
                    return;
                }

                const token = session.access_token;
                console.log("AdminSubmissionsPage: Session token retrieved.");

                // --- Llamar a la Netlify Function ---
                // La URL es relativa a la raíz del sitio, apuntando a la función desplegada
                const response = await fetch('/.netlify/functions/get-submissions-list', {
                    method: 'GET',
                    headers: {
                        // ¡IMPORTANTE! Enviar el token para autenticación/autorización
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log(`AdminSubmissionsPage: API Response Status: ${response.status}`);

                // Verificar si la respuesta de la API fue exitosa (códigos 2xx)
                if (!response.ok) {
                    // Intentar leer el mensaje de error del cuerpo de la respuesta
                    const errorBody = await response.text();
                    console.error(`AdminSubmissionsPage: API Error ${response.status}: ${errorBody}`);
                    throw new Error(`Failed to fetch submissions: ${response.status} ${errorBody || response.statusText}`);
                }

                // Si la respuesta fue OK, convertir el cuerpo JSON a un objeto JS
                const data = await response.json();
                console.log("AdminSubmissionsPage: Submissions fetched successfully:", data);
                setSubmissions(data); // Guardar los datos en el estado

            } catch (error) {
                // Capturar cualquier error (obtener sesión, fetch, parseo JSON)
                console.error("AdminSubmissionsPage: Error fetching submissions:", error.message);
                setError(`Error loading submissions: ${error.message}`);
            } finally {
                // Asegurarse de quitar el estado de carga, incluso si hubo error
                setLoading(false);
                console.log("AdminSubmissionsPage: Fetch attempt finished.");
            }
        };

        fetchSubmissions(); // Llama a la función para cargar datos cuando el componente se monta

        // El array vacío [] significa que este efecto se ejecuta solo una vez,
        // similar a componentDidMount en componentes de clase.
    }, [supabase]); // Dependencia: volver a ejecutar si cambia el cliente supabase

    // --- Renderizado Condicional ---
    if (loading) {
        return <div>Loading submissions...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    // --- Renderizado de la Tabla (si no hay carga ni error) ---
    return (
        <div className="admin-submissions-container"> {/* Puedes añadir estilos */}
            <h2>Submitted Valuations</h2>
            {submissions.length === 0 ? (
                <p>No completed submissions found.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Submission Date</th>
                            <th>User Email</th>
                            <th>Business Stage</th>
                            <th>Estimated Valuation</th>
                            <th>Actions</th> {/* Columna para botones/links */}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Iterar sobre cada sumisión y crear una fila */}
                        {submissions.map((submission) => (
                            <tr key={submission.id}> {/* key única para cada fila */}
                                {/* Formatear la fecha para que sea legible */}
                                <td>{new Date(submission.created_at).toLocaleString()}</td>
                                <td>{submission.user_email}</td>
                                <td>{submission.stage || 'N/A'}</td>
                                {/* Formatear el número como moneda */}
                                <td>{submission.estimated_valuation != null
                                        ? `$${submission.estimated_valuation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                        : 'N/A'
                                    }
                                </td>
                                <td>
                                    {/* Aquí iría un botón o Link para ver detalles */}
                                    {/* <button onClick={() => alert(`View details for ID: ${submission.id}`)}>Details</button> */}
                                    {/* O un Link si tienes ruta de detalles: */}
                                    {/* <Link to={`/admin/submissions/${submission.id}`}>Details</Link> */}
                                    <span>(Details view not implemented yet)</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminSubmissionsPage;