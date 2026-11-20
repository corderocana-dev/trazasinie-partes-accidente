// Exporta el croquis como PNG sin el marco de selección y a tamaño real (800 px de ancho),
// aunque en pantalla se vea más pequeño.
// Va en un archivo aparte para no cargar Konva hasta que hace falta.
export function exportarPNG(stage, anchoReal = 800) {
  if (!stage) return null;
  const marcos = stage.find('Transformer');
  marcos.forEach((t) => t.hide());
  const png = stage.toDataURL({ pixelRatio: anchoReal / stage.width() });
  marcos.forEach((t) => t.show());
  return png;
}
