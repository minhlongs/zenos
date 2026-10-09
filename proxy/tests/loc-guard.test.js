'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {
  countLines,
  validateContent,
  validateFile,
  validateFiles,
  scanDirectory,
  MAX_LOC,
  WARN_LOC
} = require('../src/workflow/loc-guard');

test('loc-guard: countLines accurate with different newlines', () => {
  assert.equal(countLines(''), 0);
  assert.equal(countLines('a'), 1);
  assert.equal(countLines('a\nb'), 2);
  assert.equal(countLines('a\r\nb\r\nc'), 3);
  assert.equal(countLines('line1\nline2\nline3\n'), 4);
});

test('loc-guard: validateContent checks boundaries', () => {
  const shortContent = 'console.log("hello");\n'.repeat(50);
  const resShort = validateContent(shortContent, 'test.js');
  assert.equal(resShort.valid, true);
  assert.equal(resShort.warning, false);
  assert.equal(resShort.lines, 51);

  const warnContent = 'console.log("warn");\n'.repeat(185);
  const resWarn = validateContent(warnContent, 'warn.js');
  assert.equal(resWarn.valid, true);
  assert.equal(resWarn.warning, true);
  assert.equal(resWarn.lines, 186);

  const overflowContent = 'console.log("fail");\n'.repeat(210);
  const resOverflow = validateContent(overflowContent, 'fail.js');
  assert.equal(resOverflow.valid, false);
  assert.equal(resOverflow.lines, 211);
  assert.ok(resOverflow.error.includes('exceeds 200 LOC'));
});

test('loc-guard: validateFile reads and validates real files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loc-guard-test-'));
  const okFile = path.join(tmpDir, 'ok.js');
  const badFile = path.join(tmpDir, 'bad.js');

  fs.writeFileSync(okFile, 'let x = 1;\n'.repeat(20));
  fs.writeFileSync(badFile, 'let y = 2;\n'.repeat(205));

  const okRes = validateFile(okFile);
  assert.equal(okRes.valid, true);
  assert.equal(okRes.lines, 21);

  const badRes = validateFile(badFile);
  assert.equal(badRes.valid, false);
  assert.equal(badRes.lines, 206);

  const missingRes = validateFile(path.join(tmpDir, 'nonexistent.js'));
  assert.equal(missingRes.valid, false);
  assert.ok(missingRes.error.includes('Failed to read file'));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('loc-guard: validateFiles aggregates batch results', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loc-guard-batch-'));
  const file1 = path.join(tmpDir, 'f1.js');
  const file2 = path.join(tmpDir, 'f2.js');

  fs.writeFileSync(file1, 'const a = 1;\n');
  fs.writeFileSync(file2, 'const b = 2;\n');

  const batch = validateFiles([file1, file2]);
  assert.equal(batch.valid, true);
  assert.equal(batch.totalFiles, 2);
  assert.equal(batch.passedFiles, 2);
  assert.equal(batch.failedFiles, 0);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('loc-guard: scanDirectory traverses and respects ignored dirs', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loc-guard-scan-'));
  const subDir = path.join(tmpDir, 'sub');
  const ignoredDir = path.join(tmpDir, 'node_modules');
  fs.mkdirSync(subDir);
  fs.mkdirSync(ignoredDir);

  fs.writeFileSync(path.join(tmpDir, 'root.js'), 'const r = 1;\n');
  fs.writeFileSync(path.join(subDir, 'child.js'), 'const c = 1;\n');
  fs.writeFileSync(path.join(ignoredDir, 'ignored.js'), 'const ig = 1;\n');

  const scan = scanDirectory(tmpDir);
  assert.equal(scan.valid, true);
  assert.equal(scan.totalFiles, 2); // root.js and child.js, ignored.js skipped
  assert.equal(scan.passedFiles, 2);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
