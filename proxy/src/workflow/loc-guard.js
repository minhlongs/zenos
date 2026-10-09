'use strict';

const fs = require('node:fs');
const path = require('node:path');

const MAX_LOC = 200;
const WARN_LOC = 180;
const DEFAULT_IGNORED_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'coverage', '.cache']);
const VALID_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.md']);

function countLines(content) {
  if (!content) return 0;
  return content.split(/\r\n|\r|\n/).length;
}

function validateContent(content, filePath = 'anonymous') {
  const lines = countLines(content);
  const valid = lines <= MAX_LOC;
  const warning = lines >= WARN_LOC && lines <= MAX_LOC;
  return {
    valid,
    lines,
    warning,
    maxLoc: MAX_LOC,
    warnLoc: WARN_LOC,
    filePath,
    error: valid ? null : `File ${filePath} exceeds ${MAX_LOC} LOC (${lines} lines)`
  };
}

function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return validateContent(content, filePath);
  } catch (err) {
    return {
      valid: false,
      lines: 0,
      warning: false,
      maxLoc: MAX_LOC,
      warnLoc: WARN_LOC,
      filePath,
      error: `Failed to read file ${filePath}: ${err.message}`
    };
  }
}

function validateFiles(filePaths) {
  const results = filePaths.map(validateFile);
  const passed = results.filter(r => r.valid).length;
  const warnings = results.filter(r => r.warning).length;
  const failed = results.length - passed;
  return {
    valid: failed === 0,
    totalFiles: results.length,
    passedFiles: passed,
    failedFiles: failed,
    warningFiles: warnings,
    results
  };
}

function scanDirectory(dirPath, options = {}) {
  const ignoredDirs = options.ignoredDirs || DEFAULT_IGNORED_DIRS;
  const validExts = options.validExts || VALID_EXTENSIONS;
  const matchedFiles = [];

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (validExts.has(ext)) {
          matchedFiles.push(fullPath);
        }
      }
    }
  }

  if (fs.existsSync(dirPath)) {
    walk(dirPath);
  }

  return validateFiles(matchedFiles);
}

module.exports = {
  MAX_LOC,
  WARN_LOC,
  countLines,
  validateContent,
  validateFile,
  validateFiles,
  scanDirectory
};
