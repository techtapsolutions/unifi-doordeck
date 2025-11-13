/**
 * Simple file logger for debugging
 */

import { app } from 'electron';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOG_DIR = join(app.getPath('userData'), 'logs');
const LOG_FILE = join(LOG_DIR, 'main.log');

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

export function log(level: string, message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  const argStr = args.length > 0 ? ' ' + JSON.stringify(args) : '';
  const logMessage = `${timestamp} [${level}] ${message}${argStr}\n`;

  // Write to file
  try {
    appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }

  // Also output to console
  console.log(logMessage.trim());
}

export function getLogPath(): string {
  return LOG_FILE;
}
