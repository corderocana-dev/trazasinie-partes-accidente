// Crea la base de datos (si no existe) y sus tablas a partir de schema.sql.
// Uso:  npm run db:crear              → crea lo que falte, sin borrar nada
//       npm run db:crear -- --reiniciar → BORRA la base de datos y la crea de cero
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const reiniciar = process.argv.includes('--reiniciar');

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL en backend/.env');

  const url = new URL(process.env.DATABASE_URL);
  const nombreBD = decodeURIComponent(url.pathname.slice(1));
  if (!/^[a-z0-9_]+$/i.test(nombreBD)) throw new Error(`Nombre de base de datos no válido: ${nombreBD}`);

  // 1. Conectarse a la base "postgres" (siempre existe) para crear la nuestra
  const urlAdmin = new URL(url);
  urlAdmin.pathname = '/postgres';
  const admin = new Client({ connectionString: urlAdmin.toString() });
  await admin.connect();

  if (reiniciar) {
    await admin.query(`DROP DATABASE IF EXISTS "${nombreBD}" WITH (FORCE)`);
    console.log(`🗑️  Base de datos ${nombreBD} borrada`);
  }

  const existe = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [nombreBD]);
  if (!existe.rowCount) {
    await admin.query(`CREATE DATABASE "${nombreBD}"`);
    console.log(`✅ Base de datos ${nombreBD} creada`);
  } else {
    console.log(`ℹ️  La base de datos ${nombreBD} ya existe`);
  }
  await admin.end();

  // 2. Crear las tablas (schema.sql solo crea lo que falta)
  const bd = new Client({ connectionString: process.env.DATABASE_URL });
  await bd.connect();
  await bd.query(fs.readFileSync(path.join(__dirname, '..', '..', 'schema.sql'), 'utf8'));
  await bd.end();
  console.log('✅ Tablas listas');
}

main().catch((err) => {
  console.error('❌ No se pudo preparar la base de datos:', err.message);
  if (/password|autentificaci|authentication/i.test(err.message)) {
    console.error('   Revisa el usuario y la contraseña de DATABASE_URL en backend/.env');
  }
  process.exit(1);
});
