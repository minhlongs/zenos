'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { DiagnosticExtractor } = require('../src/workflow/diagnostic-extractor.js');

test('DiagnosticExtractor parses assertion error and fault line', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diag-test-'));
  const testFile = path.join(tmpDir, 'sample.js');
  fs.writeFileSync(testFile, 'line1\nline2\nline3\nline4_error\nline5\n', 'utf8');

  const rawError = `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    at testFunction (${testFile}:4:5)
    at runTest (node:internal/test_runner/test:42:10)`;

  const extractor = new DiagnosticExtractor({ workspaceRoot: tmpDir });
  const result = extractor.extract(rawError);

  assert.strictEqual(result.faultFile, 'sample.js');
  assert.strictEqual(result.faultLine, 4);
  assert.ok(result.failureMessage.includes('AssertionError'));
  assert.ok(result.codeContext.includes('>> 4 | line4_error'));
  assert.ok(result.summary.includes('Location: sample.js:4'));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('DiagnosticExtractor handles error without stack trace gracefully', () => {
  const extractor = new DiagnosticExtractor();
  const result = extractor.extract('Simple syntax error message');

  assert.strictEqual(result.faultFile, null);
  assert.strictEqual(result.faultLine, null);
  assert.strictEqual(result.failureMessage, 'Simple syntax error message');
});
