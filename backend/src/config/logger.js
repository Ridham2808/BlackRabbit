// ============================================================
// LOGGER — Winston structured JSON logging
// Console (dev) + rotating file (prod)
// ============================================================

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const isDev = process.env.NODE_ENV !== 'production';
const logDir = process.env.LOG_DIR || './logs';

// Dev format — readable colorised output
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${ts} [${level}] ${message}${stack ? '\n' + stack : ''}${metaStr}`;
  })
);

// Prod format — structured JSON
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// Rotating file transport
const fileTransport = new DailyRotateFile({
  dirname:        logDir,
  filename:       'deas-%DATE%.log',
  datePattern:    'YYYY-MM-DD',
  maxSize:        process.env.LOG_MAX_SIZE  || '20m',
  maxFiles:       process.env.LOG_MAX_FILES || '30d',
  zippedArchive:  true,
  format:         prodFormat,
});

const errorFileTransport = new DailyRotateFile({
  dirname:        logDir,
  filename:       'deas-error-%DATE%.log',
  datePattern:    'YYYY-MM-DD',
  maxSize:        '20m',
  maxFiles:       '30d',
  level:          'error',
  zippedArchive:  true,
  format:         prodFormat,
});

const logger = winston.createLogger({
  level:       process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'deas-backend' },
  transports:  [
    new winston.transports.Console({
      format: isDev ? devFormat : prodFormat,
    }),
    fileTransport,
    errorFileTransport,
  ],
  exceptionHandlers: [
    new winston.transports.Console({ format: isDev ? devFormat : prodFormat }),
    new DailyRotateFile({
      dirname: logDir, filename: 'deas-exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD', maxFiles: '30d',
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({ format: isDev ? devFormat : prodFormat }),
  ],
});

module.exports = logger;
