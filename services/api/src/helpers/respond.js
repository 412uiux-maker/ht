const PROD = process.env.NODE_ENV === 'production';

/**
 * Send a 500 response without leaking internal error details in production.
 */
function serverError(res, err, context = '') {
  const msg = err?.message || String(err);
  console.error(`[500]${context ? ' ' + context : ''}: ${msg}`);
  res.status(500).json({ error: PROD ? 'Internal server error' : msg });
}

module.exports = { serverError };
