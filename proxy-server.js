const net = require('net');

const server = net.createServer((socket) => {
  const target = net.connect(3000, 'localhost', () => {
    socket.pipe(target);
    target.pipe(socket);
  });
  target.on('error', () => socket.destroy());
  socket.on('error', () => target.destroy());
});

server.on('error', (err) => {
  console.error('[Proxy 3001->3000 Error]', err.message);
});

server.listen(3001, () => {
  console.log('[Proxy Daemon] Transparently forwarding port 3001 -> 3000');
});
