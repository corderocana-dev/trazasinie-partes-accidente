import EditorCroquis from '../Croquis/EditorCroquis';

// Paso 4: croquis y descripción de lo ocurrido (casillas 13 y 14 del parte amistoso)
export default function PasoCroquis({ escena, onChange, onStageReady, descripcion, onDescripcion }) {
  return (
    <div className="step">
      <h2 className="step-title">Croquis y descripción</h2>
      <p className="step-desc">
        Paso 4 de 4 — Coloca los vehículos como quedaron y cuenta con tus palabras qué pasó.
      </p>
      <EditorCroquis escena={escena} onChange={onChange} onStageReady={onStageReady} />

      <div className="field campo-descripcion">
        <label htmlFor="descripcion">¿Qué ocurrió? <span className="opcional">(opcional)</span></label>
        <textarea id="descripcion" rows={3} maxLength={2000} value={descripcion}
          onChange={(e) => onDescripcion(e.target.value)}
          placeholder="Ej. El vehículo A circulaba por la avenida con el semáforo en verde cuando el vehículo B salió de la calle Olmo sin detenerse en el stop." />
      </div>
    </div>
  );
}
