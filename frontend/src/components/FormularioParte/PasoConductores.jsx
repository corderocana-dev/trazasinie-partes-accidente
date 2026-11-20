import { LETRAS, VEHICULOS, COLOR_LETRA } from '../Croquis/constantes';

export const conductorVacio = (letra) => ({
  letra, nombre: '', apellidos: '', matricula: '', vehiculo: 'coche', aseguradora: '', danos: '',
});

// Paso 2: conductores implicados (A, B, C, D), como en el parte amistoso
export default function PasoConductores({ conductores, onChange }) {
  const cambiar = (letra, campo, valor) =>
    onChange(conductores.map((c) => (c.letra === letra ? { ...c, [campo]: valor } : c)));

  const anadir = () => {
    const libre = LETRAS.find((l) => !conductores.some((c) => c.letra === l));
    if (libre) onChange([...conductores, conductorVacio(libre)]);
  };

  const quitar = (letra) => onChange(conductores.filter((c) => c.letra !== letra));

  return (
    <div className="step">
      <h2 className="step-title">Conductores implicados</h2>
      <p className="step-desc">
        Paso 2 de 4 — Cada conductor tiene una letra y un color; su vehículo aparecerá así en el croquis.
      </p>

      <div className="conductores">
        {conductores.map((c) => (
          <fieldset key={c.letra} className="conductor" style={{ '--color-conductor': COLOR_LETRA[c.letra].color }}>
            <legend>
              <span className="conductor-letra">{c.letra}</span>
              Conductor {c.letra}
            </legend>
            {conductores.length > 1 && (
              <button type="button" className="conductor-quitar" onClick={() => quitar(c.letra)} aria-label={`Quitar conductor ${c.letra}`}>
                Quitar
              </button>
            )}

            <div className="conductor-campos">
              <div className="field">
                <label htmlFor={`nombre-${c.letra}`}>Nombre</label>
                <input id={`nombre-${c.letra}`} value={c.nombre} maxLength={150}
                  onChange={(e) => cambiar(c.letra, 'nombre', e.target.value)} placeholder="Ej. María" />
              </div>
              <div className="field">
                <label htmlFor={`apellidos-${c.letra}`}>Apellidos</label>
                <input id={`apellidos-${c.letra}`} value={c.apellidos} maxLength={150}
                  onChange={(e) => cambiar(c.letra, 'apellidos', e.target.value)} placeholder="Ej. García López" />
              </div>
              <div className="field">
                <label htmlFor={`vehiculo-${c.letra}`}>Vehículo</label>
                <select id={`vehiculo-${c.letra}`} value={c.vehiculo}
                  onChange={(e) => cambiar(c.letra, 'vehiculo', e.target.value)}>
                  {Object.entries(VEHICULOS).map(([valor, v]) => <option key={valor} value={valor}>{v.etiqueta}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`matricula-${c.letra}`}>Matrícula</label>
                <input id={`matricula-${c.letra}`} value={c.matricula} maxLength={15} className="input-matricula"
                  onChange={(e) => cambiar(c.letra, 'matricula', e.target.value.toUpperCase())} placeholder="Ej. 1234 ABC" />
              </div>
              <div className="field">
                <label htmlFor={`aseguradora-${c.letra}`}>Aseguradora <span className="opcional">(opcional)</span></label>
                <input id={`aseguradora-${c.letra}`} value={c.aseguradora} maxLength={120}
                  onChange={(e) => cambiar(c.letra, 'aseguradora', e.target.value)} placeholder="Compañía del vehículo" />
              </div>
              <div className="field">
                <label htmlFor={`danos-${c.letra}`}>Daños visibles <span className="opcional">(opcional)</span></label>
                <input id={`danos-${c.letra}`} value={c.danos} maxLength={300}
                  onChange={(e) => cambiar(c.letra, 'danos', e.target.value)} placeholder="Ej. Puerta delantera izquierda hundida" />
              </div>
            </div>
          </fieldset>
        ))}
      </div>

      {conductores.length < LETRAS.length && (
        <button type="button" className="btn btn-secondary btn-anadir" onClick={anadir}>
          + Añadir conductor {LETRAS.find((l) => !conductores.some((c) => c.letra === l))}
        </button>
      )}
    </div>
  );
}
