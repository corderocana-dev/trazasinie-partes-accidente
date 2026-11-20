import { useState, useRef, lazy, Suspense } from 'react';
import PasoLugar from './PasoLugar';
import PasoConductores, { conductorVacio } from './PasoConductores';
import PasoDanos from './PasoDanos';
import { exportarPNG } from '../Croquis/exportarPNG';
import { LIENZO, vehiculoDeConductor } from '../Croquis/constantes';
import api from '../../services/api';

// El editor del croquis (Konva) solo se descarga al llegar al último paso
const PasoCroquis = lazy(() => import('./PasoCroquis'));

const TOTAL_PASOS = 4;
const PASO_CROQUIS = 4;
const datosIniciales = () => ({
  lugar: '',
  hora_accidente: '',
  conductores: [conductorVacio('A'), conductorVacio('B')],
  heridos: false,
  num_heridos: '',
  heridos_detalle: '',
  danos_terceros: false,
  danos_terceros_detalle: '',
  testigos: '',
  descripcion: '',
});
const escenaInicial = () => ({ ...LIENZO, elementos: [] });

// Al editar: rellena el formulario con el parte guardado (los null pasan a '' para los inputs)
function datosDesdeParte(parte) {
  const t = (v) => v ?? '';
  return {
    lugar: parte.lugar,
    hora_accidente: parte.hora_accidente,
    conductores: parte.conductores.map((c) => ({ ...c, aseguradora: t(c.aseguradora), danos: t(c.danos) })),
    heridos: parte.heridos,
    num_heridos: parte.num_heridos ? String(parte.num_heridos) : '',
    heridos_detalle: t(parte.heridos_detalle),
    danos_terceros: parte.danos_terceros,
    danos_terceros_detalle: t(parte.danos_terceros_detalle),
    testigos: t(parte.testigos),
    descripcion: t(parte.descripcion),
  };
}

// Al editar: el croquis guardado, marcando qué vehículos son de los conductores
function escenaDesdeParte(parte) {
  if (!parte.croquis) return escenaInicial();
  const letras = parte.conductores.map((c) => c.letra);
  return {
    ...LIENZO,
    ...parte.croquis,
    elementos: parte.croquis.elementos.map((el) =>
      el.tipo === 'vehiculo' && letras.includes(el.letra) ? { ...el, vinculado: true } : el
    ),
  };
}

/**
 * Pone en el croquis un vehículo por conductor (con su letra, color y matrícula).
 * Si ya estaba, solo actualiza sus datos y lo deja donde el usuario lo colocó.
 * Si se quitó un conductor, desaparece su vehículo.
 */
function sincronizarVehiculos(escena, conductores) {
  const letras = conductores.map((c) => c.letra);
  const elementos = escena.elementos
    .filter((el) => !el.vinculado || letras.includes(el.letra))
    .map((el) => {
      const c = el.tipo === 'vehiculo' && conductores.find((x) => x.letra === el.letra);
      return c ? { ...vehiculoDeConductor(c, escena, el), vinculado: true } : el;
    });
  conductores.forEach((c) => {
    if (!elementos.some((el) => el.tipo === 'vehiculo' && el.letra === c.letra)) {
      elementos.push({ ...vehiculoDeConductor(c, escena), vinculado: true });
    }
  });
  return { ...escena, elementos };
}

// Sirve para crear un parte nuevo o, si recibe "parte", para editarlo
export default function FormularioParte({ parte = null, onSuccess }) {
  const editando = Boolean(parte);
  const [step, setStep] = useState(1);
  const [datos, setDatos] = useState(() => (editando ? datosDesdeParte(parte) : datosIniciales()));
  const [escena, setEscena] = useState(() => (editando ? escenaDesdeParte(parte) : escenaInicial()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const stageRef = useRef(null);

  const cambiar = (campo, valor) => setDatos((prev) => ({ ...prev, [campo]: valor }));

  // Valida el paso actual antes de avanzar
  const validarPaso = () => {
    if (step === 1) {
      if (!datos.lugar.trim()) return 'Indica el lugar del accidente.';
      if (!datos.hora_accidente) return 'Selecciona la hora del accidente.';
    }
    if (step === 2) {
      for (const c of datos.conductores) {
        if (!c.nombre.trim() || !c.apellidos.trim()) return `Faltan el nombre o los apellidos del conductor ${c.letra}.`;
        if (!c.matricula.trim()) return `Falta la matrícula del conductor ${c.letra}.`;
      }
    }
    if (step === 3) {
      if (datos.heridos && !(Number(datos.num_heridos) >= 1 && Number(datos.num_heridos) <= 99)) {
        return 'Indica cuántos heridos hubo.';
      }
      if (datos.danos_terceros && !datos.danos_terceros_detalle.trim()) return 'Describe qué otros bienes se dañaron.';
    }
    return '';
  };

  const handleNext = (e) => {
    e.preventDefault();
    const fallo = validarPaso();
    if (fallo) return setError(fallo);
    setError('');
    if (step === PASO_CROQUIS - 1) setEscena((prev) => sincronizarVehiculos(prev, datos.conductores));
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const hayCroquis = escena.elementos.length > 0;
    const envio = {
      ...datos,
      num_heridos: datos.heridos ? Number(datos.num_heridos) : null,
      croquis: hayCroquis
        ? { ...escena, elementos: escena.elementos.map(({ vinculado, ...el }) => el) }
        : null,
      croquis_png: hayCroquis ? exportarPNG(stageRef.current) : null,
    };

    try {
      if (editando) {
        const { data } = await api.put(`/submissions/${parte.id}`, envio);
        onSuccess?.(data.sinCambios ? 'No había cambios que guardar' : 'Cambios guardados ✓');
      } else {
        await api.post('/submissions', envio);
        setDatos(datosIniciales());
        setEscena(escenaInicial());
        setStep(1);
        onSuccess?.('Parte creado ✓');
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || data?.errors?.[0]?.msg || 'Error al guardar. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const ultimo = step === TOTAL_PASOS;

  return (
    <div className={`step-form-wrapper ${step === 2 || step === PASO_CROQUIS ? 'step-form-ancho' : ''}`}>
      {editando && <p className="form-editando">✏️ Editando el parte de <b>{parte.lugar}</b>. Los cambios quedarán en su historial.</p>}
      <div className="progress-bar">
        {Array.from({ length: TOTAL_PASOS }, (_, i) => (
          <div key={i} className={`progress-segment ${step > i ? 'active' : ''}`} />
        ))}
      </div>

      <form onSubmit={ultimo ? handleSubmit : handleNext} noValidate>
        {step === 1 && <PasoLugar data={datos} onChange={cambiar} />}
        {step === 2 && <PasoConductores conductores={datos.conductores} onChange={(lista) => cambiar('conductores', lista)} />}
        {step === 3 && <PasoDanos data={datos} onChange={cambiar} />}
        {step === PASO_CROQUIS && (
          <Suspense fallback={<p className="step-desc">Cargando el editor del croquis...</p>}>
            <PasoCroquis
              escena={escena}
              onChange={setEscena}
              onStageReady={(stage) => { stageRef.current = stage; }}
              descripcion={datos.descripcion}
              onDescripcion={(texto) => cambiar('descripcion', texto)}
            />
          </Suspense>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="form-actions">
          {step > 1 && (
            <button type="button" className="btn btn-secondary" onClick={() => { setError(''); setStep((s) => s - 1); }}>
              Atrás
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {!ultimo ? 'Siguiente →' : submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar parte'}
          </button>
        </div>
      </form>
    </div>
  );
}
