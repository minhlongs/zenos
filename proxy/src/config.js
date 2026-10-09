'use strict';

const DEFAULT_PORT = 20129;
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_LMSTUDIO_URL = 'http://127.0.0.1:1234';
const DEFAULT_UPSTREAM_TIMEOUT_MS = 60000;
const DEFAULT_BODY_LIMIT = '5mb';

/**
 * Validates that an upstream URL strictly targets localhost or 127.0.0.1 loopback.
 * Prevents arbitrary SSRF or external URL exfiltration.
 */
function validateUpstreamUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Invalid upstream protocol: ${parsed.protocol}`);
    }
    const hostname = parsed.hostname.toLowerCase();
    const isLoopback = hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
    if (!isLoopback) {
      throw new Error(`Upstream URL must target loopback (127.0.0.1 or localhost), got: ${hostname}`);
    }
    return parsed.origin;
  } catch (err) {
    throw new Error(`Invalid LMSTUDIO_URL: ${err.message}`);
  }
}

const port = parseInt(process.env.ZENOS_PORT || process.env.PORT || String(DEFAULT_PORT), 10);
const rawUpstreamUrl = process.env.LMSTUDIO_URL || DEFAULT_LMSTUDIO_URL;
const upstreamUrl = validateUpstreamUrl(rawUpstreamUrl);

module.exports = {
  PORT: Number.isFinite(port) && port > 0 && port < 65536 ? port : DEFAULT_PORT,
  HOST: DEFAULT_HOST,
  LMSTUDIO_URL: upstreamUrl,
  UPSTREAM_TIMEOUT_MS: parseInt(process.env.UPSTREAM_TIMEOUT_MS || String(DEFAULT_UPSTREAM_TIMEOUT_MS), 10),
  BODY_LIMIT: process.env.REQUEST_BODY_LIMIT || DEFAULT_BODY_LIMIT,
  validateUpstreamUrl
};
