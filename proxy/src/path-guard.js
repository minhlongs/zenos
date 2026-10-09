'use strict';

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const SENSITIVE_PREFIXES = [
  '/etc',
  '/var/run',
  '/proc',
  '/sys',
  path.join(os.homedir(), '.ssh'),
  path.join(os.homedir(), '.aws'),
  path.join(os.homedir(), '.gnupg')
];

function isSensitivePath(resolvedPath) {
  for (const prefix of SENSITIVE_PREFIXES) {
    if (resolvedPath === prefix || resolvedPath.startsWith(prefix + path.sep)) {
      return true;
    }
  }
  return false;
}

function normalizeRoot(rootPath) {
  try {
    return fs.realpathSync(path.resolve(rootPath));
  } catch {
    return path.resolve(rootPath);
  }
}

function resolveRealPath(targetPath) {
  const absolute = path.resolve(targetPath);
  try {
    return fs.realpathSync(absolute);
  } catch {
    // If target doesn't exist yet, resolve parent realpath
    let current = path.dirname(absolute);
    const parts = [path.basename(absolute)];
    while (current && current !== path.dirname(current)) {
      try {
        const real = fs.realpathSync(current);
        return path.join(real, ...parts);
      } catch {
        parts.unshift(path.basename(current));
        current = path.dirname(current);
      }
    }
    return absolute;
  }
}

function isPathAllowed(targetPath, allowedRoots = []) {
  try {
    validatePath(targetPath, allowedRoots);
    return true;
  } catch {
    return false;
  }
}

function validatePath(targetPath, allowedRoots = []) {
  if (!targetPath || typeof targetPath !== 'string') {
    throw new Error('Invalid path provided');
  }

  const absolute = path.resolve(targetPath);
  const normalizedRoots = allowedRoots.map(normalizeRoot);
  const realResolved = resolveRealPath(absolute);

  if (isSensitivePath(absolute) || isSensitivePath(realResolved)) {
    throw new Error(`Access to sensitive path denied: ${targetPath}`);
  }

  const withinSyntactic = normalizedRoots.some(root =>
    absolute === root || absolute.startsWith(root + path.sep) ||
    root === resolveRealPath(root)
  );

  const withinReal = normalizedRoots.some(root =>
    realResolved === root || realResolved.startsWith(root + path.sep)
  );

  if (!withinReal) {
    throw new Error(`Path resolves outside allowed workspace roots: ${targetPath}`);
  }

  return realResolved;
}

module.exports = {
  validatePath,
  isPathAllowed
};
