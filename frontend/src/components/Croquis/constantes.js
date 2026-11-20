// Datos compartidos entre el formulario, el editor y la vista del croquis

export const LETRAS = ['A', 'B', 'C', 'D'];

export const VEHICULOS = {
  coche:     { etiqueta: 'Coche',     ancho: 64, alto: 30 },
  moto:      { etiqueta: 'Moto',      ancho: 40, alto: 18 },
  camion:    { etiqueta: 'Camión',    ancho: 96, alto: 42 },
  furgoneta: { etiqueta: 'Furgoneta', ancho: 72, alto: 36 },
};

// Cada conductor tiene un color: así se reconoce su vehículo en el croquis
export const COLOR_LETRA = {
  A: { color: '#3b82f6', colorBorde: '#93c5fd' },
  B: { color: '#d97706', colorBorde: '#fbbf24' },
  C: { color: '#7c3aed', colorBorde: '#c4b5fd' },
  D: { color: '#0d9488', colorBorde: '#5eead4' },
};

// Tamaño de referencia del lienzo (los partes de ejemplo usan este)
export const LIENZO = { ancho: 800, alto: 420 };

// Dónde aparece cada vehículo al entrar al croquis: uno por cada entrada del cruce,
// circulando por su carril (frente del vehículo = lado derecho del dibujo)
function posicionInicial(letra, { ancho, alto }) {
  const cx = ancho / 2;
  const cy = alto / 2;
  return {
    A: { x: cx - 160, y: cy + 26, rotacion: 0 },    // viene por la izquierda, hacia la derecha
    B: { x: cx + 26, y: cy + 130, rotacion: 270 },  // viene por abajo, hacia arriba
    C: { x: cx + 160, y: cy - 26, rotacion: 180 },  // viene por la derecha, hacia la izquierda
    D: { x: cx - 26, y: cy - 130, rotacion: 90 },   // viene por arriba, hacia abajo
  }[letra];
}

export const etiquetaVehiculo = (c) =>
  `${VEHICULOS[c.vehiculo].etiqueta} ${c.letra}${c.matricula ? ` · ${c.matricula.toUpperCase()}` : ''}`;

// Vehículo del croquis para un conductor (nuevo, o actualizando el que ya había)
export function vehiculoDeConductor(conductor, lienzo, existente) {
  const v = VEHICULOS[conductor.vehiculo];
  const base = existente ?? {
    id: crypto.randomUUID(),
    tipo: 'vehiculo',
    forma: 'rect',
    scaleX: 1,
    scaleY: 1,
    ...posicionInicial(conductor.letra, lienzo),
  };
  return {
    ...base,
    subtipo: conductor.vehiculo,
    letra: conductor.letra,
    etiqueta: etiquetaVehiculo(conductor),
    ancho: v.ancho,
    alto: v.alto,
    ...COLOR_LETRA[conductor.letra],
  };
}
