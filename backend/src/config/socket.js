// ============================================================
// SOCKET.IO CONFIG — server factory + room management
// ============================================================

const { Server } = require('socket.io');
const logger = require('./logger');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin:      (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(o => o.trim()),
      credentials: true,
      methods:     ['GET', 'POST'],
    },
    transports:    ['websocket', 'polling'],
    pingTimeout:   30000,
    pingInterval:  10000,
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id });

    // Client joins rooms after connecting
    socket.on('join:base', (baseId) => {
      if (baseId) { socket.join(`base:${baseId}`); logger.debug('Socket joined base', { baseId }); }
    });

    socket.on('join:unit', (unitId) => {
      if (unitId) { socket.join(`unit:${unitId}`); }
    });

    socket.on('join:user', (userId) => {
      if (userId) { socket.join(`user:${userId}`); }
    });

    socket.on('join:admins', () => {
      socket.join('admins');
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, reason });
    });
  });

  logger.info('Socket.io initialized');
  return io;
}

function getIO() {
  return io || null; // Return null instead of throwing — emitters handle null gracefully
}

module.exports = { initSocket, getIO };
