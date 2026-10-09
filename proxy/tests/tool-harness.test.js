'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { ToolHarness } = require('../src/workflow/tool-harness');

test('ToolHarness: read_file and write_file within workspace', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-tool-harness-'));
  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const harness = new ToolHarness({ workspaceRoot: tmpDir });

  // Write file
  const writeRes = await harness.execute('write_file', {
    filePath: 'test.txt',
    content: 'Line 1\nLine 2\nLine 3'
  });
  assert.equal(writeRes.success, true);
  assert.equal(writeRes.bytesWritten > 0, true);

  // Read file
  const readRes = await harness.execute('read_file', {
    filePath: 'test.txt',
    startLine: 1,
    endLine: 2
  });
  assert.equal(readRes.success, true);
  assert.equal(readRes.totalLines, 3);
  assert.equal(readRes.output, '1\tLine 1\n2\tLine 2');
});

test('ToolHarness: edit_file replaces unique string', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-tool-harness-'));
  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const harness = new ToolHarness({ workspaceRoot: tmpDir });
  await harness.execute('write_file', {
    filePath: 'sample.js',
    content: 'const a = 1;\nconst b = 2;'
  });

  const editRes = await harness.execute('edit_file', {
    filePath: 'sample.js',
    oldString: 'const b = 2;',
    newString: 'const b = 42;'
  });
  assert.equal(editRes.success, true);

  const readRes = await harness.execute('read_file', { filePath: 'sample.js' });
  assert.match(readRes.output, /const b = 42;/);
});

test('ToolHarness: edit_file fails on ambiguous or missing match', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-tool-harness-'));
  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const harness = new ToolHarness({ workspaceRoot: tmpDir });
  await harness.execute('write_file', {
    filePath: 'dup.txt',
    content: 'hello hello'
  });

  const missingRes = await harness.execute('edit_file', {
    filePath: 'dup.txt',
    oldString: 'world',
    newString: 'universe'
  });
  assert.equal(missingRes.success, false);
  assert.match(missingRes.error, /not found/);

  const dupRes = await harness.execute('edit_file', {
    filePath: 'dup.txt',
    oldString: 'hello',
    newString: 'hi'
  });
  assert.equal(dupRes.success, false);
  assert.match(dupRes.error, /matches 2 times/);
});

test('ToolHarness: list_files returns directory contents and ignores forbidden dirs', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-tool-harness-'));
  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const harness = new ToolHarness({ workspaceRoot: tmpDir });
  await harness.execute('write_file', { filePath: 'src/index.js', content: 'console.log(1);' });
  await harness.execute('write_file', { filePath: 'node_modules/fake.js', content: 'fake' });
  await harness.execute('write_file', { filePath: 'README.md', content: '# Docs' });

  const listRes = await harness.execute('list_files', {});
  assert.equal(listRes.success, true);
  assert.equal(listRes.files.includes('src/index.js'), true);
  assert.equal(listRes.files.includes('README.md'), true);
  assert.equal(listRes.files.some(f => f.includes('node_modules')), false);
});

test('ToolHarness: blocks path traversal outside workspace', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-tool-harness-'));
  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const harness = new ToolHarness({ workspaceRoot: tmpDir });
  const res = await harness.execute('read_file', { filePath: '../../../../etc/passwd' });
  assert.equal(res.success, false);
});

test('ToolHarness: execute_command runs safe commands and blocks dangerous ones', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-tool-harness-'));
  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const harness = new ToolHarness({ workspaceRoot: tmpDir });
  const safeRes = await harness.execute('execute_command', { command: 'echo "hello from harness"' });
  assert.equal(safeRes.success, true);
  assert.match(safeRes.output, /hello from harness/);

  const blockedRes = await harness.execute('execute_command', { command: 'rm -rf /' });
  assert.equal(blockedRes.success, false);
  assert.match(blockedRes.error, /Command blocked by security policy/);
});
