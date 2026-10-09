'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveModel,
  parseModelAliases,
  validateCapabilities,
  CapabilityError
} = require('../src/router');

describe('Model Router & Capability Validation', () => {
  describe('parseModelAliases', () => {
    it('parses valid JSON string of aliases', () => {
      const json = JSON.stringify({
        'claude-3-5-sonnet*': 'qwen2.5-coder-7b',
        'claude-3-opus*': 'deepseek-r1-14b'
      });
      const parsed = parseModelAliases(json);
      assert.equal(parsed['claude-3-5-sonnet*'], 'qwen2.5-coder-7b');
      assert.equal(parsed['claude-3-opus*'], 'deepseek-r1-14b');
    });

    it('parses comma-separated key=value pairs', () => {
      const csv = 'claude-3-5-sonnet*=qwen2.5-coder-7b, claude-3-haiku*=phi-3-mini';
      const parsed = parseModelAliases(csv);
      assert.equal(parsed['claude-3-5-sonnet*'], 'qwen2.5-coder-7b');
      assert.equal(parsed['claude-3-haiku*'], 'phi-3-mini');
    });

    it('returns empty object for undefined or empty input', () => {
      assert.deepEqual(parseModelAliases(''), {});
      assert.deepEqual(parseModelAliases(null), {});
      assert.deepEqual(parseModelAliases(undefined), {});
    });

    it('handles malformed input gracefully', () => {
      assert.deepEqual(parseModelAliases('{bad-json'), {});
    });
  });

  describe('resolveModel', () => {
    const aliases = {
      'claude-3-5-sonnet-20241022': 'exact-local-model',
      'claude-3-5-sonnet*': 'qwen2.5-coder-7b',
      'claude-3-haiku*': 'phi-3-mini',
      'deepseek*': 'deepseek-r1-14b'
    };
    const defaultModel = 'default-fallback-model';

    it('resolves exact match before prefix/wildcard', () => {
      const resolved = resolveModel('claude-3-5-sonnet-20241022', aliases, defaultModel);
      assert.equal(resolved, 'exact-local-model');
    });

    it('resolves wildcard prefix match', () => {
      const resolved = resolveModel('claude-3-5-sonnet-latest', aliases, defaultModel);
      assert.equal(resolved, 'qwen2.5-coder-7b');
    });

    it('falls back to defaultModel when no alias matches', () => {
      const resolved = resolveModel('unknown-model-xyz', aliases, defaultModel);
      assert.equal(resolved, defaultModel);
    });

    it('falls back to defaultModel when requested model is empty or null', () => {
      assert.equal(resolveModel('', aliases, defaultModel), defaultModel);
      assert.equal(resolveModel(null, aliases, defaultModel), defaultModel);
      assert.equal(resolveModel(undefined, aliases, defaultModel), defaultModel);
    });
  });

  describe('validateCapabilities', () => {
    const capabilities = {
      'tool-model': { tools: true, maxContextTokens: 32768 },
      'no-tool-model': { tools: false, maxContextTokens: 8192 }
    };

    it('allows request with tools when model supports tools', () => {
      const body = {
        model: 'tool-model',
        tools: [{ name: 'read_file', description: 'reads file' }]
      };
      assert.doesNotThrow(() => {
        validateCapabilities('tool-model', body, capabilities);
      });
    });

    it('throws CapabilityError when model does not support tools but request has tools', () => {
      const body = {
        model: 'no-tool-model',
        tools: [{ name: 'read_file', description: 'reads file' }]
      };
      assert.throws(
        () => validateCapabilities('no-tool-model', body, capabilities),
        (err) => {
          assert.ok(err instanceof CapabilityError);
          assert.match(err.message, /tools|function calling/i);
          return true;
        }
      );
    });

    it('allows tool-less request on model without tool support', () => {
      const body = {
        model: 'no-tool-model',
        messages: [{ role: 'user', content: 'hello' }]
      };
      assert.doesNotThrow(() => {
        validateCapabilities('no-tool-model', body, capabilities);
      });
    });

    it('passes unknown model if no capability restrictions are configured', () => {
      const body = { model: 'any-model', tools: [{ name: 'test' }] };
      assert.doesNotThrow(() => {
        validateCapabilities('any-model', body, {});
      });
    });
  });
});
