// Definición de todos los tipos de elementos disponibles en la paleta.
// Cada elemento tiene: tipo (categoría), subtipo, etiqueta, color de relleno,
// forma geométrica en el canvas, y dimensiones base.

export const PALETA = [
  {
    tipo: 'vehiculo',
    etiqueta: 'Vehículos',
    colorCategoria: '#3b82f6',
    items: [
      { subtipo: 'coche',      etiqueta: 'Coche',      color: '#3b82f6', colorBorde: '#60a5fa', forma: 'rect',     ancho: 64,  alto: 30 },
      { subtipo: 'moto',       etiqueta: 'Moto',        color: '#2563eb', colorBorde: '#3b82f6', forma: 'rect',     ancho: 40,  alto: 18 },
      { subtipo: 'camion',     etiqueta: 'Camión',      color: '#1e40af', colorBorde: '#3b82f6', forma: 'rect',     ancho: 96,  alto: 42 },
      { subtipo: 'furgoneta',  etiqueta: 'Furgoneta',   color: '#1d4ed8', colorBorde: '#60a5fa', forma: 'rect',     ancho: 72,  alto: 36 },
    ]
  },
  {
    tipo: 'obstaculo',
    etiqueta: 'Obstáculos',
    colorCategoria: '#f59e0b',
    items: [
      { subtipo: 'valla',  etiqueta: 'Valla',   color: '#d97706', colorBorde: '#fbbf24', forma: 'rect',     ancho: 80,  alto: 12 },
      { subtipo: 'cono',   etiqueta: 'Cono',    color: '#f59e0b', colorBorde: '#fde68a', forma: 'triangle', ancho: 26,  alto: 26 },
      { subtipo: 'señal',  etiqueta: 'Señal',   color: '#dc2626', colorBorde: '#fca5a5', forma: 'triangle', ancho: 32,  alto: 32 },
    ]
  },
  {
    tipo: 'referencia',
    etiqueta: 'Entorno',
    colorCategoria: '#22c55e',
    items: [
      { subtipo: 'arbol',    etiqueta: 'Árbol',    color: '#16a34a', colorBorde: '#4ade80', forma: 'circle', ancho: 34, alto: 34 },
      { subtipo: 'edificio', etiqueta: 'Edificio', color: '#475569', colorBorde: '#94a3b8', forma: 'rect',   ancho: 60, alto: 60 },
      { subtipo: 'farola',   etiqueta: 'Farola',   color: '#92400e', colorBorde: '#d97706', forma: 'circle', ancho: 18, alto: 18 },
    ]
  }
]
