'use strict';

class CapabilityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CapabilityError';
    this.status = 400;
  }
}

/**
 * Parses model alias string which can be JSON or comma-separated key=value pairs.
 * @param {string|null|undefined} input
 * @returns {Record<string, string>}
 */
function parseModelAliases(input) {
  if (!input || typeof input !== 'string') return {};
  const trimmed = input.trim();
  if (!trimmed) return {};

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }

  // Parse comma-separated key=value pairs
  const result = {};
  const pairs = trimmed.split(',');
  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(s => s && s.trim());
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Resolves a model name against alias map with exact and wildcard prefix support.
 * If defaultModel is specified (not null/undefined), falls back to defaultModel.
 * Otherwise preserves requestedModel.
 * @param {string} requestedModel
 * @param {Record<string, string>} aliasMap
 * @param {string|null} defaultModel
 * @returns {string}
 */
function resolveModel(requestedModel, aliasMap = {}, defaultModel = null) {
  if (!requestedModel || typeof requestedModel !== 'string') {
    return defaultModel || 'local-model';
  }

  const model = requestedModel.trim();
  if (!model) return defaultModel || 'local-model';

  // 1. Exact match
  if (aliasMap[model]) {
    return aliasMap[model];
  }

  // 2. Wildcard / Prefix match (e.g. claude-3-5-sonnet* or prefix*)
  for (const [pattern, target] of Object.entries(aliasMap)) {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (model.startsWith(prefix)) {
        return target;
      }
    }
  }

  // 3. Fallback to default if provided, otherwise preserve model
  return (defaultModel !== null && defaultModel !== undefined) ? defaultModel : model;
}

/**
 * Validates request payload against known model capabilities.
 * @param {string} resolvedModel
 * @param {object} requestBody
 * @param {Record<string, {tools?: boolean, maxContextTokens?: number}>} capabilitiesMap
 */
function validateCapabilities(resolvedModel, requestBody = {}, capabilitiesMap = {}) {
  const cap = capabilitiesMap[resolvedModel];
  if (!cap) return;

  const hasTools = Array.isArray(requestBody.tools) && requestBody.tools.length > 0;
  if (hasTools && cap.tools === false) {
    throw new CapabilityError(
      `Model '${resolvedModel}' does not support function calling / tools`
    );
  }
}

module.exports = {
  resolveModel,
  parseModelAliases,
  validateCapabilities,
  CapabilityError
};
