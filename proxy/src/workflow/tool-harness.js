'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { validatePath } = require('../path-guard');
const { classifyCommand, RISK_TIERS } = require('../command-guard');
const { ProcessJail } = require('./process-jail');

const IGNORED_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'coverage', '.cache']);

class ToolHarness {
  constructor(options = {}) {
    this.workspaceRoot = path.resolve(options.workspaceRoot || process.cwd());
    this.processJail = options.processJail || new ProcessJail();
    this.maxOutputChars = options.maxOutputChars || 8000;
  }

  async execute(name, args = {}) {
    try {
      switch (name) {
        case 'read_file':
          return await this.readFile(args);
        case 'write_file':
          return await this.writeFile(args);
        case 'edit_file':
          return await this.editFile(args);
        case 'list_files':
          return await this.listFiles(args);
        case 'execute_command':
          return await this.executeCommand(args);
        default:
          return { success: false, error: `Unknown tool: ${name}` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async readFile({ filePath, startLine = 1, endLine = 200 } = {}) {
    if (!filePath) throw new Error('filePath is required');
    const safePath = validatePath(path.resolve(this.workspaceRoot, filePath), [this.workspaceRoot]);
    if (!fs.existsSync(safePath)) throw new Error(`File not found: ${filePath}`);

    const raw = fs.readFileSync(safePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const start = Math.max(1, parseInt(startLine, 10) || 1);
    const end = Math.min(lines.length, parseInt(endLine, 10) || (start + 199));
    const selected = lines.slice(start - 1, end).map((l, i) => `${start + i}\t${l}`).join('\n');

    return {
      success: true,
      filePath,
      totalLines: lines.length,
      startLine: start,
      endLine: end,
      output: selected
    };
  }

  async writeFile({ filePath, content } = {}) {
    if (!filePath) throw new Error('filePath is required');
    if (content === undefined) throw new Error('content is required');

    const targetPath = path.resolve(this.workspaceRoot, filePath);
    const safePath = validatePath(targetPath, [this.workspaceRoot]);
    fs.mkdirSync(path.dirname(safePath), { recursive: true });

    const tmpPath = `${safePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, safePath);

    return { success: true, filePath, bytesWritten: Buffer.byteLength(content, 'utf8') };
  }

  async editFile({ filePath, oldString, newString } = {}) {
    if (!filePath || oldString === undefined || newString === undefined) {
      throw new Error('filePath, oldString, and newString are required');
    }
    const safePath = validatePath(path.resolve(this.workspaceRoot, filePath), [this.workspaceRoot]);
    if (!fs.existsSync(safePath)) throw new Error(`File not found: ${filePath}`);

    const content = fs.readFileSync(safePath, 'utf8');
    const occurrences = content.split(oldString).length - 1;
    if (occurrences === 0) throw new Error(`oldString not found in ${filePath}`);
    if (occurrences > 1) throw new Error(`oldString matches ${occurrences} times in ${filePath}; must match exactly once`);

    const updated = content.replace(oldString, newString);
    await this.writeFile({ filePath, content: updated });
    return { success: true, filePath, replaced: true };
  }

  async listFiles({ dirPath = '.', maxFiles = 100 } = {}) {
    const targetDir = path.resolve(this.workspaceRoot, dirPath);
    const safeDir = validatePath(targetDir, [this.workspaceRoot]);
    if (!fs.existsSync(safeDir)) throw new Error(`Directory not found: ${dirPath}`);

    const results = [];
    function walk(current, base) {
      if (results.length >= maxFiles) return;
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (results.length >= maxFiles) break;
        if (IGNORED_DIRS.has(entry.name)) continue;
        const rel = path.relative(base, path.join(current, entry.name));
        if (entry.isDirectory()) {
          walk(path.join(current, entry.name), base);
        } else {
          results.push(rel);
        }
      }
    }
    walk(safeDir, safeDir);
    return { success: true, count: results.length, files: results, output: results.join('\n') };
  }

  async executeCommand({ command, timeoutMs = 30000 } = {}) {
    if (!command || typeof command !== 'string') throw new Error('command is required');
    const risk = classifyCommand(command);
    if (risk.tier === RISK_TIERS.BLOCKED || risk.blocked) {
      throw new Error(`Command blocked by security policy: ${command}`);
    }

    const result = await this.processJail.run(command, [], {
      cwd: this.workspaceRoot,
      timeoutMs
    });

    const combinedOutput = ((result.stdout || '') + (result.stderr ? `\nSTDERR:\n${result.stderr}` : '')).trim();
    const truncated = combinedOutput.length > this.maxOutputChars
      ? `${combinedOutput.slice(0, this.maxOutputChars)}\n...[output truncated]`
      : combinedOutput;

    return {
      success: result.exitCode === 0,
      exitCode: result.exitCode,
      output: truncated || (result.exitCode === 0 ? '(command executed with no output)' : '(command failed)'),
      durationMs: result.durationMs,
      timedOut: result.timedOut
    };
  }

  getToolDefinitions() {
    return [
      {
        name: 'read_file',
        description: 'Read contents of a file with line numbers',
        parameters: { filePath: 'string', startLine: 'number (optional)', endLine: 'number (optional)' }
      },
      {
        name: 'write_file',
        description: 'Atomically write or overwrite a file within workspace',
        parameters: { filePath: 'string', content: 'string' }
      },
      {
        name: 'edit_file',
        description: 'Replace an exact unique substring in a file with new content',
        parameters: { filePath: 'string', oldString: 'string', newString: 'string' }
      },
      {
        name: 'list_files',
        description: 'List files in workspace recursively excluding build/git directories',
        parameters: { dirPath: 'string (optional)', maxFiles: 'number (optional)' }
      },
      {
        name: 'execute_command',
        description: 'Execute a sandboxed shell command inside detached process jail',
        parameters: { command: 'string', timeoutMs: 'number (optional)' }
      }
    ];
  }
}

module.exports = { ToolHarness };
