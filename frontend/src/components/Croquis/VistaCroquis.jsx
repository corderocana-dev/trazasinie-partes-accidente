import Canvas from './Canvas';

// Croquis de solo lectura (detalle del parte): se dibuja desde sus datos
export default function VistaCroquis({ escena, onStageReady }) {
  return <Canvas escena={escena} soloLectura onStageReady={onStageReady} />;
}
