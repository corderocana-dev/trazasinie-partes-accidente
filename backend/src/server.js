const app = require('./app');

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => console.log(`API running on port ${PORT}`));

// Mensaje claro si el puerto ya está ocupado (normalmente, el backend ya está abierto en otra terminal)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} ya está en uso: probablemente el backend ya está abierto en otra terminal.`);
    process.exit(1);
  }
  throw err;
});
