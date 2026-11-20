import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import Carretera from './Carretera';
import ElementoEscena from './ElementoEscena';
import { LIENZO } from './constantes';

// Ancho disponible del contenedor (para escalar el lienzo a la pantalla)
export function useAnchoContenedor() {
  const ref = useRef(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entrada]) => setAncho(Math.floor(entrada.contentRect.width)));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, ancho];
}

/**
 * Lienzo del croquis. La escena siempre mide LIENZO (800 x 420) y se escala al ancho
 * disponible: así se ve igual en el editor, en el detalle y en el móvil.
 * Con soloLectura no se puede seleccionar ni mover nada.
 */
export default function Canvas({
  escena, seleccionadoId, onSeleccionar, onMover, onTransformar, onDeseleccionar, onStageReady,
  soloLectura = false,
}) {
  const [contenedorRef, anchoDisponible] = useAnchoContenedor();
  const transformerRef = useRef();
  const stageRef = useRef();

  const lienzo = { ancho: escena.ancho || LIENZO.ancho, alto: escena.alto || LIENZO.alto };
  const escala = anchoDisponible ? anchoDisponible / lienzo.ancho : 0;

  // Entrega el Stage al padre (para exportar el PNG)
  useEffect(() => {
    if (stageRef.current) onStageReady?.(stageRef.current);
  }, [onStageReady, escala]);

  // Conecta el marco de selección (Transformer) al elemento seleccionado
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const nodo = seleccionadoId ? tr.getStage()?.findOne('#' + seleccionadoId) : null;
    tr.nodes(nodo ? [nodo] : []);
    tr.getLayer()?.batchDraw();
  }, [seleccionadoId, escena]);

  const alPulsarFondo = useCallback((e) => {
    if (e.target === e.target.getStage()) onDeseleccionar?.();
  }, [onDeseleccionar]);

  return (
    <div ref={contenedorRef} className={`canvas-container ${soloLectura ? 'solo-lectura' : ''}`}>
      {escala > 0 && (
        <Stage
          ref={stageRef}
          width={lienzo.ancho * escala}
          height={lienzo.alto * escala}
          scaleX={escala}
          scaleY={escala}
          onMouseDown={soloLectura ? undefined : alPulsarFondo}
          onTouchStart={soloLectura ? undefined : alPulsarFondo}
        >
          <Carretera ancho={lienzo.ancho} alto={lienzo.alto} />

          <Layer listening={!soloLectura}>
            {escena.elementos.map((el) => (
              <ElementoEscena
                key={el.id}
                elemento={el}
                seleccionado={el.id === seleccionadoId}
                onSeleccionar={onSeleccionar}
                onMover={onMover}
                onTransformar={onTransformar}
                soloLectura={soloLectura}
              />
            ))}

            {!soloLectura && (
              <Transformer
                ref={transformerRef}
                rotateEnabled
                resizeEnabled
                keepRatio={false}
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                borderStroke="#2ed87a"
                borderStrokeWidth={1.5}
                anchorFill="#fff"
                anchorStroke="#1a2a4a"
                anchorSize={9}
                anchorCornerRadius={2}
                rotateAnchorOffset={22}
              />
            )}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
