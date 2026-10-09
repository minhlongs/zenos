'use strict';

const fs = require('node:fs');
const path = require('node:path');

class DiagnosticExtractor {
  constructor(options = {}) {
    this.workspaceRoot = path.resolve(options.workspaceRoot || process.cwd());
    this.maxStackLines = options.maxStackLines || 4;
    this.contextRadius = options.contextRadius || 4;
  }

  extract(errorOutput, options = {}) {
    if (!errorOutput) {
      return { faultFile: null, faultLine: null, failureMessage: '', stackSnippet: '', codeContext: '' };
    }
    const text = typeof errorOutput === 'string' ? errorOutput : String(errorOutput.message || errorOutput);
    const failureMessage = this.extractFailureMessage(text);
    const location = this.extractLocation(text, options.targetFile);
    const stackSnippet = this.extractStackSnippet(text);
    const codeContext = location.faultFile && location.faultLine
      ? this.extractCodeContext(location.faultFile, location.faultLine)
      : '';

    return {
      faultFile: location.faultFile,
      faultLine: location.faultLine,
      failureMessage,
      stackSnippet,
      codeContext,
      summary: this.formatSummary(failureMessage, location, codeContext)
    };
  }

  extractFailureMessage(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^(Error|AssertionError|TypeError|SyntaxError|ReferenceError|RangeError):/i.test(line)) {
        return line.slice(0, 200);
      }
      if (/^(not ok|✖|FAIL|failed:)/i.test(line)) {
        return line.slice(0, 200);
      }
    }
    return lines[0] ? lines[0].slice(0, 200) : 'Unknown failure';
  }

  extractLocation(text, fallbackFile = null) {
    const lines = text.split(/\r?\n/);
    const locRegex = /(?:at\s+.*?\s+\()?([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+):(\d+)(?::(\d+))?\)?/;

    for (const line of lines) {
      const match = line.match(locRegex);
      if (match) {
        const candidate = match[1];
        const lineNum = parseInt(match[2], 10);
        if (!candidate.includes('node_modules') && !candidate.startsWith('node:')) {
          const resolved = path.isAbsolute(candidate)
            ? path.relative(this.workspaceRoot, candidate)
            : candidate;
          return { faultFile: resolved, faultLine: lineNum };
        }
      }
    }

    return { faultFile: fallbackFile || null, faultLine: null };
  }

  extractStackSnippet(text) {
    const lines = text.split(/\r?\n/).filter(l => /^\s*at\s+/.test(l));
    const filtered = lines.filter(l => !l.includes('node_modules') && !l.includes('node:internal'));
    return filtered.slice(0, this.maxStackLines).join('\n');
  }

  extractCodeContext(relFilePath, lineNum) {
    try {
      const fullPath = path.resolve(this.workspaceRoot, relFilePath);
      if (!fs.existsSync(fullPath)) return '';
      const content = fs.readFileSync(fullPath, 'utf8');
      const allLines = content.split(/\r?\n/);

      const start = Math.max(0, lineNum - 1 - this.contextRadius);
      const end = Math.min(allLines.length, lineNum + this.contextRadius);

      return allLines.slice(start, end).map((line, idx) => {
        const currentLineNum = start + idx + 1;
        const marker = currentLineNum === lineNum ? '>> ' : '   ';
        return `${marker}${currentLineNum} | ${line}`;
      }).join('\n');
    } catch {
      return '';
    }
  }

  formatSummary(message, location, codeContext) {
    let out = `Failure: ${message}\n`;
    if (location.faultFile) {
      out += `Location: ${location.faultFile}${location.faultLine ? ':' + location.faultLine : ''}\n`;
    }
    if (codeContext) {
      out += `Surrounding Code:\n${codeContext}\n`;
    }
    return out.trim();
  }
}

module.exports = { DiagnosticExtractor };
