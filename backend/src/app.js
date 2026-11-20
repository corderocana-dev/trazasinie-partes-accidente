require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes     = require('./routes/auth.routes');
const partesRoutes   = require('./routes/partes.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
// Límite ampliado: el parte puede llevar el croquis en PNG (data URL)
app.use(express.json({ limit: '3mb' }));

// Límite más estricto en auth para frenar fuerza bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos. Espera unos minutos y vuelve a probar.' },
});
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/submissions', partesRoutes);
app.use('/api/usuarios',    usuariosRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada en el servidor' }));

// Manejador de errores genérico (evita exponer stack traces)
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
