import winston from 'winston';
import path from 'path';
import { sanitizeLogMessage, sanitizeObject } from '../security/LogSanitizer';

const logDir = path.join(__dirname, '../../logs');

/**
 * Custom format that sanitizes sensitive data before logging
 */
const sanitizeFormat = winston.format((info) => {
  // Sanitize the main message
  if (typeof info.message === 'string') {
    info.message = sanitizeLogMessage(info.message);
  }

  // Sanitize metadata
  const sanitizedInfo: any = { ...info };
  for (const [key, value] of Object.entries(info)) {
    if (key !== 'level' && key !== 'timestamp' && key !== 'message') {
      if (typeof value === 'string') {
        sanitizedInfo[key] = sanitizeLogMessage(value);
      } else if (typeof value === 'object') {
        sanitizedInfo[key] = sanitizeObject(value);
      }
    }
  }

  return sanitizedInfo;
})();

const logFormat = winston.format.combine(
  sanitizeFormat,
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  sanitizeFormat,
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Write all logs to files
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

export default logger;
