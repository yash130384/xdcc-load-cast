import path from 'path';
import fs from 'fs';
import os from 'os';

const LOG_FILE = path.join(os.homedir(), '.xdcc_downloader_logs.txt');

export function appendToLog(type, args) {
  try {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg); } catch (e) { return String(arg); }
      }
      return String(arg);
    }).join(' ');
    const logLine = `[${timestamp}] [${type}] ${message}\n`;
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > 5 * 1024 * 1024) {
        try { fs.renameSync(LOG_FILE, LOG_FILE + '.old'); } catch (e) { fs.writeFileSync(LOG_FILE, '', 'utf8'); }
      }
    }
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
  } catch (err) { console.error('Logger append error:', err?.message); }
}

export function interceptConsole() {
  const original = { log: console.log, error: console.error, warn: console.warn, info: console.info };
  console.log = (...args) => { original.log(...args); appendToLog('INFO', args); };
  console.error = (...args) => { original.error(...args); appendToLog('ERROR', args); };
  console.warn = (...args) => { original.warn(...args); appendToLog('WARN', args); };
  console.info = (...args) => { original.info(...args); appendToLog('INFO', args); };
}