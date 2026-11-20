import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';

export default function RecuperarContrasena() {
  const [form, setForm] = useState({ tenantSlug: '', email: '' });
  const [estado, setEstado] = useState('idle'); // idle | loading | enviado | error
  const [mensaje, setMensaje] = useState('');

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tenantSlug.trim() || !form.email.trim()) {
      setMensaje('Rellena todos los campos.');
      setEstado('error');
      return;
    }
    setEstado('loading');
    try {
      await api.post('/auth/recuperar-contrasena', form);
      setEstado('enviado');
    } catch (err) {
      setMensaje(err.response?.data?.error || 'No se pudo procesar la solicitud.');
      setEstado('error');
    }
  };

  if (estado === 'enviado') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="feedback-icon">✓</div>
          <h1>Revisa tu email</h1>
          <p className="feedback-text">
            Si el email introducido existe en nuestra base de datos, recibirás
            un enlace para restablecer tu contraseña en los próximos minutos.
          </p>
          <div className="auth-links">
            <Link to="/login">← Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand"><Logo /></div>

        <h1>Recuperar contraseña</h1>
        <p className="auth-desc">
          Introduce tu organización y email. Te enviaremos un enlace para crear una nueva contraseña.
        </p>

        <div className="auth-divider" />

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="tenantSlug">Organización (slug)</label>
            <input
              id="tenantSlug" type="text" value={form.tenantSlug}
              onChange={set('tenantSlug')} placeholder="mi-empresa"
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" value={form.email}
              onChange={set('email')} placeholder="usuario@ejemplo.com"
            />
          </div>

          {estado === 'error' && <p className="form-error">{mensaje}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={estado === 'loading'}>
            {estado === 'loading' ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">← Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
}
