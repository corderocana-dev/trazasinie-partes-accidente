export const HORAS = [
  '00:00 - 02:00', '02:00 - 04:00', '04:00 - 06:00', '06:00 - 08:00',
  '08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00',
  '16:00 - 18:00', '18:00 - 20:00', '20:00 - 22:00', '22:00 - 00:00',
];

export default function PasoLugar({ data, onChange }) {
  return (
    <div className="step">
      <h2 className="step-title">Dónde y cuándo</h2>
      <p className="step-desc">Paso 1 de 4 — Lugar y franja horaria del accidente</p>

      <div className="field">
        <label htmlFor="lugar">Lugar del accidente</label>
        <input
          id="lugar"
          type="text"
          placeholder="Ej. Calle Mayor con Av. de la Paz, Madrid"
          value={data.lugar}
          onChange={(e) => onChange('lugar', e.target.value)}
          maxLength={200}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="hora_accidente">Hora del accidente</label>
        <select
          id="hora_accidente"
          value={data.hora_accidente}
          onChange={(e) => onChange('hora_accidente', e.target.value)}
          required
        >
          <option value="">-- Selecciona una franja --</option>
          {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
    </div>
  );
}
