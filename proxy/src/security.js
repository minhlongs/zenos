'use strict';

const SENSITIVE_HEADERS = new Set(['authorization', 'x-api-key', 'cookie', 'set-cookie']);

/**
 * Middleware ensuring incoming requests only target localhost/127.0.0.1.
 * Defends against DNS Rebinding attacks from malicious web scripts.
 */
function dnsRebindingGuard(req, res, next) {
  const host = req.headers.host || '';
  const hostWithoutPort = host.split(':')[0].toLowerCase();
  const allowed = hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1' || hostWithoutPort === '::1';

  if (!allowed) {
    return res.status(403).json({
      type: 'error',
      error: {
        type: 'forbidden_error',
        message: 'Forbidden: Request host is not authorized for local proxy'
      }
    });
  }
  next();
}

/**
 * Redacts any sensitive patterns, secrets, or API keys from error messages.
 */
function redactSecrets(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/(sk-ant-[a-zA-Z0-9_-]{10,})/g, '[REDACTED_API_KEY]')
    .replace(/(Bearer\s+)[a-zA-Z0-9_\-\.]{10,}/gi, '$1[REDACTED_TOKEN]')
    .replace(/(api[_-]?key[:=]\s*)[a-zA-Z0-9_\-]{8,}/gi, '$1[REDACTED_KEY]');
}

/**
 * Safe logger that logs method, path, status, and duration without logging prompts or secrets.
 */
function safeLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      const sanitizedPath = (req.originalUrl || req.url || '').split('?')[0];
      process.stdout.write(`[ZENOS-PROXY] ${req.method} ${sanitizedPath} ${res.statusCode} ${duration}ms\n`);
    }
  });
  next();
}

module.exports = {
  dnsRebindingGuard,
  redactSecrets,
  safeLogger,
  SENSITIVE_HEADERS
};
