import { Link } from 'react-router-dom';

// Logo de TrazaSinie: una ruta entre dos puntos (la "traza" del croquis)
export function IconoTraza() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16" />
    </svg>
  );
}

export default function Logo({ claro = false }) {
  return (
    <Link to="/" className={`logo ${claro ? 'logo-claro' : ''}`} aria-label="TrazaSinie, ir a la portada">
      <span className="auth-brand-icon"><IconoTraza /></span>
      <span className="logo-texto">Traza<b>Sinie</b></span>
    </Link>
  );
}
