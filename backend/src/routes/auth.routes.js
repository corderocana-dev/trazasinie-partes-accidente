const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

// El nombre de la organización va en el token para mostrarlo en el panel
const signToken = (user, tenantName, tenantSlug) =>
  jwt.sign(
    { userId: user.id, tenantId: user.tenant_id, tenantName, tenantSlug, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

// POST /api/auth/register
// Creates tenant + first admin user in one transaction
router.post(
  '/register',
  [
    body('tenantName').trim().notEmpty().withMessage('Indica el nombre de la organización'),
    body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { tenantName, email, password } = req.body;
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Slug: lowercase, spaces → dashes, strip non-alphanumeric
      const slug = tenantName
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes: 'Peñas' -> 'penas'
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (!slug) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'El nombre debe contener letras o números' });
      }

      const tenantRes = await client.query(
        'INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id',
        [tenantName, slug]
      );
      const tenantId = tenantRes.rows[0].id;

      const hash = await bcrypt.hash(password, 12);
      const userRes = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin') RETURNING id, tenant_id, role`,
        [tenantId, email, hash]
      );

      await client.query('COMMIT');

      const token = signToken(userRes.rows[0], tenantName, slug);
      res.status(201).json({ token, slug });
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una organización con ese nombre' });
      }
      console.error(err);
      res.status(500).json({ error: 'No se pudo crear la cuenta' });
    } finally {
      client.release();
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
    body('password').notEmpty().withMessage('Introduce tu contraseña'),
    body('tenantSlug').trim().notEmpty().withMessage('Introduce el identificador de tu organización'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, tenantSlug } = req.body;

    try {
      // Join to verify user belongs to the provided tenant
      const result = await db.query(
        `SELECT u.id, u.tenant_id, u.password_hash, u.role, t.name AS tenant_name
         FROM users u
         JOIN tenants t ON t.id = u.tenant_id
         WHERE u.email = $1 AND t.slug = $2`,
        [email, tenantSlug]
      );

      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Organización, email o contraseña incorrectos' });
      }

      res.json({ token: signToken(user, user.tenant_name, tenantSlug) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'No se pudo iniciar sesión' });
    }
  }
);


// POST /api/auth/recuperar-contrasena
// Genera un token de reset (en producción se enviaría por email)
router.post(
  '/recuperar-contrasena',
  [
    body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
    body('tenantSlug').trim().notEmpty().withMessage('Introduce el identificador de tu organización'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, tenantSlug } = req.body;

    try {
      const result = await db.query(
        `SELECT u.id FROM users u
         JOIN tenants t ON t.id = u.tenant_id
         WHERE u.email = $1 AND t.slug = $2`,
        [email, tenantSlug]
      );

      // Siempre respondemos OK para no revelar si el email existe
      if (!result.rows.length) return res.json({ ok: true });

      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await db.query(
        `UPDATE users SET reset_token = $1, reset_token_expira = $2 WHERE id = $3`,
        [token, expira, result.rows[0].id]
      );

      // En producción se enviaría por email; en desarrollo lo logueamos
      const urlWeb = process.env.CLIENT_URL || 'http://localhost:5173';
      console.log(`[DEV] Enlace reset: ${urlWeb}/reset-contrasena?token=${token}`);

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'No se pudo procesar la solicitud' });
    }
  }
);

// POST /api/auth/reset-contrasena
router.post(
  '/reset-contrasena',
  [
    body('token').trim().notEmpty().withMessage('Falta el enlace de recuperación'),
    body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token, password } = req.body;

    try {
      const result = await db.query(
        `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expira > NOW()`,
        [token]
      );

      if (!result.rows.length) {
        return res.status(400).json({ error: 'El enlace no es válido o ha caducado.' });
      }

      const hash = await bcrypt.hash(password, 12);
      await db.query(
        `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expira = NULL WHERE id = $2`,
        [hash, result.rows[0].id]
      );

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'No se pudo restablecer la contraseña' });
    }
  }
);

module.exports = router;
