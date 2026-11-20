// Carga datos de ejemplo (ficticios) para probar la aplicación.
// Uso: npm run db:ejemplo
// Borra y vuelve a crear SOLO las empresas de ejemplo; no toca el resto de datos.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const CONTRASENA = 'DemoTraza2026';

// Mismos tamaños y colores que el editor del croquis (frontend)
const VEHICULOS = {
  coche:     { etiqueta: 'Coche',     ancho: 64, alto: 30 },
  moto:      { etiqueta: 'Moto',      ancho: 40, alto: 18 },
  camion:    { etiqueta: 'Camión',    ancho: 96, alto: 42 },
  furgoneta: { etiqueta: 'Furgoneta', ancho: 72, alto: 36 },
};
const COLOR_LETRA = {
  A: ['#3b82f6', '#93c5fd'],
  B: ['#d97706', '#fbbf24'],
  C: ['#7c3aed', '#c4b5fd'],
  D: ['#0d9488', '#5eead4'],
};
const OTROS = {
  cono:   { tipo: 'obstaculo',  etiqueta: 'Cono',   color: '#f59e0b', colorBorde: '#fde68a', forma: 'triangle', ancho: 26, alto: 26 },
  senal:  { tipo: 'obstaculo',  subtipo: 'señal', etiqueta: 'Señal', color: '#dc2626', colorBorde: '#fca5a5', forma: 'triangle', ancho: 32, alto: 32 },
  arbol:  { tipo: 'referencia', etiqueta: 'Árbol',  color: '#16a34a', colorBorde: '#4ade80', forma: 'circle', ancho: 34, alto: 34 },
  farola: { tipo: 'referencia', etiqueta: 'Farola', color: '#92400e', colorBorde: '#d97706', forma: 'circle', ancho: 18, alto: 18 },
};

let contador = 0;
const id = () => `ejemplo-${++contador}`;

function vehiculo(conductor, x, y, rotacion) {
  const v = VEHICULOS[conductor.vehiculo];
  const [color, colorBorde] = COLOR_LETRA[conductor.letra];
  return {
    id: id(), tipo: 'vehiculo', subtipo: conductor.vehiculo, letra: conductor.letra,
    etiqueta: `${v.etiqueta} ${conductor.letra} · ${conductor.matricula}`,
    color, colorBorde, forma: 'rect', ancho: v.ancho, alto: v.alto,
    x, y, rotacion, scaleX: 1, scaleY: 1,
  };
}

function otro(clave, x, y, rotacion = 0) {
  const o = OTROS[clave];
  return { id: id(), subtipo: clave, ...o, x, y, rotacion, scaleX: 1, scaleY: 1 };
}

// Escenas pensadas para un lienzo de 800 x 420 (cruce en el centro)
const EMPRESAS = [
  {
    nombre: 'Aseguradora Ejemplo',
    slug: 'aseguradora-ejemplo',
    usuarios: [
      { email: 'demo@trazasinie.test', role: 'admin' },
      { email: 'luis.tramitador@trazasinie.test', role: 'user' },
    ],
    partes: [
      {
        lugar: 'Av. del Puerto con C/ Doctor Lluch, Valencia',
        hora: '08:00 - 10:00',
        autor: 1,
        estado: 'en_revision',
        eventos: [
          { autor: 0, accion: 'editado', cambios: [{ campo: 'Testigos', antes: null, despues: 'Rosa Benet (peatón), 600 000 111' }] },
          { autor: 0, accion: 'estado', cambios: [{ campo: 'Estado', antes: 'abierto', despues: 'en_revision' }] },
        ],
        heridos: { num: 1, detalle: 'La conductora A con dolor cervical; atendida en el lugar por el SAMU.' },
        danosTerceros: 'Señal de ceda el paso doblada en la esquina.',
        testigos: 'Rosa Benet (peatón), 600 000 111',
        descripcion: 'El vehículo A circulaba por la Av. del Puerto con el semáforo en verde. La furgoneta B salió de la C/ Doctor Lluch sin respetar el ceda el paso y le golpeó en el lateral derecho.',
        conductores: [
          { letra: 'A', nombre: 'Lucía', apellidos: 'Romero Vidal', matricula: '4821 KLM', vehiculo: 'coche', aseguradora: 'Aseguradora Ejemplo', danos: 'Puerta y aleta delantera derecha hundidas' },
          { letra: 'B', nombre: 'Pedro', apellidos: 'Gil Navarro', matricula: '1093 HJT', vehiculo: 'furgoneta', aseguradora: 'Mutua Norte', danos: 'Paragolpes delantero roto' },
        ],
        escena: (c) => [
          vehiculo(c[0], 360, 236, 0),
          vehiculo(c[1], 438, 272, 290),
          otro('senal', 470, 296),
          otro('arbol', 300, 120),
          otro('arbol', 520, 320),
        ],
      },
      {
        lugar: 'Ronda Sur, salida 4, Murcia',
        hora: '18:00 - 20:00',
        autor: 0,
        estado: 'cerrado',
        eventos: [
          { autor: 1, accion: 'editado', cambios: [{ campo: 'Conductor A · Daños', antes: 'Maletero', despues: 'Maletero y piloto trasero izquierdo' }] },
          { autor: 0, accion: 'estado', cambios: [{ campo: 'Estado', antes: 'abierto', despues: 'cerrado' }] },
        ],
        descripcion: 'Retención por obras. El camión B no frenó a tiempo y golpeó por detrás al vehículo A, que estaba detenido.',
        conductores: [
          { letra: 'A', nombre: 'Marta', apellidos: 'Sanz Ortega', matricula: '7710 LBC', vehiculo: 'coche', aseguradora: 'Aseguradora Ejemplo', danos: 'Maletero y piloto trasero izquierdo' },
          { letra: 'B', nombre: 'Javier', apellidos: 'Molina Ruiz', matricula: '3356 GFD', vehiculo: 'camion', aseguradora: 'Transportes Ejemplo Seguros' },
        ],
        escena: (c) => [
          vehiculo(c[0], 300, 236, 0),
          vehiculo(c[1], 205, 236, 0),
          otro('cono', 600, 236),
          otro('cono', 640, 236),
          otro('farola', 250, 280),
        ],
      },
      {
        lugar: 'Calle Mayor, 15, Alcalá de Henares',
        hora: '22:00 - 00:00',
        autor: 1,
        heridos: { num: 1, detalle: 'Contusiones en la pierna derecha; traslado al hospital por precaución.' },
        danosTerceros: 'Farola del n.º 15 con el poste doblado.',
        descripcion: 'La moto patinó en una curva con el asfalto mojado y chocó contra la farola.',
        conductores: [
          { letra: 'A', nombre: 'Andrés', apellidos: 'Prieto Lozano', matricula: '0452 MNP', vehiculo: 'moto', aseguradora: 'Aseguradora Ejemplo', danos: 'Carenado y espejo derecho rotos' },
        ],
        escena: (c) => [
          vehiculo(c[0], 470, 292, 300),
          otro('farola', 500, 282),
          otro('arbol', 560, 330),
        ],
      },
    ],
  },
  {
    // Segunda empresa: sirve para comprobar que cada una ve solo sus datos
    nombre: 'Mutua Norte',
    slug: 'mutua-norte',
    usuarios: [{ email: 'admin@mutuanorte.test', role: 'admin' }],
    partes: [
      {
        lugar: 'Paseo de la Castellana, 120, Madrid',
        hora: '12:00 - 14:00',
        autor: 0,
        conductores: [
          { letra: 'A', nombre: 'Carmen', apellidos: 'Iglesias Mora', matricula: '9034 KZX', vehiculo: 'coche', aseguradora: 'Mutua Norte' },
          { letra: 'B', nombre: 'Raúl', apellidos: 'Vega Campos', matricula: '5512 JRS', vehiculo: 'coche', aseguradora: 'Aseguradora Ejemplo' },
        ],
        escena: (c) => [
          vehiculo(c[0], 376, 190, 90),
          vehiculo(c[1], 420, 236, 180),
        ],
      },
    ],
  },
];

async function main() {
  const bd = new Client({ connectionString: process.env.DATABASE_URL });
  await bd.connect();
  const hash = await bcrypt.hash(CONTRASENA, 12);

  try {
    await bd.query('BEGIN');
    for (const empresa of EMPRESAS) {
      // Se borra la empresa de ejemplo (y en cascada sus usuarios y partes) y se crea de nuevo
      await bd.query('DELETE FROM tenants WHERE slug = $1', [empresa.slug]);
      const { rows: [tenant] } = await bd.query(
        'INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id', [empresa.nombre, empresa.slug]
      );

      const usuarios = [];
      for (const u of empresa.usuarios) {
        const { rows: [user] } = await bd.query(
          'INSERT INTO users (tenant_id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
          [tenant.id, u.email, hash, u.role]
        );
        usuarios.push(user.id);
      }

      for (const [i, p] of empresa.partes.entries()) {
        const croquis = { ancho: 800, alto: 420, elementos: p.escena(p.conductores) };
        const { rows: [parte] } = await bd.query(
          `INSERT INTO submissions
             (tenant_id, user_id, lugar, hora_accidente, croquis, created_at, estado, updated_at,
              heridos, num_heridos, heridos_detalle, danos_terceros, danos_terceros_detalle, testigos, descripcion)
           VALUES ($1, $2, $3, $4, $5, NOW() - ($6 || ' days')::interval, $7,
                   CASE WHEN $8 THEN NOW() - ($6 || ' days')::interval + INTERVAL '1 day' END,
                   $9, $10, $11, $12, $13, $14, $15) RETURNING id, created_at`,
          [tenant.id, usuarios[p.autor] ?? usuarios[0], p.lugar, p.hora, croquis, String(i * 3 + 1),
           p.estado ?? 'abierto', Boolean(p.eventos?.length),
           Boolean(p.heridos), p.heridos?.num ?? null, p.heridos?.detalle ?? null,
           Boolean(p.danosTerceros), p.danosTerceros ?? null, p.testigos ?? null, p.descripcion ?? null]
        );

        // Historial: alta del parte y, si los hay, cambios posteriores (unas horas después cada uno)
        const eventos = [{ autor: p.autor, accion: 'creado', cambios: [] }, ...(p.eventos ?? [])];
        for (const [n, ev] of eventos.entries()) {
          const usuario = empresa.usuarios[ev.autor] ?? empresa.usuarios[0];
          await bd.query(
            `INSERT INTO parte_historial (submission_id, tenant_id, user_id, user_email, accion, cambios, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7::timestamp + ($8 || ' hours')::interval)`,
            [parte.id, tenant.id, usuarios[ev.autor] ?? usuarios[0], usuario.email, ev.accion,
             JSON.stringify(ev.cambios), parte.created_at, String(n * 5)]
          );
        }
        // "Última modificación" = la fecha del último cambio del historial
        if (p.eventos?.length) {
          await bd.query(
            'UPDATE submissions SET updated_at = (SELECT MAX(created_at) FROM parte_historial WHERE submission_id = $1) WHERE id = $1',
            [parte.id]
          );
        }
        for (const c of p.conductores) {
          await bd.query(
            `INSERT INTO conductores (submission_id, tenant_id, letra, nombre, apellidos, matricula, vehiculo, aseguradora, danos)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [parte.id, tenant.id, c.letra, c.nombre, c.apellidos, c.matricula, c.vehiculo, c.aseguradora, c.danos ?? null]
          );
        }
      }
      console.log(`✅ ${empresa.nombre} (${empresa.slug}): ${empresa.usuarios.length} usuarios, ${empresa.partes.length} partes`);
    }
    await bd.query('COMMIT');
    console.log('\nCuentas de prueba (contraseña en DEMO.md):');
    EMPRESAS.forEach((e) => e.usuarios.forEach((u) => console.log(`  ${e.slug.padEnd(22)} ${u.email.padEnd(34)} ${u.role}`)));
  } catch (err) {
    await bd.query('ROLLBACK');
    throw err;
  } finally {
    await bd.end();
  }
}

main().catch((err) => {
  console.error('❌ No se pudieron cargar los datos de ejemplo:', err.message);
  process.exit(1);
});
