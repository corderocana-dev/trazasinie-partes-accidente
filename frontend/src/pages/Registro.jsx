import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Logo from '../components/Logo';

// Mismo cálculo que hace el servidor para el identificador de la empresa
const calcularSlug = (nombre) => nombre
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

function leerError(err) {
  const data = err.response?.data;
  if (!data) return 'Error de conexión. Comprueba que el servidor está activo.';
  if (data.error) return data.error;
  if (Array.isArray(data.errors) && data.errors.length > 0) return data.errors[0].msg;
  return 'Algo salió mal. Inténtalo de nuevo.';
}

export default function Registro() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ tenantName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.tenantName.trim()) return setError('Introduce el nombre de tu organización.');
    if (!form.email.trim())      return setError('Introduce un email válido.');
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(leerError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand"><Logo /></div>

        <h1>Crear cuenta de empresa</h1>
        <p className="auth-subtitle">Crea el espacio de tu empresa. Serás su administrador y podrás dar de alta a tu equipo.</p>

        <div className="auth-divider" />

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="tenantName">Nombre de la organización</label>
            <input
              id="tenantName" type="text" value={form.tenantName}
              onChange={set('tenantName')} placeholder="Talleres Ejemplo S.L."
              className={error && !form.tenantName ? 'input-error' : ''}
            />
            {calcularSlug(form.tenantName) && (
              <small className="field-ayuda">
                Tu identificador para iniciar sesión será <b>{calcularSlug(form.tenantName)}</b>
              </small>
            )}
          </div>
          <div className="field">
            <label htmlFor="email">Email del administrador</label>
            <input
              id="email" type="email" value={form.email}
              onChange={set('email')} placeholder="admin@ejemplo.com"
              className={error && !form.email ? 'input-error' : ''}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña (mín. 8 caracteres)</label>
            <input
              id="password" type="password" value={form.password}
              onChange={set('password')} placeholder="••••••••"
              className={error && form.password.length < 8 ? 'input-error' : ''}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">¿Ya tienes cuenta? Iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}
