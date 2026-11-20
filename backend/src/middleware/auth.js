const jwt = require('jsonwebtoken');

/**
 * Verifies JWT and attaches { userId, tenantId, role } to req.user.
 * Every downstream handler can trust these values are legitimate.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Tienes que iniciar sesión' });
  }

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'La sesión ha caducado. Vuelve a iniciar sesión.' });
  }
}

/**
 * Role guard — use after authenticate().
 * Example: authorize('admin')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para hacer esto' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
