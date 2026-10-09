'use strict';

const { URL } = require('node:url');
const net = require('node:net');

const FORBIDDEN_HOSTNAMES = new Set([
  '169.254.169.254',
  'metadata.google.internal',
  '0.0.0.0'
]);

function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 169.254.0.0/16 (Link Local / IMDS)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 0.0.0.0/8
  if (parts[0] === 0) return true;
  return false;
}

function validateUpstreamUrl(urlStr, allowedHosts = []) {
  if (!urlStr || typeof urlStr !== 'string') {
    throw new Error('Invalid URL provided');
  }

  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error(`Malformed URL: ${urlStr}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Invalid or unsupported protocol: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (FORBIDDEN_HOSTNAMES.has(hostname)) {
    throw new Error(`Forbidden upstream: Target hostname is restricted (${hostname})`);
  }

  if (net.isIPv4(hostname) && isPrivateIPv4(hostname)) {
    // If not loopback 127.0.0.1 or explicitly requested
    if (hostname !== '127.0.0.1') {
      throw new Error(`Forbidden upstream: Private IP target restricted (${hostname})`);
    }
  }

  if (allowedHosts && allowedHosts.length > 0) {
    const isExplicitlyAllowed = allowedHosts.some(allowed => {
      const norm = allowed.toLowerCase().replace(/^\[|\]$/g, '');
      return norm === hostname;
    });
    if (!isExplicitlyAllowed) {
      throw new Error(`Upstream host not allowed: ${hostname}`);
    }
  }

  return parsed.toString();
}

function isAllowedUpstreamUrl(urlStr, allowedHosts = []) {
  try {
    validateUpstreamUrl(urlStr, allowedHosts);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  validateUpstreamUrl,
  isAllowedUpstreamUrl
};
