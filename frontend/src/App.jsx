import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaPrivada from './components/RutaPrivada';
import Portada from './pages/Portada';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Inicio from './pages/Inicio';
import RecuperarContrasena from './pages/RecuperarContrasena';
import ResetContrasena from './pages/ResetContrasena';
import GestionUsuarios from './pages/GestionUsuarios';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"                       element={<Portada />} />
          <Route path="/login"                  element={<Login />} />
          <Route path="/register"               element={<Registro />} />
          <Route path="/recuperar-contrasena"   element={<RecuperarContrasena />} />
          <Route path="/reset-contrasena"       element={<ResetContrasena />} />
          <Route path="/dashboard" element={<RutaPrivada><Inicio /></RutaPrivada>} />
          <Route path="/usuarios"  element={<RutaPrivada soloAdmin><GestionUsuarios /></RutaPrivada>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
