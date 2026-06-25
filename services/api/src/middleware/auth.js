const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

/**
 * Verifies Bearer JWT for admin requests.
 * On success attaches req.adminUser = { id, email, name, role }.
 */
function requireAdmin(...roles) {
  return (req, res, next) => {
    const header = req.headers['authorization'] ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const payload = jwt.verify(token, SECRET);
      if (payload.type !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      if (roles.length && !roles.includes(payload.role)) return res.status(403).json({ error: 'Forbidden' });
      req.adminUser = { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

/**
 * Verifies Bearer JWT for vendor requests.
 * On success attaches req.vendor = { vet_id, email }.
 */
function requireVendor(req, res, next) {
  const header = req.headers['authorization'] ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.type !== 'vendor') return res.status(403).json({ error: 'Forbidden' });
    req.vendor = { vet_id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Issues a signed JWT. */
function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, SECRET, { expiresIn });
}

module.exports = { requireAdmin, requireVendor, signToken };
