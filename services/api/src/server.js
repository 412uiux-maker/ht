const http = require('http');
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const initDb = require('./db/init');
const { startVaccineReminders } = require('./jobs/vaccineReminders');

const app = express();
const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === 'production';

// ── Startup env validation ────────────────────────────────────────────────────
if (PROD && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET env var is required in production');
  process.exit(1);
}
if (PROD && process.env.JWT_SECRET === 'change-me-in-production') {
  console.error('FATAL: JWT_SECRET must be changed from default value');
  process.exit(1);
}

// ── Telegram webhook proxy ────────────────────────────────────────────────────
// Must sit BEFORE express.json() so the raw body stream is not consumed.
// In polling mode (no WEBHOOK_URL) the route still exists but the bot won't
// be listening on 8443, so requests just get a 502 — that's harmless.
app.post('/bot', (req, res) => {
  const botUrl = process.env.BOT_INTERNAL_URL || 'http://petplatform-telegram-bot:8443';
  const parsed = new URL('/bot', botUrl);
  const opts = {
    hostname: parsed.hostname,
    port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path:     '/bot',
    method:   'POST',
    headers:  {
      'content-type':   req.headers['content-type'] || 'application/json',
      'content-length': req.headers['content-length'] || '',
    },
  };
  const proxy = http.request(opts, (proxyRes) => {
    res.status(proxyRes.statusCode || 200);
    proxyRes.pipe(res, { end: true });
  });
  proxy.on('error', (err) => {
    console.error('[bot-proxy]', err.message);
    if (!res.headersSent) res.status(502).end();
  });
  req.pipe(proxy, { end: true });
});

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // handled by nginx in prod
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  const allowed = !PROD || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin);
  if (allowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'AI rate limit exceeded, please wait a moment.' },
});

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/vendor/auth', authLimiter);
app.use('/api/ai', aiLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/vets',          require('./routes/vets'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/pets',          require('./routes/pets'));
app.use('/api/foods',         require('./routes/food'));
app.use('/api/learn',         require('./routes/learn'));
app.use('/api/deeds',         require('./routes/deeds'));
app.use('/api/vendor',        require('./routes/vendor'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/promos',        require('./routes/promos'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/bot',            require('./routes/bot'));
app.use('/api/places',         require('./routes/places'));
app.use('/api/symptom-check',  require('./routes/symptoms'));
app.use('/api/ai',             require('./routes/ai'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'petplatform-api', time: new Date().toISOString() }));
app.get('/api/hello',  (_req, res) => res.json({ message: 'Salom, dunyo! / Привет, мир!', from: 'petplatform-api' }));

// ── WebSocket signaling for WebRTC video calls ────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/signal' });

// rooms: Map<consultationId, Map<ws, { role: 'client'|'vet' }>>
const rooms = new Map();
// vetLobby: Map<vetId, Set<ws>> — vendor cabinets waiting for incoming calls
const vetLobby = new Map();

function sendTo(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}
function sendToLobby(vetId, obj) {
  const set = vetLobby.get(String(vetId));
  if (!set) return;
  set.forEach(peer => sendTo(peer, obj));
}
function sendToRoom(roomId, obj, except) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.forEach((_, peer) => { if (peer !== except) sendTo(peer, obj); });
}

wss.on('connection', (ws) => {
  let roomId = null;
  let lobbyVetId = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // ── Vet cabinet subscribes to its incoming-call lobby ──────
    if (msg.type === 'subscribe-vet') {
      lobbyVetId = String(msg.vet_id);
      if (!vetLobby.has(lobbyVetId)) vetLobby.set(lobbyVetId, new Set());
      vetLobby.get(lobbyVetId).add(ws);
      return;
    }

    // ── Client rings the vet ───────────────────────────────────
    if (msg.type === 'call-invite') {
      sendToLobby(msg.vet_id, {
        type: 'incoming-call',
        room: msg.room,
        vet_id: msg.vet_id,
        client_name: msg.client_name,
        pet_name: msg.pet_name,
        pet_species: msg.pet_species,
        problem: msg.problem,
      });
      return;
    }

    // ── Client cancels (hung up / no answer) ───────────────────
    if (msg.type === 'call-cancel') {
      sendToLobby(msg.vet_id, { type: 'call-cancelled', room: msg.room });
      return;
    }

    // ── Vet declines from the lobby → tell the waiting client ──
    if (msg.type === 'call-decline') {
      sendToRoom(msg.room, { type: 'call-declined', room: msg.room });
      return;
    }

    if (msg.type === 'join') {
      roomId = msg.room;
      if (!rooms.has(roomId)) rooms.set(roomId, new Map());
      const room = rooms.get(roomId);
      room.set(ws, { role: msg.role });

      // Notify existing peers and let them know each other
      room.forEach((info, peer) => {
        if (peer === ws) return;
        if (peer.readyState !== ws.OPEN) return;
        peer.send(JSON.stringify({ type: 'peer-joined', role: msg.role }));
        ws.send(JSON.stringify({ type: 'peer-joined', role: info.role }));
      });
      return;
    }

    // Relay all other messages (offer/answer/ice) to other peers
    if (!roomId || !rooms.has(roomId)) return;
    rooms.get(roomId).forEach((_, peer) => {
      if (peer !== ws && peer.readyState === ws.OPEN) {
        peer.send(JSON.stringify(msg));
      }
    });
  });

  ws.on('close', () => {
    if (lobbyVetId && vetLobby.has(lobbyVetId)) {
      vetLobby.get(lobbyVetId).delete(ws);
      if (vetLobby.get(lobbyVetId).size === 0) vetLobby.delete(lobbyVetId);
    }
    if (!roomId || !rooms.has(roomId)) return;
    rooms.get(roomId).delete(ws);
    rooms.get(roomId).forEach((_, peer) => {
      if (peer.readyState === ws.OPEN) peer.send(JSON.stringify({ type: 'peer-left' }));
    });
    if (rooms.get(roomId).size === 0) rooms.delete(roomId);
  });

  ws.on('error', () => {});
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${status}`, err.message);
  res.status(status).json({
    error: PROD && status === 500 ? 'Internal server error' : (err.message || 'Internal server error'),
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Startup ───────────────────────────────────────────────────────────────────
initDb()
  .then(() => {
    server.listen(PORT, () => console.log(`petplatform-api running at http://localhost:${PORT}`));
    startVaccineReminders();
  })
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });

// ── Graceful shutdown ─────────────────────────────────────────────────────────
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[${signal}] Graceful shutdown…`);
  server.close(() => {
    console.log('HTTP server closed');
    const pool = require('./db');
    pool.end().then(() => {
      console.log('DB pool closed');
      process.exit(0);
    }).catch(() => process.exit(1));
  });
  setTimeout(() => { console.error('Forced shutdown after timeout'); process.exit(1); }, 10000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
