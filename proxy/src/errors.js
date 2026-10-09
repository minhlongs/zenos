'use strict';

/**
 * Standard Anthropic API error formats:
 * - invalid_request_error (400)
 * - not_found_error (404)
 * - request_too_large (413)
 * - rate_limit_error (429)
 * - api_error (500)
 * - overloaded_error (529)
 * - timeout_error (504)
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

module.exports = {
  formatAnthropicError,
  sendAnthropicError
};
