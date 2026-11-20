import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormularioParte from '../components/FormularioParte/FormularioParte';
import DetalleParte from '../components/DetalleParte';
import { COLOR_LETRA } from '../components/Croquis/constantes';
import { ESTADOS, EstadoBadge } from '../components/estados';
import api from '../services/api';

export default function Inicio() {
  const { user, logout } = useAuth();
  const esAdmin = user?.role === 'admin';
  const [partes, setPartes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState(null); // null | { parte: null (nuevo) | parte a editar }
  const [detalleId, setDetalleId] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [aviso, setAviso] = useState('');
  const formularioRef = useRef(null);
  const cerrarDetalle = useCallback(() => setDetalleId(null), []);

  const cargarPartes = useCallback(async () => {
    try {
      const { data } = await api.get('/submissions');
      setPartes(data);
    } catch (err) {
      console.error('Error cargando los partes:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarPartes(); }, [cargarPartes]);

  // Aviso breve que desaparece solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 2500);
    return () => clearTimeout(t);
  }, [aviso]);

  const abrirFormulario = (parte = null) => {
    setDetalleId(null);
    setFormulario({ parte });
    setTimeout(() => formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const alGuardar = (mensaje) => {
    const id = formulario?.parte?.id;
    setFormulario(null);
    setAviso(mensaje);
    cargarPartes();
    if (id) setDetalleId(id); // tras editar, se vuelve a ver el parte con sus cambios
  };

  const handleEliminar = async (parte) => {
    if (!window.confirm(`¿Eliminar el parte de ${parte.lugar}? No se puede deshacer.`)) return;
    try {
      await api.delete(`/submissions/${parte.id}`);
      setPartes((prev) => prev.filter((s) => s.id !== parte.id));
      setAviso('Parte eliminado');
    } catch (err) {
      setAviso(err.response?.data?.error || 'No se pudo eliminar el parte');
    }
  };

  const contar = (estado) => partes.filter((p) => p.estado === estado).length;
  const visibles = filtro === 'todos' ? partes : partes.filter((p) => p.estado === filtro);

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <span className="dash-marca">TrazaSinie</span>
          <h1>Partes de accidente</h1>
          <span className="tenant-badge" title="Identificador para iniciar sesión">
            {user?.tenantName || user?.tenantId}
            {user?.tenantSlug && <span className="tenant-slug"> · {user.tenantSlug}</span>}
          </span>
        </div>
        <div className="dash-actions">
          {esAdmin && <Link to="/usuarios" className="btn btn-secondary">Usuarios</Link>}
          <button onClick={logout} className="btn btn-secondary">Cerrar sesión</button>
        </div>
      </header>

      <main className="dash-content">
        <div ref={formularioRef}>
          {!formulario ? (
            <button className="btn btn-primary" onClick={() => abrirFormulario()}>+ Nuevo parte</button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setFormulario(null)}>Cancelar</button>
              <FormularioParte
                key={formulario.parte?.id ?? 'nuevo'}
                parte={formulario.parte}
                onSuccess={alGuardar}
              />
            </>
          )}
        </div>

        <section className="submissions-list">
          <div className="lista-cabecera">
            <h2>Partes registrados</h2>
            <div className="filtro-estados" role="tablist" aria-label="Filtrar por estado">
              {[['todos', 'Todos', partes.length], ...Object.entries(ESTADOS).map(([k, v]) => [k, v.texto, contar(k)])]
                .map(([clave, texto, n]) => (
                  <button
                    key={clave}
                    role="tab"
                    aria-selected={filtro === clave}
                    className={filtro === clave ? 'activo' : ''}
                    onClick={() => setFiltro(clave)}
                  >
                    {texto} <span>{n}</span>
                  </button>
                ))}
            </div>
          </div>

          {cargando ? (
            <p>Cargando...</p>
          ) : partes.length === 0 ? (
            <p className="empty-state">Todavía no hay partes. Crea el primero con «+ Nuevo parte».</p>
          ) : visibles.length === 0 ? (
            <p className="empty-state">No hay partes en este estado.</p>
          ) : (
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Conductores</th>
                  <th>Lugar</th>
                  <th>Hora</th>
                  <th>Parte</th>
                  <th>Creado por</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((s) => (
                  <tr key={s.id}>
                    <td><EstadoBadge estado={s.estado} /></td>
                    <td>
                      <ul className="tabla-conductores">
                        {s.conductores.map((c) => (
                          <li key={c.letra} style={{ '--color-conductor': COLOR_LETRA[c.letra].color }}>
                            <span className="conductor-letra pequena">{c.letra}</span>
                            {c.nombre} {c.apellidos}
                            <span className="matricula">{c.matricula}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>{s.lugar}</td>
                    <td><span className="badge">{s.hora_accidente}</span></td>
                    <td>
                      <div className="parte-avisos">
                        {s.heridos && <span className="aviso-chip rojo">🚑 {s.num_heridos} herido{s.num_heridos === 1 ? '' : 's'}</span>}
                        {s.danos_terceros && <span className="aviso-chip ambar">Daños a terceros</span>}
                      </div>
                      <button className="btn-ver" onClick={() => setDetalleId(s.id)}>
                        {s.elementos_croquis > 0 ? 'Ver con croquis' : 'Ver parte'}
                      </button>
                    </td>
                    <td>{s.created_by}</td>
                    <td>
                      {new Date(s.created_at).toLocaleDateString('es-ES')}
                      {s.updated_at && <small className="fecha-editado">editado {new Date(s.updated_at).toLocaleDateString('es-ES')}</small>}
                    </td>
                    <td>
                      {(s.estado !== 'cerrado' || esAdmin) && (
                        <button className="btn-delete" onClick={() => handleEliminar(s)} aria-label="Eliminar parte">✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {detalleId && (
        <DetalleParte
          id={detalleId}
          onCerrar={cerrarDetalle}
          onEditar={(parte) => abrirFormulario(parte)}
          onCambio={(mensaje) => { setAviso(mensaje); cargarPartes(); }}
        />
      )}

      {aviso && <div className="aviso-flotante" role="status">{aviso}</div>}
    </div>
  );
}
