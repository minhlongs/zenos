'use strict';

const { validateUpstreamUrl } = require('./config');

class AllUpstreamsFailedError extends Error {
  constructor(message = 'All configured upstream LLM endpoints failed', errors = []) {
    super(message);
    this.name = 'AllUpstreamsFailedError';
    this.status = 502;
    this.errors = errors;
  }
}

/**
 * Parses and validates an array or comma-separated string of upstream endpoints.
 * Enforces loopback SSRF verification on every endpoint.
 * @param {string|string[]} input
 * @param {string} defaultEndpoint
 * @returns {string[]}
 */
function parseUpstreamEndpoints(input, defaultEndpoint = 'http://127.0.0.1:1234') {
  let urls = [];
  if (Array.isArray(input)) {
    urls = input.filter(Boolean);
  } else if (typeof input === 'string') {
    urls = input.split(',').map(s => s && s.trim()).filter(Boolean);
  }

  if (urls.length === 0) {
    urls = [defaultEndpoint];
  }

  // Enforce loopback SSRF on every endpoint
  return urls.map(url => validateUpstreamUrl(url));
}

/**
 * Dispatches a request function across multiple upstream endpoints in priority order.
 * Transparently fails over on network errors and 5xx responses.
 * Fails immediately on 4xx client errors or client aborts.
 * @param {string[]} upstreamUrls
 * @param {(url: string) => Promise<any>} requestFn
 * @param {object} options
 * @returns {Promise<any>}
 */
async function executeWithFailover(upstreamUrls, requestFn, options = {}) {
  const urls = Array.isArray(upstreamUrls) && upstreamUrls.length > 0
    ? upstreamUrls
    : ['http://127.0.0.1:1234'];

  const errors = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      return await requestFn(url);
    } catch (err) {
      errors.push({ url, error: err.message, status: err.status, code: err.code });

      // If client abort, stop immediately
      if (err.name === 'AbortError' || (options.clientSignal && options.clientSignal.aborted)) {
        throw err;
      }

      // If non-retryable 4xx client error, throw immediately
      if (typeof err.status === 'number' && err.status >= 400 && err.status < 500) {
        throw err;
      }

      // Otherwise retryable error (ECONNREFUSED, ETIMEDOUT, 502/503/504) -> continue to next endpoint
    }
  }

  throw new AllUpstreamsFailedError(
    `All upstream endpoints failed (${urls.join(', ')}): ${errors.map(e => `${e.url} [${e.error || e.code || e.status}]`).join('; ')}`,
    errors
  );
}

module.exports = {
  executeWithFailover,
  AllUpstreamsFailedError,
  parseUpstreamEndpoints
};
