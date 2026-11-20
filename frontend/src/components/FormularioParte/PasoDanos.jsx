// Paso 3: heridos, daños a otros bienes y testigos (casillas 2, 3 y 5 del parte amistoso)

function SiNo({ nombre, valor, onChange }) {
  return (
    <div className="si-no" role="radiogroup">
      {[['No', false], ['Sí', true]].map(([texto, v]) => (
        <label key={texto} className={valor === v ? 'activo' : ''}>
          <input type="radio" name={nombre} checked={valor === v} onChange={() => onChange(v)} />
          {texto}
        </label>
      ))}
    </div>
  );
}

export default function PasoDanos({ data, onChange }) {
  return (
    <div className="step">
      <h2 className="step-title">Heridos y daños</h2>
      <p className="step-desc">Paso 3 de 4 — Marca si hubo heridos (aunque sean leves) o daños a otras cosas</p>

      <fieldset className="bloque-pregunta">
        <legend>¿Hubo heridos, aunque sean leves?</legend>
        <SiNo nombre="heridos" valor={data.heridos} onChange={(v) => onChange('heridos', v)} />
        {data.heridos && (
          <div className="bloque-detalle">
            <div className="field campo-corto">
              <label htmlFor="num_heridos">Número de heridos</label>
              <input id="num_heridos" type="number" min={1} max={99} value={data.num_heridos}
                onChange={(e) => onChange('num_heridos', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="heridos_detalle">Detalle <span className="opcional">(opcional)</span></label>
              <textarea id="heridos_detalle" rows={2} maxLength={500} value={data.heridos_detalle}
                onChange={(e) => onChange('heridos_detalle', e.target.value)}
                placeholder="Ej. El conductor B con dolor cervical; atendido por la ambulancia en el lugar" />
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="bloque-pregunta">
        <legend>¿Daños a otros bienes además de los vehículos?</legend>
        <p className="bloque-ayuda">Por ejemplo una farola, una valla, una señal o un coche aparcado.</p>
        <SiNo nombre="danos_terceros" valor={data.danos_terceros} onChange={(v) => onChange('danos_terceros', v)} />
        {data.danos_terceros && (
          <div className="bloque-detalle">
            <div className="field">
              <label htmlFor="danos_terceros_detalle">¿Qué se dañó?</label>
              <textarea id="danos_terceros_detalle" rows={2} maxLength={500} value={data.danos_terceros_detalle}
                onChange={(e) => onChange('danos_terceros_detalle', e.target.value)}
                placeholder="Ej. Farola doblada en la esquina con C/ Olmo" />
            </div>
          </div>
        )}
      </fieldset>

      <div className="field">
        <label htmlFor="testigos">Testigos <span className="opcional">(opcional)</span></label>
        <textarea id="testigos" rows={2} maxLength={500} value={data.testigos}
          onChange={(e) => onChange('testigos', e.target.value)}
          placeholder="Nombre y teléfono de quien lo vio, si los hay" />
      </div>
    </div>
  );
}
