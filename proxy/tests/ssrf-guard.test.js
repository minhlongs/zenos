'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateUpstreamUrl, isAllowedUpstreamUrl } = require('../src/ssrf-guard');

describe('SSRF & Upstream Guard (Gate 4)', () => {
  const allowedHosts = ['localhost', '127.0.0.1', 'api.anthropic.com'];

  it('allows valid authorized upstreams', () => {
    const valid = [
      'http://localhost:1234/v1/chat/completions',
      'http://127.0.0.1:1234/v1/models',
      'https://api.anthropic.com/v1/messages'
    ];
    for (const url of valid) {
      assert.equal(isAllowedUpstreamUrl(url, allowedHosts), true);
      assert.doesNotThrow(() => validateUpstreamUrl(url, allowedHosts));
    }
  });

  it('blocks cloud metadata IMDS targets', () => {
    const imds = [
      'http://169.254.169.254/latest/meta-data/',
      'http://metadata.google.internal/computeMetadata/v1/',
      'http://169.254.169.254:80/'
    ];
    for (const url of imds) {
      assert.equal(isAllowedUpstreamUrl(url, allowedHosts), false);
      assert.throws(() => validateUpstreamUrl(url, allowedHosts), /Forbidden upstream/);
    }
  });

  it('blocks disallowed private IP networks and loopback bypasses', () => {
    const privateIps = [
      'http://10.0.0.1:8080',
      'http://192.168.1.1:80',
      'http://172.16.0.1:443',
      'http://0.0.0.0:1234',
      'http://[::1]:1234'
    ];
    for (const url of privateIps) {
      assert.equal(isAllowedUpstreamUrl(url, allowedHosts), false);
      assert.throws(() => validateUpstreamUrl(url, allowedHosts), /(Forbidden upstream|Upstream host not allowed)/);
    }
  });

  it('blocks non-http protocols (file://, gopher://, ftp://)', () => {
    const dangerousProtocols = [
      'file:///etc/passwd',
      'gopher://127.0.0.1:6379/_flushall',
      'ftp://localhost:21'
    ];
    for (const url of dangerousProtocols) {
      assert.equal(isAllowedUpstreamUrl(url, allowedHosts), false);
      assert.throws(() => validateUpstreamUrl(url, allowedHosts), /Invalid or unsupported protocol/);
    }
  });

  it('blocks hosts not on explicit allowedHosts list', () => {
    const unapproved = 'http://attacker-controlled-server.com/hook';
    assert.equal(isAllowedUpstreamUrl(unapproved, allowedHosts), false);
    assert.throws(() => validateUpstreamUrl(unapproved, allowedHosts), /Upstream host not allowed/);
  });
});
