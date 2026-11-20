// Estados de un parte: el orden es el del flujo habitual
export const ESTADOS = {
  abierto: { texto: 'Abierto', descripcion: 'Recién registrado, pendiente de revisar' },
  en_revision: { texto: 'En revisión', descripcion: 'Alguien del equipo lo está tramitando' },
  cerrado: { texto: 'Cerrado', descripcion: 'Tramitado. Ya no se puede editar' },
};

export function EstadoBadge({ estado }) {
  return <span className={`estado-badge estado-${estado}`}>{ESTADOS[estado]?.texto ?? estado}</span>;
}
