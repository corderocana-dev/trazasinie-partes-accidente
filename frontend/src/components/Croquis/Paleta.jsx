import { PALETA } from './tiposElemento'

// Paleta lateral con los tipos de elementos disponibles.
// Al hacer click en un item se añade al centro del canvas.

export default function Paleta({ onAgregar }) {
  return (
    <aside className="croquis-paleta" aria-label="Elementos del croquis">
      {PALETA.map((categoria) => (
        <div key={categoria.tipo}>
          <div
            className="categoria-label"
            style={{ color: categoria.colorCategoria, opacity: 0.8 }}
          >
            {categoria.etiqueta}
          </div>
          <div className="categoria-items">
            {categoria.items.map((item) => (
              <button
                type="button"
                key={item.subtipo}
                className="item-paleta"
                onClick={() => onAgregar({ ...item, tipo: categoria.tipo })}
                title={`Añadir ${item.etiqueta}`}
              >
                {/* Miniatura de la forma del elemento */}
                {item.forma === 'circle' && (
                  <span
                    className="item-icono circle"
                    style={{ background: item.color, border: `1.5px solid ${item.colorBorde}` }}
                  />
                )}
                {item.forma === 'triangle' && (
                  <span
                    className="item-icono triangle"
                    style={{ borderBottomColor: item.color }}
                  />
                )}
                {item.forma === 'rect' && (
                  <span
                    className="item-icono"
                    style={{ background: item.color, border: `1.5px solid ${item.colorBorde}` }}
                  />
                )}

                <span className="item-nombre">{item.etiqueta}</span>
                <span className="item-add">+</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  )
}
