// Two Tempos: tiny zero-dependency server.
// Serves index.html and relays messages between the two players of a room
// using Server-Sent Events (server -> phone) and POST (phone -> server).
// Run: node server.js   (PORT env var, default 8787)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8787;
const INDEX = path.join(__dirname, 'index.html');
const rooms = new Map(); // code -> { clients: {A,B}, last: string|null, touched }

function room(code) {
  let r = rooms.get(code);
  if (!r) { r = { clients: {}, lastState: null, touched: Date.now() }; rooms.set(code, r); }
  r.touched = Date.now();
  return r;
}
function sse(res, obj) { try { res.write(`data: ${JSON.stringify(obj)}\n\n`); } catch {} }
function other(role) { return role === 'A' ? 'B' : 'A'; }
const validCode = (c) => typeof c === 'string' && /^[A-Z0-9]{3,8}$/.test(c);
const validRole = (r) => r === 'A' || r === 'B';

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const code = (url.searchParams.get('room') || '').toUpperCase();
  const role = url.searchParams.get('role');

  if (url.pathname === '/api/ping') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end('{"ok":true}');
  }

  if (url.pathname === '/api/events') {
    if (!validCode(code) || !validRole(role)) { res.writeHead(400); return res.end(); }
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
    res.write('retry: 2000\n\n');
    const r = room(code);
    const prev = r.clients[role];
    if (prev && prev !== res) { try { prev.end(); } catch {} }
    r.clients[role] = res;
    // Tell both sides who is here.
    const peer = r.clients[other(role)];
    sse(res, { t: 'peer', online: !!peer });
    if (peer) sse(peer, { t: 'peer', online: true });
    // A rejoining guest gets the host's latest state immediately.
    if (role === 'B' && r.lastState) sse(res, r.lastState);
    const ka = setInterval(() => { try { res.write(': ka\n\n'); } catch {} }, 20000);
    req.on('close', () => {
      clearInterval(ka);
      if (r.clients[role] === res) {
        delete r.clients[role];
        const p = r.clients[other(role)];
        if (p) sse(p, { t: 'peer', online: false });
      }
    });
    return;
  }

  if (url.pathname === '/api/send' && req.method === 'POST') {
    if (!validCode(code) || !validRole(role)) { res.writeHead(400); return res.end(); }
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 200000) req.destroy(); });
    req.on('end', () => {
      let msg;
      try { msg = JSON.parse(body); } catch { res.writeHead(400); return res.end(); }
      const r = room(code);
      if (role === 'A' && msg.t === 'state') r.lastState = msg;
      const peer = r.clients[other(role)];
      if (peer) sse(peer, msg);
      res.writeHead(204); res.end();
    });
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
    return fs.createReadStream(INDEX).pipe(res);
  }
  if (url.pathname === '/content.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache' });
    return fs.createReadStream(path.join(__dirname, 'content.js')).on('error', () => res.end()).pipe(res);
  }
  res.writeHead(404); res.end('not found');
});

// Forget rooms idle for 12 hours.
setInterval(() => {
  const cutoff = Date.now() - 12 * 3600e3;
  for (const [k, r] of rooms) if (r.touched < cutoff && !r.clients.A && !r.clients.B) rooms.delete(k);
}, 3600e3);

server.listen(PORT, () => console.log(`Two Tempos on http://localhost:${PORT}`));
