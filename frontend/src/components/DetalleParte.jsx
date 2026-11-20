import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ESTADOS, EstadoBadge } from './estados';
import { exportarPNG } from './Croquis/exportarPNG';
import { COLOR_LETRA, VEHICULOS } from './Croquis/constantes';

// El croquis se dibuja con Konva: se descarga solo al abrir un parte
const VistaCroquis = lazy(() => import('./Croquis/VistaCroquis'));

function descargar(href, nombre) {
  const a = document.createElement('a');
  a.href = href;
  a.download = nombre;
  a.click();
}

// Texto legible de un valor del historial
function valorLegible(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (v === true) return 'Sí';
  if (v === false) return 'No';
  return ESTADOS[v]?.texto ?? String(v);
}

const ACCIONES = { creado: 'creó el parte', editado: 'editó el parte', estado: 'cambió el estado' };

// Ventana con el parte completo: estado, conductores, croquis, historial y exportación (PNG y JSON)
export default function DetalleParte({ id, onCerrar, onEditar, onCambio }) {
  const { user } = useAuth();
  const esAdmin = user?.role === 'admin';
  const [parte, setParte] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState('');
  const [cambiando, setCambiando] = useState(false);
  const stageRef = useRef(null);

  const cargar = useCallback(() => {
    api.get(`/submissions/${id}`)
      .then(({ data }) => setParte(data))
      .catch(() => setError('No se pudo cargar el parte.'));
    api.get(`/submissions/${id}/historial`)
      .then(({ data }) => setHistorial(data))
      .catch(() => setHistorial([]));
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (estado) => {
    if (estado === parte.estado) return;
    if (estado === 'cerrado' && !window.confirm('Un parte cerrado ya no se puede editar. ¿Cerrarlo?')) return;
    setCambiando(true);
    setError('');
    try {
      await api.patch(`/submissions/${id}/estado`, { estado });
      onCambio?.(`Estado cambiado a «${ESTADOS[estado].texto}» ✓`);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cambiar el estado');
    } finally {
      setCambiando(false);
    }
  };

  const cerrado = parte?.estado === 'cerrado';
  // Un parte cerrado solo puede reabrirlo un administrador
  const puedeCambiarEstado = parte && (!cerrado || esAdmin);

  // Esc cierra la ventana
  useEffect(() => {
    const alPulsar = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [onCerrar]);

  const nombreArchivo = parte ? `parte_${parte.id.slice(0, 8)}` : '';

  const descargarJSON = () => {
    const { croquis_png, ...datos } = parte; // la imagen no hace falta en el JSON
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    descargar(url, `${nombreArchivo}.json`);
    URL.revokeObjectURL(url);
  };

  const descargarPNG = () => {
    const png = exportarPNG(stageRef.current, parte.croquis?.ancho) || parte.croquis_png;
    if (png) descargar(png, `${nombreArchivo}_croquis.png`);
  };

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-detalle" onClick={(e) => e.stopPropagation()}>
        <header className="modal-cabecera">
          <h2 id="titulo-detalle">Parte de accidente</h2>
          <button type="button" className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </header>

        {error && <p className="form-error">{error}</p>}
        {!parte && !error && <p className="empty-state">Cargando...</p>}

        {parte && (
          <>
            <div className="detalle-estado">
              <div className="detalle-estado-actual">
                <span>Estado</span>
                <EstadoBadge estado={parte.estado} />
                {parte.updated_at && <small>Última modificación: {new Date(parte.updated_at).toLocaleString('es-ES')}</small>}
              </div>
              <div className="detalle-estado-acciones">
                {puedeCambiarEstado && (
                  <label className="selector-estado">
                    <span className="sr-only">Cambiar estado</span>
                    <select value={parte.estado} disabled={cambiando} onChange={(e) => cambiarEstado(e.target.value)}>
                      {Object.entries(ESTADOS).map(([clave, e]) => (
                        <option key={clave} value={clave}>{cerrado && clave !== 'cerrado' ? `Reabrir: ${e.texto}` : e.texto}</option>
                      ))}
                    </select>
                  </label>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={cerrado}
                  title={cerrado ? 'Un parte cerrado no se puede editar' : 'Editar los datos del parte'}
                  onClick={() => onEditar?.(parte)}
                >
                  ✏️ Editar
                </button>
              </div>
            </div>
            {cerrado && (
              <p className="detalle-nota">
                Este parte está cerrado y no se puede editar.{' '}
                {esAdmin ? 'Como administrador, puedes reabrirlo cambiando su estado.' : 'Solo un administrador puede reabrirlo.'}
              </p>
            )}

            <dl className="detalle-datos">
              <div><dt>Lugar</dt><dd>{parte.lugar}</dd></div>
              <div><dt>Hora</dt><dd><span className="badge">{parte.hora_accidente}</span></dd></div>
              <div><dt>Registrado</dt><dd>{new Date(parte.created_at).toLocaleString('es-ES')} · {parte.created_by}</dd></div>
            </dl>

            <h3 className="detalle-subtitulo">Conductores</h3>
            <ul className="detalle-conductores">
              {parte.conductores.map((c) => (
                <li key={c.letra} style={{ '--color-conductor': COLOR_LETRA[c.letra].color }}>
                  <span className="conductor-letra">{c.letra}</span>
                  <div>
                    <strong>{c.nombre} {c.apellidos}</strong>
                    <span>{VEHICULOS[c.vehiculo]?.etiqueta} · <span className="matricula">{c.matricula}</span></span>
                    {c.aseguradora && <span>{c.aseguradora}</span>}
                    {c.danos && <span className="conductor-danos">Daños: {c.danos}</span>}
                  </div>
                </li>
              ))}
            </ul>

            <h3 className="detalle-subtitulo">Heridos y daños</h3>
            <div className="detalle-danos">
              <div className={parte.heridos ? 'alerta' : 'ok'}>
                <strong>{parte.heridos ? `🚑 ${parte.num_heridos} herido${parte.num_heridos === 1 ? '' : 's'}` : 'Sin heridos'}</strong>
                {parte.heridos_detalle && <p>{parte.heridos_detalle}</p>}
              </div>
              <div className={parte.danos_terceros ? 'alerta' : 'ok'}>
                <strong>{parte.danos_terceros ? '⚠️ Daños a otros bienes' : 'Sin daños a otros bienes'}</strong>
                {parte.danos_terceros_detalle && <p>{parte.danos_terceros_detalle}</p>}
              </div>
            </div>
            {parte.testigos && (
              <p className="detalle-texto"><strong>Testigos:</strong> {parte.testigos}</p>
            )}

            {parte.descripcion && (
              <>
                <h3 className="detalle-subtitulo">Qué ocurrió</h3>
                <p className="detalle-texto detalle-descripcion">{parte.descripcion}</p>
              </>
            )}

            <h3 className="detalle-subtitulo">Croquis</h3>
            {parte.croquis ? (
              <>
                <div className="detalle-croquis">
                  <Suspense fallback={<p className="empty-state">Dibujando el croquis...</p>}>
                    <VistaCroquis escena={parte.croquis} onStageReady={(s) => { stageRef.current = s; }} />
                  </Suspense>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={descargarJSON}>Descargar JSON</button>
                  <button type="button" className="btn btn-primary" onClick={descargarPNG}>Descargar PNG</button>
                </div>
              </>
            ) : (
              <p className="empty-state">Este parte no tiene croquis.</p>
            )}

            <h3 className="detalle-subtitulo">Historial</h3>
            <ol className="historial">
              {historial.map((h) => (
                <li key={h.id} className={`historial-${h.accion}`}>
                  <div className="historial-cabecera">
                    <strong>{h.user_email}</strong> {ACCIONES[h.accion]}
                    <time dateTime={h.created_at}>{new Date(h.created_at).toLocaleString('es-ES')}</time>
                  </div>
                  {h.cambios.length > 0 && (
                    <ul className="historial-cambios">
                      {h.cambios.map((c, i) => (
                        <li key={i}>
                          <span className="historial-campo">{c.campo}:</span>{' '}
                          {c.campo === 'Croquis'
                            ? 'se modificó el croquis'
                            : <><del>{valorLegible(c.antes)}</del> → <ins>{valorLegible(c.despues)}</ins></>}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              {!historial.length && <li className="empty-state">Sin registros.</li>}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
