'use strict';

const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const { validateFile } = require('./loc-guard');

const DEFAULT_MAX_ITERATIONS = 5;

class CookRunner {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || DEFAULT_MAX_ITERATIONS;
    this.defaultTestCommand = options.defaultTestCommand || 'node --test';
    this.runnerFn = options.runnerFn || this._defaultRunner.bind(this);
  }

  _defaultRunner(cmd, args = [], cwd = process.cwd()) {
    const startTime = Date.now();
    try {
      const res = spawnSync(cmd, args, {
        cwd,
        encoding: 'utf8',
        shell: true,
        timeout: 30000
      });
      return {
        exitCode: res.status !== null ? res.status : 1,
        stdout: res.stdout || '',
        stderr: res.stderr || (res.error ? res.error.message : ''),
        durationMs: Date.now() - startTime
      };
    } catch (err) {
      return {
        exitCode: 1,
        stdout: '',
        stderr: err.message,
        durationMs: Date.now() - startTime
      };
    }
  }

  validateTouchedFiles(filePaths = []) {
    const violations = [];
    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) {
        continue;
      }
      const check = validateFile(filePath);
      if (!check.valid) {
        violations.push({ filePath, lines: check.lines, error: check.error });
      }
    }
    return {
      valid: violations.length === 0,
      violations
    };
  }

  runCycle({
    testCommand = this.defaultTestCommand,
    testArgs = [],
    targetFiles = [],
    cwd = process.cwd(),
    iterationCallback = null
  } = {}) {
    let iteration = 0;
    const history = [];

    while (iteration < this.maxIterations) {
      iteration++;

      // If callback provided, allow simulating code modifications per iteration
      if (typeof iterationCallback === 'function') {
        try {
          iterationCallback(iteration);
        } catch (cbErr) {
          return {
            success: false,
            iterations: iteration,
            state: 'CALLBACK_ERROR',
            error: cbErr.message,
            history
          };
        }
      }

      // Check LOC invariant on all targetFiles
      if (targetFiles.length > 0) {
        const locCheck = this.validateTouchedFiles(targetFiles);
        if (!locCheck.valid) {
          const violationMsg = locCheck.violations.map(v => v.error).join('; ');
          history.push({
            iteration,
            stage: 'LOC_CHECK',
            exitCode: 1,
            error: violationMsg
          });
          return {
            success: false,
            iterations: iteration,
            state: 'LOC_LIMIT_EXCEEDED',
            error: `Target files violate < 200 LOC rule: ${violationMsg}`,
            history
          };
        }
      }

      // Execute tests
      const result = this.runnerFn(testCommand, testArgs, cwd);
      history.push({
        iteration,
        stage: 'TEST_RUN',
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: result.durationMs
      });

      if (result.exitCode === 0) {
        return {
          success: true,
          iterations: iteration,
          state: 'PASSED',
          history
        };
      }
    }

    // Circuit breaker tripped
    return {
      success: false,
      iterations: iteration,
      state: 'CIRCUIT_BREAKER_TRIGGERED',
      error: `Circuit breaker tripped after ${this.maxIterations} consecutive test failures`,
      history
    };
  }
}

module.exports = { CookRunner, DEFAULT_MAX_ITERATIONS };
