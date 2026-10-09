'use strict';

const http = require('http');
const { createApp } = require('./app');
const { PORT, HOST, LMSTUDIO_URL } = require('./config');

const app = createApp();
const server = http.createServer(app);

// Explicitly bind only to loopback address (127.0.0.1)
server.listen(PORT, HOST, () => {
  const address = server.address();
  process.stdout.write(
    `[ZENOS-PROXY] Listening strictly on http://${address.address}:${address.port}\n` +
    `[ZENOS-PROXY] Upstream LM Studio configured at: ${LMSTUDIO_URL}\n`
  );
});

function gracefulShutdown(signal) {
  process.stdout.write(`\n[ZENOS-PROXY] Received ${signal}. Shutting down gracefully...\n`);
  server.close(() => {
    process.stdout.write('[ZENOS-PROXY] Server closed.\n');
    process.exit(0);
  });
  setTimeout(() => {
    process.stderr.write('[ZENOS-PROXY] Forcing shutdown after timeout.\n');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { server, app };
