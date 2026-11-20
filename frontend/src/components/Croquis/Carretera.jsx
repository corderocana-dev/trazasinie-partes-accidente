import { Layer, Rect, Line } from 'react-konva';

// Fondo del croquis: un cruce de dos carreteras con aceras y líneas discontinuas
export default function Carretera({ ancho, alto }) {
  const cx = ancho / 2;
  const cy = alto / 2;
  const roadW = 100;
  const acera = 14;
  const color = '#4a4540';

  const discontinua = (desde, hasta, fijo, horizontal) =>
    Array.from({ length: Math.max(0, Math.ceil((hasta - desde) / 30)) }, (_, i) => {
      const a = desde + i * 30;
      const b = Math.min(a + 18, hasta);
      return (
        <Line
          key={`${horizontal ? 'h' : 'v'}${desde}-${i}`}
          points={horizontal ? [a, fijo, b, fijo] : [fijo, a, fijo, b]}
          stroke={color}
          strokeWidth={2}
        />
      );
    });

  return (
    <Layer listening={false}>
      <Rect x={0} y={0} width={ancho} height={alto} fill="#1e1c1a" />

      {/* Aceras */}
      <Rect x={0} y={cy - roadW / 2 - acera} width={ancho} height={acera} fill="#2a2825" />
      <Rect x={0} y={cy + roadW / 2} width={ancho} height={acera} fill="#2a2825" />
      <Rect x={cx - roadW / 2 - acera} y={0} width={acera} height={alto} fill="#2a2825" />
      <Rect x={cx + roadW / 2} y={0} width={acera} height={alto} fill="#2a2825" />

      {/* Calzadas */}
      <Rect x={0} y={cy - roadW / 2} width={ancho} height={roadW} fill="#2d2b28" />
      <Rect x={cx - roadW / 2} y={0} width={roadW} height={alto} fill="#2d2b28" />

      {/* Bordes */}
      {[cy - roadW / 2, cy + roadW / 2].map((y) => (
        <Line key={`by${y}`} points={[0, y, ancho, y]} stroke="#3d3b38" strokeWidth={1} />
      ))}
      {[cx - roadW / 2, cx + roadW / 2].map((x) => (
        <Line key={`bx${x}`} points={[x, 0, x, alto]} stroke="#3d3b38" strokeWidth={1} />
      ))}

      {/* Líneas centrales discontinuas (sin pintar dentro del cruce) */}
      {discontinua(0, cx - roadW / 2, cy, true)}
      {discontinua(cx + roadW / 2, ancho, cy, true)}
      {discontinua(0, cy - roadW / 2, cx, false)}
      {discontinua(cy + roadW / 2, alto, cx, false)}
    </Layer>
  );
}
