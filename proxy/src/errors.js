'use strict';

/**
 * Standard Anthropic API error formats:
 * - invalid_request_error (400)
 * - not_found_error (404)
 * - request_too_large (413)
 * - rate_limit_error (429)
 * - api_error (500 / 502 / 504)
 * - overloaded_error (503 / 529)
 */
function formatAnthropicError(type, message) {
  return {
    type: 'error',
    error: {
      type: type || 'api_error',
      message: message || 'An unexpected error occurred'
    }
  };
}

function sendAnthropicError(res, status, type, message) {
  return res.status(status).json(formatAnthropicError(type, message));
}

function mapErrorToAnthropic(err, defaultStatus = 502) {
  if (err.name === 'QueueOverloadError') {
    return { status: 503, type: 'overloaded_error' };
  }
  if (err.name === 'QueueTimeoutError') {
    return { status: 504, type: 'api_error' };
  }
  if (err.name === 'CapabilityError') {
    return { status: 400, type: 'invalid_request_error' };
  }
  if (err.name === 'AllUpstreamsFailedError') {
    return { status: 502, type: 'api_error' };
  }
  const status = err.status || defaultStatus;
  const type = err.type || (status === 400 ? 'invalid_request_error' : 'api_error');
  return { status, type };
}

module.exports = {
  formatAnthropicError,
  sendAnthropicError,
  mapErrorToAnthropic
};
