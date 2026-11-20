import { useState, useCallback, useEffect } from 'react';
import Paleta from './Paleta';
import Canvas from './Canvas';
import { LIENZO } from './constantes';

// Primera letra libre para un vehículo extra (A-D suelen ser de los conductores)
function siguienteLetra(elementos) {
  const usadas = new Set(elementos.filter((e) => e.tipo === 'vehiculo').map((e) => e.letra));
  for (let i = 0; i < 26; i++) {
    const letra = String.fromCharCode(65 + i);
    if (!usadas.has(letra)) return letra;
  }
  return '?';
}

/**
 * Editor del croquis del accidente (paso 3 del parte).
 * Es un componente controlado: la escena vive en el formulario padre.
 * onStageReady entrega el Stage de Konva para exportar la imagen al guardar.
 */
export default function EditorCroquis({ escena, onChange, onStageReady }) {
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const elementos = escena.elementos;
  const seleccionado = elementos.find((e) => e.id === seleccionadoId) ?? null;

  const actualizar = useCallback(
    (fn) => onChange((prev) => ({ ...prev, elementos: fn(prev.elementos) })),
    [onChange]
  );

  const agregar = useCallback((tipo) => {
    const id = crypto.randomUUID();
    actualizar((lista) => {
      const letra = tipo.tipo === 'vehiculo' ? siguienteLetra(lista) : undefined;
      return [...lista, {
        id,
        tipo: tipo.tipo,
        subtipo: tipo.subtipo,
        letra,
        etiqueta: letra ? `${tipo.etiqueta} ${letra}` : tipo.etiqueta,
        color: tipo.color,
        colorBorde: tipo.colorBorde,
        forma: tipo.forma,
        ancho: tipo.ancho,
        alto: tipo.alto,
        // Cerca del cruce, con un pequeño desplazamiento para que no se apilen
        x: LIENZO.ancho / 2 + Math.round(Math.random() * 80 - 40),
        y: LIENZO.alto / 2 + Math.round(Math.random() * 80 - 40),
        rotacion: 0,
        scaleX: 1,
        scaleY: 1,
      }];
    });
    setSeleccionadoId(id);
  }, [actualizar]);

  const mover = useCallback((id, { x, y }) => {
    actualizar((lista) => lista.map((el) => (el.id === id ? { ...el, x, y } : el)));
  }, [actualizar]);

  const transformar = useCallback((id, cambios) => {
    actualizar((lista) => lista.map((el) => (el.id === id ? { ...el, ...cambios } : el)));
  }, [actualizar]);

  const eliminar = useCallback(() => {
    if (!seleccionadoId) return;
    actualizar((lista) => lista.filter((el) => el.id !== seleccionadoId));
    setSeleccionadoId(null);
  }, [seleccionadoId, actualizar]);

  const girar = useCallback((grados) => {
    if (!seleccionadoId) return;
    actualizar((lista) => lista.map((el) =>
      el.id === seleccionadoId ? { ...el, rotacion: ((el.rotacion + grados) % 360 + 360) % 360 } : el
    ));
  }, [seleccionadoId, actualizar]);

  const limpiar = () => {
    if (elementos.length && !window.confirm('¿Borrar todo el croquis?')) return;
    actualizar(() => []);
    setSeleccionadoId(null);
  };

  // Atajos: Supr elimina, Esc deselecciona, R gira 45° (no actúan mientras se escribe)
  useEffect(() => {
    const alPulsar = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); eliminar(); }
      if (e.key === 'Escape') setSeleccionadoId(null);
      if (e.key === 'r' || e.key === 'R') girar(e.shiftKey ? -45 : 45);
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [eliminar, girar]);

  return (
    <div className="croquis">
      <Paleta onAgregar={agregar} />

      <div className="croquis-lienzo">
        <div className="croquis-barra">
          <span className="croquis-info">
            {seleccionado
              ? `${seleccionado.etiqueta} · ${seleccionado.rotacion}°`
              : `${elementos.length} elemento${elementos.length === 1 ? '' : 's'}`}
          </span>
          <div className="croquis-botones">
            <button type="button" className="btn-croquis" onClick={() => girar(-45)} disabled={!seleccionado} title="Girar a la izquierda (Mayús + R)">⟲</button>
            <button type="button" className="btn-croquis" onClick={() => girar(45)} disabled={!seleccionado} title="Girar a la derecha (R)">⟳</button>
            <button type="button" className="btn-croquis peligro" onClick={eliminar} disabled={!seleccionado}>Eliminar</button>
            <button type="button" className="btn-croquis" onClick={limpiar} disabled={!elementos.length}>Limpiar</button>
          </div>
        </div>

        <Canvas
          escena={escena}
          seleccionadoId={seleccionadoId}
          onSeleccionar={setSeleccionadoId}
          onMover={mover}
          onTransformar={transformar}
          onDeseleccionar={() => setSeleccionadoId(null)}
          onStageReady={onStageReady}
        />

        <p className="croquis-ayuda">
          Los vehículos de los conductores ya están colocados: arrástralos a su sitio · selecciónalos para girarlos o cambiar su tamaño · añade más elementos desde la lista
        </p>
      </div>
    </div>
  );
}
