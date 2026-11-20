import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// soloAdmin: la página solo es para administradores (el servidor también lo comprueba)
export default function RutaPrivada({ children, soloAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (soloAdmin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}
