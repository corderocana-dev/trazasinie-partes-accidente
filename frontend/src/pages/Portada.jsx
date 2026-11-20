import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const VENTAJAS = [
  {
    icono: '✏️',
    titulo: 'Croquis interactivo',
    texto: 'Los vehículos de cada conductor aparecen solos en el cruce: se colocan, giran y completan con señales y obstáculos. Se exporta en PNG o JSON.',
  },
  {
    icono: '🏢',
    titulo: 'Un espacio por empresa',
    texto: 'Cada empresa ve solo sus partes y su equipo. El aislamiento se aplica en el token, en cada consulta y en la base de datos.',
  },
  {
    icono: '👥',
    titulo: 'Equipo con roles',
    texto: 'El administrador da de alta a sus tramitadores y es el único que puede reabrir o borrar un parte cerrado.',
  },
  {
    icono: '🕓',
    titulo: 'Estados e historial',
    texto: 'Cada parte pasa de abierto a en revisión y cerrado. Toda edición queda registrada: quién cambió qué y cuándo.',
  },
];

// Comparativa: cómo se gestionan los accidentes sin TrazaSinie y con TrazaSinie
const COMPARATIVA = [
  ['Los datos llegan por teléfono, email o papel y cada uno los apunta a su manera', 'Un formulario de cuatro pasos guía al tramitador y recoge siempre lo mismo'],
  ['El croquis es una foto de un dibujo a mano, difícil de leer', 'Croquis digital con cada vehículo en el color y la letra de su conductor'],
  ['Nadie sabe quién corrigió un dato ni cuándo', 'Cada cambio queda en el historial del parte, con su autor y la fecha'],
  ['Para saber cómo va un caso hay que preguntar', 'Cada parte tiene un estado: abierto, en revisión o cerrado'],
];

const PASOS = [
  { titulo: 'Crea la cuenta de tu empresa', texto: 'Nombre de la empresa, tu email y una contraseña. Serás el administrador.' },
  { titulo: 'Añade a tu equipo', texto: 'Desde «Usuarios» das de alta a tus tramitadores con su rol.' },
  { titulo: 'Registra y sigue cada accidente', texto: 'Lugar, conductores, heridos y daños, croquis… y después, su estado hasta cerrarlo.' },
];

// Ilustración del croquis (SVG estático, ligero: no carga el editor)
function CroquisIlustracion() {
  return (
    <svg className="portada-croquis" viewBox="0 0 420 300" role="img" aria-label="Ejemplo de croquis: dos vehículos chocan en un cruce">
      <rect width="420" height="300" fill="#1e1c1a" />
      {/* Aceras y carreteras */}
      <rect x="0" y="108" width="420" height="84" fill="#2a2825" />
      <rect x="168" y="0" width="84" height="300" fill="#2a2825" />
      <rect x="0" y="116" width="420" height="68" fill="#2d2b28" />
      <rect x="176" y="0" width="68" height="300" fill="#2d2b28" />
      <path d="M0 150h168M252 150h168M210 0v108M210 192v108" stroke="#4a4540" strokeWidth="2" strokeDasharray="14 10" />
      {/* Árboles y edificio */}
      <circle cx="70" cy="60" r="16" fill="#16a34a" stroke="#4ade80" strokeWidth="1.5" />
      <circle cx="120" cy="245" r="14" fill="#16a34a" stroke="#4ade80" strokeWidth="1.5" />
      <rect x="300" y="30" width="56" height="56" rx="3" fill="#475569" stroke="#94a3b8" />
      {/* Trayectorias */}
      <path d="M40 166 C110 166 150 166 188 160" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 5" fill="none" opacity=".7" />
      <path d="M224 290 C224 240 224 210 222 178" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 5" fill="none" opacity=".7" />
      {/* Vehículo A */}
      <g transform="translate(196 160)">
        <rect x="-30" y="-14" width="60" height="28" rx="9" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" />
        <rect x="6" y="-10" width="15" height="20" rx="2" fill="rgba(160,215,255,.55)" />
        <text x="-8" y="-21" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.7)">Coche A</text>
      </g>
      {/* Vehículo B, girado */}
      <g transform="translate(226 196) rotate(-80)">
        <rect x="-30" y="-14" width="60" height="28" rx="9" fill="#d97706" stroke="#fbbf24" strokeWidth="1.5" />
        <rect x="6" y="-10" width="15" height="20" rx="2" fill="rgba(160,215,255,.55)" />
      </g>
      <text x="262" y="232" fontSize="10" fill="rgba(255,255,255,.7)">Coche B</text>
      {/* Punto de impacto */}
      <path d="M226 160l5 9 10-3-6 8 8 7-10 0-1 10-6-8-8 6 2-10-9-4 9-4z" fill="#f87171" stroke="#fecaca" />
      {/* Cono */}
      <polygon points="150,200 160,218 140,218" fill="#f59e0b" stroke="#fde68a" />
    </svg>
  );
}

export default function Portada() {
  const { user } = useAuth();

  return (
    <div className="portada">
      <header className="portada-nav">
        <Logo claro />
        <nav className="portada-nav-acciones" aria-label="Acceso">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Ir al panel →</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-claro">Entrar</Link>
              <Link to="/register" className="btn btn-primary">Crear cuenta de empresa</Link>
            </>
          )}
        </nav>
      </header>

      <section className="portada-hero">
        <div className="portada-hero-texto">
          <span className="portada-etiqueta">Gestión de partes de accidente para empresas</span>
          <h1>Todos los accidentes de tu empresa, <span>en un solo sitio.</span></h1>
          <p>
            <b>TrazaSinie</b> es una herramienta web para empresas que gestionan accidentes de tráfico:
            aseguradoras, flotas de vehículos, talleres o gestorías. Tu equipo registra cada parte
            —conductores, heridos, daños y un croquis interactivo— y lo sigue hasta cerrarlo.
          </p>
          <p>
            Sin papeles ni emails sueltos: cada parte tiene su estado y un historial con todos los cambios.
          </p>
          <div className="portada-cta">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-grande">Ir al panel →</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-grande">Crear cuenta de empresa</Link>
                <Link to="/login" className="btn btn-claro btn-grande">Ya tengo cuenta</Link>
              </>
            )}
          </div>
        </div>
        <CroquisIlustracion />
      </section>

      <main>
        <section className="portada-seccion" aria-labelledby="titulo-que-es">
          <h2 id="titulo-que-es">¿Qué es TrazaSinie?</h2>
          <p className="portada-intro">
            Cuando un cliente o un conductor de tu empresa tiene un accidente, alguien tiene que registrar
            qué pasó y hacer el seguimiento. TrazaSinie es el lugar donde tu equipo lo hace: más rápido de
            registrar, más claro de leer y con todo controlado. Los conductores no necesitan cuenta: los
            partes los registran tus empleados.</p>
          <p className="portada-intro portada-nota">
            No sustituye al parte amistoso firmado por los conductores: sirve para gestionarlo dentro de
            tu empresa.
          </p>
          <div className="portada-comparativa" role="table" aria-label="Gestión sin TrazaSinie frente a con TrazaSinie">
            <div className="portada-comparativa-fila portada-comparativa-cabecera" role="row">
              <span role="columnheader">📝 Sin TrazaSinie</span>
              <span role="columnheader">⚡ Con TrazaSinie</span>
            </div>
            {COMPARATIVA.map(([antes, ahora]) => (
              <div key={antes} className="portada-comparativa-fila" role="row">
                <span role="cell" className="antes">{antes}</span>
                <span role="cell" className="ahora">{ahora}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="portada-seccion" aria-labelledby="titulo-ventajas">
          <h2 id="titulo-ventajas">Qué puedes hacer</h2>
          <div className="portada-ventajas">
            {VENTAJAS.map((v) => (
              <article key={v.titulo} className="portada-ventaja">
                <span className="portada-ventaja-icono" aria-hidden="true">{v.icono}</span>
                <h3>{v.titulo}</h3>
                <p>{v.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="portada-seccion" aria-labelledby="titulo-pasos">
          <h2 id="titulo-pasos">Cómo empezar</h2>
          <ol className="portada-pasos">
            {PASOS.map((p, i) => (
              <li key={p.titulo}>
                <span className="portada-paso-num">{i + 1}</span>
                <div>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
          {!user && (
            <div className="portada-cta portada-cta-centro">
              <Link to="/register" className="btn btn-primary btn-grande">Empezar ahora</Link>
            </div>
          )}
        </section>
      </main>

      <footer className="portada-pie">
        TrazaSinie · Proyecto de portfolio con datos ficticios · React, Node.js, PostgreSQL y Konva
      </footer>
    </div>
  );
}
