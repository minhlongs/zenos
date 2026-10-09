'use strict';

const { parseModelAliases } = require('./router');

const DEFAULT_PORT = 20129;
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_LMSTUDIO_URL = 'http://127.0.0.1:1234';
const DEFAULT_UPSTREAM_TIMEOUT_MS = 60000;
const DEFAULT_BODY_LIMIT = '5mb';
const DEFAULT_FALLBACK_MODEL = 'local-model';
const DEFAULT_CONCURRENCY = 1;
const DEFAULT_MAX_QUEUE_DEPTH = 10;
const DEFAULT_QUEUE_TIMEOUT_MS = 60000;

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
    throw new Error(`Invalid upstream URL: ${err.message}`);
  }
}

const port = parseInt(process.env.ZENOS_PORT || process.env.PORT || String(DEFAULT_PORT), 10);
const rawUpstreamUrl = process.env.LMSTUDIO_URL || DEFAULT_LMSTUDIO_URL;
const upstreamUrl = validateUpstreamUrl(rawUpstreamUrl);

const rawEndpoints = process.env.UPSTREAM_ENDPOINTS;
const upstreamUrls = rawEndpoints
  ? rawEndpoints.split(',').map(s => s && s.trim()).filter(Boolean).map(validateUpstreamUrl)
  : [upstreamUrl];

// Gate 2 Model routing defaults
const defaultAliases = {
  'claude-3-5-sonnet*': process.env.LMSTUDIO_DEFAULT_MODEL || DEFAULT_FALLBACK_MODEL,
  'claude-3-7-sonnet*': process.env.LMSTUDIO_DEFAULT_MODEL || DEFAULT_FALLBACK_MODEL,
  'claude-3-opus*': process.env.LMSTUDIO_DEFAULT_MODEL || DEFAULT_FALLBACK_MODEL,
  'claude-3-haiku*': process.env.LMSTUDIO_DEFAULT_MODEL || DEFAULT_FALLBACK_MODEL
};

const userAliases = parseModelAliases(process.env.MODEL_ALIASES);
const modelAliases = { ...defaultAliases, ...userAliases };

module.exports = {
  PORT: Number.isFinite(port) && port > 0 && port < 65536 ? port : DEFAULT_PORT,
  HOST: DEFAULT_HOST,
  LMSTUDIO_URL: upstreamUrl,
  UPSTREAM_URLS: upstreamUrls,
  UPSTREAM_TIMEOUT_MS: parseInt(process.env.UPSTREAM_TIMEOUT_MS || String(DEFAULT_UPSTREAM_TIMEOUT_MS), 10),
  BODY_LIMIT: process.env.REQUEST_BODY_LIMIT || DEFAULT_BODY_LIMIT,
  DEFAULT_MODEL: process.env.LMSTUDIO_DEFAULT_MODEL || DEFAULT_FALLBACK_MODEL,
  MODEL_ALIASES: modelAliases,
  CONCURRENCY_LIMIT: parseInt(process.env.CONCURRENCY_LIMIT ?? String(DEFAULT_CONCURRENCY), 10),
  MAX_QUEUE_DEPTH: parseInt(process.env.MAX_QUEUE_DEPTH || String(DEFAULT_MAX_QUEUE_DEPTH), 10),
  QUEUE_TIMEOUT_MS: parseInt(process.env.QUEUE_TIMEOUT_MS || String(DEFAULT_QUEUE_TIMEOUT_MS), 10),
  validateUpstreamUrl
};
