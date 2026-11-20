import { Group, Rect, Circle, RegularPolygon, Line, Text, Label, Tag } from 'react-konva'

// ── Formas detalladas por subtipo ────────────────────────────────────────────

// Vista cenital de vehículo (coche, furgoneta, camión, moto)
function Vehiculo({ subtipo, color, colorBorde, ancho: w, alto: h }) {
  const hw = w / 2, hh = h / 2
  const esCamion = subtipo === 'camion'
  const esMoto   = subtipo === 'moto'

  if (esMoto) {
    return (
      <>
        {/* Chasis */}
        <Rect x={-hw} y={-hh} width={w} height={h} fill={color} stroke={colorBorde} strokeWidth={1.5} cornerRadius={hh * 0.9} />
        {/* Rueda delantera */}
        <Rect x={hw - 6} y={-hh - 3} width={5} height={h + 6} fill="#111" cornerRadius={2} />
        {/* Rueda trasera */}
        <Rect x={-hw + 1} y={-hh - 3} width={5} height={h + 6} fill="#111" cornerRadius={2} />
        {/* Manillar */}
        <Rect x={hw - 10} y={-hh - 5} width={3} height={h + 10} fill={colorBorde} cornerRadius={1} opacity={0.6} />
      </>
    )
  }

  if (esCamion) {
    const cabW = w * 0.28
    return (
      <>
        {/* Caja de carga */}
        <Rect x={-hw} y={-hh} width={w - cabW} height={h} fill={color} stroke={colorBorde} strokeWidth={1} cornerRadius={2} opacity={0.85} />
        {/* Cabina */}
        <Rect x={hw - cabW} y={-hh} width={cabW} height={h} fill={color} stroke={colorBorde} strokeWidth={1.5} cornerRadius={[2, hh * 0.5, hh * 0.5, 2]} />
        {/* Parabrisas cabina */}
        <Rect x={hw - cabW + 3} y={-hh + h * 0.15} width={cabW - 5} height={h * 0.7} fill="rgba(160,215,255,0.45)" cornerRadius={2} />
        {/* 6 ruedas */}
        {[-hw - 1, hw * 0.05, hw - 7].map((rx, i) => [
          <Rect key={`rt${i}`} x={rx} y={-hh - 4} width={6} height={5} fill="#111" cornerRadius={1} />,
          <Rect key={`rb${i}`} x={rx} y={hh - 1} width={6} height={5} fill="#111" cornerRadius={1} />,
        ])}
      </>
    )
  }

  // Coche / Furgoneta
  const esVan = subtipo === 'furgoneta'
  const frontRadius = esVan ? hh * 0.3 : hh * 0.6
  const rearRadius  = esVan ? hh * 0.2 : hh * 0.4
  return (
    <>
      {/* Carrocería */}
      <Rect x={-hw} y={-hh} width={w} height={h} fill={color} stroke={colorBorde} strokeWidth={1.5}
        cornerRadius={[frontRadius, rearRadius, rearRadius, frontRadius]} />
      {/* Parabrisas delantero (lado derecho = frente) */}
      <Rect x={hw * 0.25} y={-hh + h * 0.14} width={w * 0.28} height={h * 0.72} fill="rgba(160,215,255,0.5)" cornerRadius={2} />
      {/* Luneta trasera */}
      <Rect x={-hw + w * 0.05} y={-hh + h * 0.18} width={w * 0.2} height={h * 0.64} fill="rgba(160,215,255,0.3)" cornerRadius={2} />
      {/* 4 ruedas */}
      <Rect x={hw * 0.35} y={-hh - 4} width={w * 0.22} height={5} fill="#111" cornerRadius={1} />
      <Rect x={hw * 0.35} y={hh - 1} width={w * 0.22} height={5} fill="#111" cornerRadius={1} />
      <Rect x={-hw * 0.88} y={-hh - 4} width={w * 0.22} height={5} fill="#111" cornerRadius={1} />
      <Rect x={-hw * 0.88} y={hh - 1} width={w * 0.22} height={5} fill="#111" cornerRadius={1} />
    </>
  )
}

// Valla con patrón de rayas
function Valla({ color, colorBorde, ancho: w, alto: h }) {
  const hw = w / 2, hh = h / 2
  const stripeW = 10
  const stripes = Math.floor(w / stripeW)
  return (
    <>
      <Rect x={-hw} y={-hh} width={w} height={h} fill={color} stroke={colorBorde} strokeWidth={1} cornerRadius={2} />
      {Array.from({ length: stripes }).map((_, i) =>
        i % 2 === 0 ? null : (
          <Rect key={i} x={-hw + i * stripeW} y={-hh} width={stripeW} height={h} fill="rgba(0,0,0,0.25)" />
        )
      )}
      {/* Puntales laterales */}
      <Rect x={-hw - 2} y={-hh - 4} width={4} height={h + 8} fill={colorBorde} cornerRadius={1} />
      <Rect x={hw - 2}  y={-hh - 4} width={4} height={h + 8} fill={colorBorde} cornerRadius={1} />
    </>
  )
}

// Cono con franja blanca
function Cono({ color, colorBorde, ancho }) {
  const r = ancho / 2 + 2
  return (
    <>
      <RegularPolygon sides={3} radius={r} fill={color} stroke={colorBorde} strokeWidth={1.5} />
      {/* Franja blanca horizontal */}
      <Rect x={-r * 0.45} y={-1} width={r * 0.9} height={3} fill="white" opacity={0.75} />
      {/* Base */}
      <Rect x={-r * 0.65} y={r * 0.52} width={r * 1.3} height={3} fill={colorBorde} cornerRadius={1} />
    </>
  )
}

// Señal de peligro
function Senal({ color, colorBorde, ancho }) {
  const r = ancho / 2 + 3
  return (
    <>
      <RegularPolygon sides={3} radius={r} fill={color} stroke="white" strokeWidth={2.5} />
      <RegularPolygon sides={3} radius={r - 4} fill="transparent" stroke="white" strokeWidth={1} opacity={0.4} />
      <Text text="!" fontSize={Math.round(r * 0.7)} fontStyle="bold" fill="white"
        offsetX={Math.round(r * 0.7) * 0.18} offsetY={Math.round(r * 0.7) * 0.4} />
    </>
  )
}

// Árbol con tronco
function Arbol({ color, colorBorde, ancho }) {
  const r = ancho / 2
  return (
    <>
      {/* Tronco */}
      <Rect x={-3} y={r * 0.1} width={6} height={r * 0.8} fill="#7c4d1e" cornerRadius={2} />
      {/* Copa */}
      <Circle y={-r * 0.1} radius={r} fill={color} stroke={colorBorde} strokeWidth={1.5} />
      {/* Detalle copa (sombra interior) */}
      <Circle x={-r * 0.2} y={-r * 0.2} radius={r * 0.4} fill="rgba(0,0,0,0.1)" />
    </>
  )
}

// Edificio con ventanas
function Edificio({ color, colorBorde, ancho: w, alto: h }) {
  const hw = w / 2, hh = h / 2
  const cols = 2, rows = 3
  const wW = (w - 16) / cols - 4
  const wH = (h - 16) / rows - 4
  return (
    <>
      <Rect x={-hw} y={-hh} width={w} height={h} fill={color} stroke={colorBorde} strokeWidth={1.5} cornerRadius={2} />
      {Array.from({ length: cols }).map((_, c) =>
        Array.from({ length: rows }).map((_, r) => (
          <Rect
            key={`${c}-${r}`}
            x={-hw + 8 + c * (wW + 4)}
            y={-hh + 8 + r * (wH + 4)}
            width={wW} height={wH}
            fill="rgba(160,215,255,0.35)" cornerRadius={1}
          />
        ))
      )}
    </>
  )
}

// Farola: poste + brazo + lámpara
function Farola({ color, colorBorde }) {
  const poleH = 44
  return (
    <>
      {/* Poste */}
      <Rect x={-2} y={-poleH / 2} width={4} height={poleH} fill={color} stroke={colorBorde} strokeWidth={0.5} cornerRadius={2} />
      {/* Base */}
      <Rect x={-6} y={poleH / 2 - 4} width={12} height={4} fill={colorBorde} cornerRadius={2} />
      {/* Brazo */}
      <Rect x={-2} y={-poleH / 2} width={18} height={3} fill={color} cornerRadius={[0, 2, 2, 0]} />
      {/* Lente de la lámpara */}
      <Circle x={16} y={-poleH / 2 + 1} radius={5} fill="#fde68a" stroke={colorBorde} strokeWidth={0.5} />
      <Circle x={16} y={-poleH / 2 + 1} radius={3} fill="#fff" opacity={0.6} />
    </>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function ElementoEscena({ elemento, seleccionado, onSeleccionar, onMover, onTransformar, soloLectura = false }) {
  const { id, subtipo, tipo, etiqueta, color, colorBorde, forma, ancho, alto, x, y, rotacion } = elemento
  const scaleX = elemento.scaleX ?? 1
  const scaleY = elemento.scaleY ?? 1

  const handleDragEnd = (e) => {
    onMover(id, { x: Math.round(e.target.x()), y: Math.round(e.target.y()) })
  }

  const handleTransformEnd = (e) => {
    onTransformar(id, {
      x:       Math.round(e.target.x()),
      y:       Math.round(e.target.y()),
      rotacion: Math.round(e.target.rotation()),
      scaleX:  parseFloat(e.target.scaleX().toFixed(2)),
      scaleY:  parseFloat(e.target.scaleY().toFixed(2)),
    })
  }

  // Posición de la etiqueta: debajo del elemento en pantalla (se compensa el giro del grupo)
  const rad = (rotacion * Math.PI) / 180
  const radio = subtipo === 'farola' ? 26 : tipo === 'vehiculo' ? Math.max(ancho, alto) / 2 : (forma === 'rect' ? alto / 2 : ancho / 2)
  const distancia = radio + 6
  const anchoEtiqueta = (etiqueta?.length ?? 0) * 5.5 + 6

  const renderContenido = () => {
    if (tipo === 'vehiculo') return <Vehiculo subtipo={subtipo} color={color} colorBorde={colorBorde} ancho={ancho} alto={alto} />
    if (subtipo === 'valla')    return <Valla   color={color} colorBorde={colorBorde} ancho={ancho} alto={alto} />
    if (subtipo === 'cono')     return <Cono    color={color} colorBorde={colorBorde} ancho={ancho} />
    if (subtipo === 'señal')    return <Senal   color={color} colorBorde={colorBorde} ancho={ancho} />
    if (subtipo === 'arbol')    return <Arbol   color={color} colorBorde={colorBorde} ancho={ancho} />
    if (subtipo === 'edificio') return <Edificio color={color} colorBorde={colorBorde} ancho={ancho} alto={alto} />
    if (subtipo === 'farola')   return <Farola  color={color} colorBorde={colorBorde} />
    // Fallback genérico
    if (forma === 'circle') return <Circle radius={ancho / 2} fill={color} stroke={colorBorde} strokeWidth={1.5} />
    return <Rect x={-ancho/2} y={-alto/2} width={ancho} height={alto} fill={color} stroke={colorBorde} strokeWidth={1.5} cornerRadius={3} />
  }

  return (
    <Group
      id={id}
      x={x}
      y={y}
      rotation={rotacion}
      scaleX={scaleX}
      scaleY={scaleY}
      draggable={!soloLectura}
      onMouseDown={soloLectura ? undefined : (e) => { e.cancelBubble = true; onSeleccionar(id) }}
      onTouchStart={soloLectura ? undefined : (e) => { e.cancelBubble = true; onSeleccionar(id) }}
      onDragEnd={soloLectura ? undefined : handleDragEnd}
      onTransformEnd={soloLectura ? undefined : handleTransformEnd}
      opacity={seleccionado ? 0.88 : 1}
    >
      {renderContenido()}
      {/* Etiqueta siempre horizontal y debajo del elemento, gire como gire */}
      <Label
        x={distancia * Math.sin(rad) / scaleX}
        y={distancia * Math.cos(rad) / scaleY}
        rotation={-rotacion}
        scaleX={1 / scaleX}
        scaleY={1 / scaleY}
        offsetX={anchoEtiqueta / 2}
        listening={false}
      >
        <Tag fill="rgba(15, 14, 13, 0.72)" cornerRadius={3} />
        <Text
          text={etiqueta}
          fontSize={10}
          fontFamily="Consolas, ui-monospace, monospace"
          fill="rgba(255,255,255,0.85)"
          padding={3}
        />
      </Label>
    </Group>
  )
}
