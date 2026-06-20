const http = require('http');
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const initDb = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/vets',          require('./routes/vets'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/pets',          require('./routes/pets'));
app.use('/api/foods',         require('./routes/food'));
app.use('/api/learn',         require('./routes/learn'));
app.use('/api/deeds',         require('./routes/deeds'));
app.use('/api/vendor',        require('./routes/vendor'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/payments',      require('./routes/payments'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'petplatform-api', time: new Date().toISOString() }));
app.get('/api/hello',  (_req, res) => res.json({ message: 'Salom, dunyo! / Привет, мир!', from: 'petplatform-api' }));

// ── WebSocket signaling for WebRTC video calls ────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/signal' });

// rooms: Map<consultationId, Map<ws, { role: 'client'|'vet' }>>
const rooms = new Map();

wss.on('connection', (ws) => {
  let roomId = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

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
