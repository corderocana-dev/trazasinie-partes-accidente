// Arranca backend y frontend a la vez con un solo comando: npm run dev (en la carpeta trazasinie)
// Opciones: --api 3001  --web 5173  --sin-navegador
const { spawn } = require('child_process');
const path = require('path');

const arg = (nombre, defecto) => {
  const i = process.argv.indexOf(nombre);
  return i > -1 ? process.argv[i + 1] : defecto;
};
const puertoApi = arg('--api', '3001');
const puertoWeb = arg('--web', '5173');
const abrirNavegador = !process.argv.includes('--sin-navegador');

const raiz = path.join(__dirname, '..');
const procesos = [];

function lanzar(nombre, carpeta, args, env) {
  // Un solo comando de texto (con shell) para que funcione igual en Windows, Mac y Linux
  const p = spawn(`npm ${args.join(' ')}`, {
    cwd: path.join(raiz, carpeta),
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: true,
  });
  p.on('exit', (codigo) => {
    if (codigo) console.error(`\n❌ ${nombre} se ha detenido (código ${codigo}). Paro el resto.`);
    parar();
  });
  procesos.push(p);
}

function parar() {
  procesos.forEach((p) => {
    if (p.exitCode !== null) return;
    // En Windows hay que cerrar el árbol de procesos (npm → node)
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(p.pid), '/T', '/F']);
    else p.kill();
  });
  setTimeout(() => process.exit(0), 300);
}

process.on('SIGINT', parar);
process.on('SIGTERM', parar);

// Backend con nodemon: se reinicia solo al guardar cambios en el código
lanzar('Backend', 'backend', ['run', 'dev'], {
  PORT: puertoApi,
  CLIENT_URL: `http://localhost:${puertoWeb}`,
});
lanzar('Frontend', 'frontend', ['run', 'dev', '--', '--port', puertoWeb, '--strictPort'], {
  API_URL: `http://localhost:${puertoApi}`,
  OPEN_BROWSER: abrirNavegador ? 'true' : 'false',
});
