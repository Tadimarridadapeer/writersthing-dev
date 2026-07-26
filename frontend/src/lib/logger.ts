import * as Sentry from '@sentry/nextjs';

const SENSITIVE_KEYS = [
  'password', 'token', 'jwt', 'secret', 'key', 'cookie', 
  'authorization', 'otp', 'signedurl', 'signature', 'anon_key', 'service_role'
];

function sanitizeData(data: any): any {
  if (!data) return data;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  if (typeof data === 'object') {
    const sanitized = { ...data };
    for (const key in sanitized) {
      if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    }
    return sanitized;
  }
  return data;
}

type LogContext = Record<string, any>;

class Logger {
  private log(level: 'debug' | 'info' | 'warn' | 'error' | 'security' | 'performance', message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const env = process.env.NODE_ENV || 'development';
    const sanitizedContext = sanitizeData(context);

    // Development Console Logging
    if (env !== 'production' || process.env.ENABLE_DEV_LOGS === 'true') {
      const prefix = `[${level.toUpperCase()}] ${timestamp}:`;
      switch (level) {
        case 'debug':
        case 'info':
        case 'performance':
          console.log(prefix, message, sanitizedContext || '');
          break;
        case 'warn':
        case 'security':
          console.warn(prefix, message, sanitizedContext || '');
          break;
        case 'error':
          console.error(prefix, message, sanitizedContext || '');
          break;
      }
    } else {
      // Production Server Logging (e.g., for Vercel logs)
      const logEntry = JSON.stringify({ timestamp, level, message, ...sanitizedContext });
      if (level === 'error' || level === 'security') {
        console.error(logEntry);
      } else {
        console.log(logEntry);
      }
    }

    // Sentry Dispatch
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      if (level === 'warn') {
        Sentry.captureMessage(message, { level: 'warning', extra: sanitizedContext });
      } else if (level === 'error') {
        if (context?.error instanceof Error) {
          Sentry.captureException(context.error, { extra: sanitizedContext });
        } else {
          Sentry.captureMessage(message, { level: 'error', extra: sanitizedContext });
        }
      } else if (level === 'security') {
        Sentry.captureMessage(`[SECURITY] ${message}`, { level: 'warning', extra: sanitizedContext });
      }
    }
  }

  debug(message: string, context?: LogContext) { this.log('debug', message, context); }
  info(message: string, context?: LogContext) { this.log('info', message, context); }
  warn(message: string, context?: LogContext) { this.log('warn', message, context); }
  error(message: string, context?: LogContext) { this.log('error', message, context); }
  security(message: string, context?: LogContext) { this.log('security', message, context); }
  performance(message: string, context?: LogContext) { this.log('performance', message, context); }
}

export const logger = new Logger();
