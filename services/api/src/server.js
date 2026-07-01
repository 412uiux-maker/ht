const http = require('http');
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const initDb = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET env var is required in production');
  process.exit(1);
}

app.use(express.json());
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

initDb()
  .then(() => {
    server.listen(PORT, () => console.log(`petplatform-api running at http://localhost:${PORT}`));
  })
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });
