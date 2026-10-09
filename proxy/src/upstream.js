'use strict';

const { LMSTUDIO_URL, UPSTREAM_TIMEOUT_MS } = require('./config');
const { redactSecrets } = require('./security');

class UpstreamError extends Error {
  constructor(message, status = 502, code = 'api_error') {
    super(redactSecrets(message));
    this.name = 'UpstreamError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Fetches an endpoint on the configured upstream LM Studio server.
 */
async function fetchUpstream(path, options = {}, clientSignal = null, customBaseUrl = null) {
  const baseUrl = customBaseUrl || LMSTUDIO_URL;
  const url = `${baseUrl}${path}`;
  const timeoutMs = options.timeoutMs || UPSTREAM_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Upstream request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  let onClientAbort = null;
  if (clientSignal) {
    if (clientSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      onClientAbort = () => controller.abort();
      clientSignal.addEventListener('abort', onClientAbort, { once: true });
    }
  }

  try {
    const fetchOptions = {
      ...options,
      signal: controller.signal
    };
    delete fetchOptions.timeoutMs;

    const res = await fetch(url, fetchOptions);
    return res;
  } catch (err) {
    if (clientSignal && clientSignal.aborted) {
      throw new UpstreamError('Client canceled the request', 499, 'canceled_error');
    }
    if (controller.signal.aborted) {
      throw new UpstreamError(`Upstream timed out after ${timeoutMs}ms`, 504, 'timeout_error');
    }
    throw new UpstreamError(`Failed to connect to upstream LM Studio: ${err.message}`, 502, 'api_error');
  } finally {
    clearTimeout(timeoutId);
    if (clientSignal && onClientAbort) {
      clientSignal.removeEventListener('abort', onClientAbort);
    }
  }
}

module.exports = {
  fetchUpstream,
  UpstreamError
};
