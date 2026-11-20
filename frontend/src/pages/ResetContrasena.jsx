import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';

export default function ResetContrasena() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8)   return setError('La contraseña debe tener al menos 8 caracteres.');
    if (password !== confirmar) return setError('Las contraseñas no coinciden.');

    setLoading(true);
    try {
      await api.post('/auth/reset-contrasena', { token, password });
      navigate('/login?reset=ok');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="form-error">Enlace inválido o caducado.</p>
          <div className="auth-links">
            <Link to="/recuperar-contrasena">Solicitar nuevo enlace</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand"><Logo /></div>

        <h1>Nueva contraseña</h1>
        <p className="auth-subtitle">Elige una contraseña segura para tu cuenta</p>

        <div className="auth-divider" />

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="password">Nueva contraseña</label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div className="field">
            <label htmlFor="confirmar">Confirmar contraseña</label>
            <input
              id="confirmar" type="password" value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="••••••••"
              className={error && password !== confirmar ? 'input-error' : ''}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
