'use strict';

const { spawn } = require('node:child_process');
const { EventEmitter } = require('node:events');

const activeJails = new Map();

class ProcessJail extends EventEmitter {
  constructor(options = {}) {
    super();
    this.defaultTimeoutMs = options.defaultTimeoutMs || 30000;
    this.gracePeriodMs = options.gracePeriodMs || 1000;
  }

  static getActiveJails() {
    return Array.from(activeJails.values()).map(jail => ({
      jailId: jail.jailId,
      pid: jail.child ? jail.child.pid : null,
      pgid: jail.child ? jail.child.pid : null,
      command: jail.command,
      startedAt: jail.startedAt,
      timedOut: jail.timedOut
    }));
  }

  static killAll(signal = 'SIGKILL') {
    let killed = 0;
    for (const jail of activeJails.values()) {
      if (jail.child && !jail.child.killed) {
        jail.kill(signal);
        killed++;
      }
    }
    return killed;
  }

  run(command, args = [], options = {}) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
      const cwd = options.cwd || process.cwd();
      const env = { ...process.env, ...(options.env || {}) };

      this.command = `${command} ${args.join(' ')}`.trim();
      this.startedAt = new Date().toISOString();
      this.timedOut = false;
      this.jailId = options.jailId || `jail_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      let stdout = '';
      let stderr = '';
      let timeoutTimer = null;
      let graceTimer = null;

      try {
        this.child = spawn(command, args, {
          cwd,
          env,
          detached: true,
          shell: options.shell !== undefined ? options.shell : true,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (err) {
        return resolve({
          exitCode: 1,
          stdout: '',
          stderr: err.message,
          durationMs: Date.now() - startTime,
          timedOut: false,
          killed: false
        });
      }

      const pid = this.child.pid;
      activeJails.set(this.jailId, this);
      this.emit('spawn', { jailId: this.jailId, pid, command: this.command });

      if (this.child.stdout) {
        this.child.stdout.on('data', chunk => { stdout += chunk.toString(); });
      }
      if (this.child.stderr) {
        this.child.stderr.on('data', chunk => { stderr += chunk.toString(); });
      }

      const cleanup = () => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        if (graceTimer) clearTimeout(graceTimer);
        activeJails.delete(this.jailId);
      };

      timeoutTimer = setTimeout(() => {
        this.timedOut = true;
        this.emit('timeout', { jailId: this.jailId, pid });
        this.killProcessTree('SIGTERM');

        graceTimer = setTimeout(() => {
          this.killProcessTree('SIGKILL');
        }, this.gracePeriodMs);
      }, timeoutMs);

      this.child.on('error', (err) => {
        cleanup();
        resolve({
          exitCode: 1,
          stdout,
          stderr: stderr ? `${stderr}\n${err.message}` : err.message,
          durationMs: Date.now() - startTime,
          timedOut: this.timedOut,
          killed: true
        });
      });

      this.child.on('close', (code, signal) => {
        cleanup();
        resolve({
          exitCode: code !== null ? code : (signal ? 128 : 1),
          signal: signal || null,
          stdout,
          stderr,
          durationMs: Date.now() - startTime,
          timedOut: this.timedOut,
          killed: this.timedOut || Boolean(signal)
        });
      });
    });
  }

  kill(signal = 'SIGTERM') {
    return this.killProcessTree(signal);
  }

  killProcessTree(signal = 'SIGTERM') {
    if (!this.child || !this.child.pid) return false;
    const pid = this.child.pid;
    try {
      // In POSIX, negative PID targets the entire process group
      process.kill(-pid, signal);
      this.emit('killed', { jailId: this.jailId, pid, signal });
      return true;
    } catch {
      try {
        this.child.kill(signal);
        return true;
      } catch {
        return false;
      }
    }
  }
}

module.exports = { ProcessJail };
