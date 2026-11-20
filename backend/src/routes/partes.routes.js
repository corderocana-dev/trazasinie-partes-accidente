const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Todas las rutas requieren un JWT válido
router.use(authenticate);

const HORAS_VALIDAS = [
  '00:00 - 02:00', '02:00 - 04:00', '04:00 - 06:00', '06:00 - 08:00',
  '08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00',
  '16:00 - 18:00', '18:00 - 20:00', '20:00 - 22:00', '22:00 - 00:00',
];

const LETRAS = ['A', 'B', 'C', 'D'];
const VEHICULOS = ['coche', 'moto', 'camion', 'furgoneta'];
const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------- Croquis: validación del modelo de escena que llega del editor ----------
const TIPOS_CROQUIS = ['vehiculo', 'obstaculo', 'referencia'];
const MAX_ELEMENTOS = 100;
const MAX_PNG = 2.5 * 1024 * 1024; // ~2,5 MB de data URL

function croquisValido(croquis) {
  if (croquis === undefined || croquis === null) return true; // el croquis es opcional
  if (typeof croquis !== 'object' || !Array.isArray(croquis.elementos)) return false;
  if (croquis.elementos.length > MAX_ELEMENTOS) return false;
  const num = (v) => typeof v === 'number' && Number.isFinite(v);
  const medida = (v) => v === undefined || (num(v) && v >= 100 && v <= 4000);
  if (!medida(croquis.ancho) || !medida(croquis.alto)) return false;
  return croquis.elementos.every((el) =>
    el && typeof el === 'object' &&
    TIPOS_CROQUIS.includes(el.tipo) &&
    typeof el.subtipo === 'string' && el.subtipo.length <= 40 &&
    (el.letra === undefined || LETRAS.includes(el.letra) || /^[A-Z]$/.test(el.letra)) &&
    (el.etiqueta === undefined || (typeof el.etiqueta === 'string' && el.etiqueta.length <= 80)) &&
    num(el.x) && num(el.y) && num(el.rotacion ?? 0) &&
    num(el.scaleX ?? 1) && num(el.scaleY ?? 1)
  );
}

// Solo se guardan los campos conocidos de cada elemento (nada de propiedades extra)
function limpiarCroquis(croquis) {
  if (!croquis || !croquis.elementos.length) return null;
  const CAMPOS = ['id', 'tipo', 'subtipo', 'letra', 'etiqueta', 'x', 'y', 'rotacion', 'scaleX', 'scaleY',
                  'color', 'colorBorde', 'forma', 'ancho', 'alto'];
  return {
    ancho: croquis.ancho ?? 800,
    alto: croquis.alto ?? 420,
    elementos: croquis.elementos.map((el) =>
      Object.fromEntries(CAMPOS.filter((c) => el[c] !== undefined).map((c) => [c, el[c]]))
    ),
  };
}

// ---------- Conductores ----------
function conductoresValidos(lista) {
  if (!Array.isArray(lista) || lista.length < 1 || lista.length > LETRAS.length) {
    throw new Error('El parte debe tener entre 1 y 4 conductores');
  }
  const letras = lista.map((c) => c?.letra);
  if (new Set(letras).size !== letras.length) throw new Error('Hay conductores con la misma letra');
  lista.forEach((c) => {
    const texto = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
    if (!LETRAS.includes(c.letra)) throw new Error('Letra de conductor no válida');
    if (!texto(c.nombre, 150) || !texto(c.apellidos, 150)) throw new Error(`Faltan el nombre o los apellidos del conductor ${c.letra}`);
    if (!texto(c.matricula, 15)) throw new Error(`Falta la matrícula del conductor ${c.letra}`);
    if (!VEHICULOS.includes(c.vehiculo)) throw new Error(`Tipo de vehículo no válido (conductor ${c.letra})`);
    if (c.aseguradora && (typeof c.aseguradora !== 'string' || c.aseguradora.length > 120)) {
      throw new Error(`Aseguradora no válida (conductor ${c.letra})`);
    }
    if (c.danos && (typeof c.danos !== 'string' || c.danos.length > 300)) {
      throw new Error(`Los daños del vehículo ${c.letra} no pueden superar 300 caracteres`);
    }
  });
  return true;
}

// Conductores de un parte como JSON, ordenados por letra (subconsulta reutilizable)
const SQL_CONDUCTORES = `
  COALESCE((
    SELECT json_agg(json_build_object(
             'letra', c.letra, 'nombre', c.nombre, 'apellidos', c.apellidos,
             'matricula', c.matricula, 'vehiculo', c.vehiculo, 'aseguradora', c.aseguradora,
             'danos', c.danos
           ) ORDER BY c.letra)
    FROM conductores c
    WHERE c.submission_id = s.id AND c.tenant_id = s.tenant_id
  ), '[]') AS conductores`;

// Email de quien creó el parte. Si el usuario se ha borrado, se recupera del historial
// (que guarda una copia del email) para que el parte no se quede sin autor.
const SQL_AUTOR = `
  COALESCE(u.email, (
    SELECT h.user_email FROM parte_historial h
    WHERE h.submission_id = s.id AND h.tenant_id = s.tenant_id AND h.accion = 'creado'
    ORDER BY h.created_at LIMIT 1
  ), 'Usuario eliminado') AS created_by`;

// ---------- Estados e historial ----------
const ESTADOS = ['abierto', 'en_revision', 'cerrado'];

// Nombres legibles de los campos para el historial
const NOMBRES_CAMPOS = {
  lugar: 'Lugar', hora_accidente: 'Hora', heridos: 'Heridos', num_heridos: 'Número de heridos',
  heridos_detalle: 'Detalle de heridos', danos_terceros: 'Daños a otros bienes',
  danos_terceros_detalle: 'Detalle de daños a otros bienes', testigos: 'Testigos', descripcion: 'Descripción',
};
const NOMBRES_CONDUCTOR = {
  nombre: 'Nombre', apellidos: 'Apellidos', matricula: 'Matrícula', vehiculo: 'Vehículo',
  aseguradora: 'Aseguradora', danos: 'Daños',
};

// Compara el parte guardado con el nuevo y devuelve la lista de cambios [{ campo, antes, despues }]
function calcularCambios(antes, despues) {
  const cambios = [];
  const valor = (v) => (v === undefined || v === '' ? null : v);

  Object.entries(NOMBRES_CAMPOS).forEach(([clave, nombre]) => {
    if (valor(antes[clave]) !== valor(despues[clave])) {
      cambios.push({ campo: nombre, antes: valor(antes[clave]), despues: valor(despues[clave]) });
    }
  });

  LETRAS.forEach((letra) => {
    const a = antes.conductores.find((c) => c.letra === letra);
    const d = despues.conductores.find((c) => c.letra === letra);
    if (a && !d) cambios.push({ campo: `Conductor ${letra}`, antes: `${a.nombre} ${a.apellidos}`, despues: null });
    if (!a && d) cambios.push({ campo: `Conductor ${letra}`, antes: null, despues: `${d.nombre} ${d.apellidos}` });
    if (a && d) {
      Object.entries(NOMBRES_CONDUCTOR).forEach(([clave, nombre]) => {
        if (valor(a[clave]) !== valor(d[clave])) {
          cambios.push({ campo: `Conductor ${letra} · ${nombre}`, antes: valor(a[clave]), despues: valor(d[clave]) });
        }
      });
    }
  });

  // PostgreSQL (JSONB) reordena las claves al guardar: se comparan con las claves ordenadas
  const estable = (v) => (Array.isArray(v)
    ? `[${v.map(estable).join(',')}]`
    : v && typeof v === 'object'
      ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${estable(v[k])}`).join(',')}}`
      : JSON.stringify(v ?? null));
  if (estable(antes.croquis) !== estable(despues.croquis)) {
    cambios.push({ campo: 'Croquis', antes: null, despues: 'modificado' });
  }
  return cambios;
}

async function registrarHistorial(client, { parteId, tenantId, userId, accion, cambios = [] }) {
  await client.query(
    `INSERT INTO parte_historial (submission_id, tenant_id, user_id, user_email, accion, cambios)
     SELECT $1, $2, u.id, u.email, $4, $5 FROM users u WHERE u.id = $3 AND u.tenant_id = $2`,
    [parteId, tenantId, userId, accion, JSON.stringify(cambios)]
  );
}

// Lee los datos del cuerpo ya normalizados (lo mismo para crear y para editar)
function leerParte(body) {
  const texto = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const croquis = limpiarCroquis(body.croquis);
  return {
    lugar: body.lugar.trim(),
    hora_accidente: body.hora_accidente,
    heridos: body.heridos,
    // Si no hubo heridos o daños, sus detalles no se guardan aunque lleguen
    num_heridos: body.heridos ? Number(body.num_heridos) : null,
    heridos_detalle: body.heridos ? texto(body.heridos_detalle) : null,
    danos_terceros: body.danos_terceros,
    danos_terceros_detalle: body.danos_terceros ? texto(body.danos_terceros_detalle) : null,
    testigos: texto(body.testigos),
    descripcion: texto(body.descripcion),
    croquis,
    croquis_png: croquis ? body.croquis_png || null : null, // sin elementos no hay imagen
    conductores: body.conductores.map((c) => ({
      letra: c.letra,
      nombre: c.nombre.trim(),
      apellidos: c.apellidos.trim(),
      matricula: c.matricula.trim().toUpperCase(),
      vehiculo: c.vehiculo,
      aseguradora: texto(c.aseguradora),
      danos: texto(c.danos),
    })),
  };
}

async function guardarConductores(client, parteId, tenantId, conductores) {
  for (const c of conductores) {
    await client.query(
      `INSERT INTO conductores (submission_id, tenant_id, letra, nombre, apellidos, matricula, vehiculo, aseguradora, danos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [parteId, tenantId, c.letra, c.nombre, c.apellidos, c.matricula, c.vehiculo, c.aseguradora, c.danos]
    );
  }
}

// Validaciones comunes a crear y editar
const validarParte = [
  body('lugar').isString().withMessage('Indica el lugar del accidente')
    .trim().notEmpty().withMessage('Indica el lugar del accidente')
    .isLength({ max: 200 }).withMessage('El lugar no puede superar 200 caracteres'),
  body('hora_accidente').trim().isIn(HORAS_VALIDAS).withMessage('Franja horaria no válida'),
  body('conductores').custom(conductoresValidos),
  body('heridos').isBoolean({ strict: true }).withMessage('Indica si hubo heridos'),
  body('num_heridos')
    .if(body('heridos').equals('true'))
    .isInt({ min: 1, max: 99 }).withMessage('Indica cuántos heridos hubo (1-99)'),
  body('heridos_detalle').optional({ values: 'falsy' }).isString().isLength({ max: 500 })
    .withMessage('La descripción de los heridos no puede superar 500 caracteres'),
  body('danos_terceros').isBoolean({ strict: true }).withMessage('Indica si hubo daños a otros bienes'),
  body('danos_terceros_detalle')
    .if(body('danos_terceros').equals('true'))
    .isString().withMessage('Describe los daños a otros bienes')
    .trim().notEmpty().withMessage('Describe los daños a otros bienes')
    .isLength({ max: 500 }).withMessage('La descripción de los daños no puede superar 500 caracteres'),
  body('testigos').optional({ values: 'falsy' }).isString().isLength({ max: 500 })
    .withMessage('Los testigos no pueden superar 500 caracteres'),
  body('descripcion').optional({ values: 'falsy' }).isString().isLength({ max: 2000 })
    .withMessage('La descripción no puede superar 2000 caracteres'),
  body('croquis').custom(croquisValido).withMessage('El croquis no es válido'),
  body('croquis_png')
    .optional({ values: 'null' })
    .isString().withMessage('La imagen del croquis no es válida')
    .matches(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/).withMessage('La imagen del croquis no es válida')
    .isLength({ max: MAX_PNG }).withMessage('La imagen del croquis es demasiado grande'),
];

const erroresDeValidacion = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  res.status(400).json({ errors: errors.array() });
  return true;
};

// ---------- Rutas ----------

// GET /api/submissions — partes de la empresa del usuario
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.id, s.lugar, s.hora_accidente, s.created_at, s.updated_at, s.estado,
              s.heridos, s.num_heridos, s.danos_terceros,
              ${SQL_AUTOR},
              COALESCE(jsonb_array_length(s.croquis->'elementos'), 0) AS elementos_croquis,
              ${SQL_CONDUCTORES}
       FROM submissions s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.tenant_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.tenantId]  // aislamiento: siempre el tenant del token
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudieron cargar los partes' });
  }
});

// Franjas horarias válidas (antes de /:id para que no se confunda con un id)
router.get('/meta/horas', (_req, res) => {
  res.json(HORAS_VALIDAS);
});

// Comprueba el id de la URL (evita errores de PostgreSQL con ids mal formados)
router.param('id', (req, res, next, id) => {
  if (!ES_UUID.test(id)) return res.status(404).json({ error: 'Parte no encontrado' });
  next();
});

// GET /api/submissions/:id — parte completo con conductores y croquis
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.id, s.lugar, s.hora_accidente, s.croquis, s.croquis_png, s.created_at, s.updated_at, s.estado,
              s.heridos, s.num_heridos, s.heridos_detalle,
              s.danos_terceros, s.danos_terceros_detalle, s.testigos, s.descripcion,
              ${SQL_AUTOR},
              ${SQL_CONDUCTORES}
       FROM submissions s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.tenant_id = $2`,
      [req.params.id, req.user.tenantId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Parte no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo cargar el parte' });
  }
});

// GET /api/submissions/:id/historial — quién creó, editó o cambió el estado del parte
router.get('/:id/historial', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT h.id, h.accion, h.cambios, h.created_at, h.user_email
       FROM parte_historial h
       WHERE h.submission_id = $1 AND h.tenant_id = $2
       ORDER BY h.created_at DESC`,
      [req.params.id, req.user.tenantId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo cargar el historial' });
  }
});

// POST /api/submissions — crea el parte con sus conductores, en una transacción
router.post('/', validarParte, async (req, res) => {
  if (erroresDeValidacion(req, res)) return;
  const p = leerParte(req.body);
  const { userId, tenantId } = req.user;

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows: [parte] } = await client.query(
      `INSERT INTO submissions
         (tenant_id, user_id, lugar, hora_accidente, croquis, croquis_png,
          heridos, num_heridos, heridos_detalle, danos_terceros, danos_terceros_detalle, testigos, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, lugar, hora_accidente, estado, created_at`,
      [tenantId, userId, p.lugar, p.hora_accidente, p.croquis, p.croquis_png,
       p.heridos, p.num_heridos, p.heridos_detalle, p.danos_terceros, p.danos_terceros_detalle,
       p.testigos, p.descripcion]
    );
    await guardarConductores(client, parte.id, tenantId, p.conductores);
    await registrarHistorial(client, { parteId: parte.id, tenantId, userId, accion: 'creado' });
    await client.query('COMMIT');
    res.status(201).json(parte);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'No se pudo guardar el parte' });
  } finally {
    client.release();
  }
});

// PUT /api/submissions/:id — edita un parte (no si está cerrado) y guarda qué cambió
router.put('/:id', validarParte, async (req, res) => {
  if (erroresDeValidacion(req, res)) return;
  const nuevo = leerParte(req.body);
  const { userId, tenantId } = req.user;

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    // FOR UPDATE: bloquea la fila para que dos ediciones a la vez no se pisen
    const { rows: [actual] } = await client.query(
      `SELECT s.*, ${SQL_CONDUCTORES}
       FROM submissions s WHERE s.id = $1 AND s.tenant_id = $2 FOR UPDATE`,
      [req.params.id, tenantId]
    );
    if (!actual) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Parte no encontrado' });
    }
    if (actual.estado === 'cerrado') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'El parte está cerrado. Un administrador debe reabrirlo para editarlo.' });
    }

    const cambios = calcularCambios(actual, nuevo);
    if (!cambios.length) {
      await client.query('ROLLBACK');
      return res.json({ id: actual.id, sinCambios: true });
    }

    await client.query(
      `UPDATE submissions SET
         lugar = $3, hora_accidente = $4, croquis = $5, croquis_png = $6,
         heridos = $7, num_heridos = $8, heridos_detalle = $9,
         danos_terceros = $10, danos_terceros_detalle = $11, testigos = $12, descripcion = $13,
         updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [actual.id, tenantId, nuevo.lugar, nuevo.hora_accidente, nuevo.croquis, nuevo.croquis_png,
       nuevo.heridos, nuevo.num_heridos, nuevo.heridos_detalle, nuevo.danos_terceros,
       nuevo.danos_terceros_detalle, nuevo.testigos, nuevo.descripcion]
    );
    await client.query('DELETE FROM conductores WHERE submission_id = $1 AND tenant_id = $2', [actual.id, tenantId]);
    await guardarConductores(client, actual.id, tenantId, nuevo.conductores);
    await registrarHistorial(client, { parteId: actual.id, tenantId, userId, accion: 'editado', cambios });
    await client.query('COMMIT');
    res.json({ id: actual.id, cambios: cambios.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'No se pudo guardar el parte' });
  } finally {
    client.release();
  }
});

// PATCH /api/submissions/:id/estado — abierto, en revisión o cerrado.
// Cualquier usuario puede avanzar el estado; solo un administrador reabre un parte cerrado.
router.patch(
  '/:id/estado',
  [body('estado').isIn(ESTADOS).withMessage('Estado no válido')],
  async (req, res) => {
    if (erroresDeValidacion(req, res)) return;
    const { userId, tenantId, role } = req.user;
    const { estado } = req.body;

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { rows: [actual] } = await client.query(
        'SELECT id, estado FROM submissions WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
        [req.params.id, tenantId]
      );
      if (!actual) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Parte no encontrado' });
      }
      if (actual.estado === estado) {
        await client.query('ROLLBACK');
        return res.json({ id: actual.id, estado });
      }
      if (actual.estado === 'cerrado' && role !== 'admin') {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Solo un administrador puede reabrir un parte cerrado' });
      }

      await client.query(
        'UPDATE submissions SET estado = $3, updated_at = NOW() WHERE id = $1 AND tenant_id = $2',
        [actual.id, tenantId, estado]
      );
      await registrarHistorial(client, {
        parteId: actual.id, tenantId, userId, accion: 'estado',
        cambios: [{ campo: 'Estado', antes: actual.estado, despues: estado }],
      });
      await client.query('COMMIT');
      res.json({ id: actual.id, estado });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: 'No se pudo cambiar el estado' });
    } finally {
      client.release();
    }
  }
);

// DELETE /api/submissions/:id — un parte cerrado solo lo puede borrar un administrador
router.delete('/:id', async (req, res) => {
  try {
    const { rows: [actual] } = await db.query(
      'SELECT estado FROM submissions WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.user.tenantId]
    );
    if (!actual) return res.status(404).json({ error: 'Parte no encontrado' });
    if (actual.estado === 'cerrado' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo un administrador puede eliminar un parte cerrado' });
    }
    await db.query('DELETE FROM submissions WHERE id = $1 AND tenant_id = $2', [req.params.id, req.user.tenantId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo eliminar el parte' });
  }
});

module.exports = router;
