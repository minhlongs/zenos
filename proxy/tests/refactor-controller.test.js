// proxy/tests/refactor-controller.test.js - Unit Tests for Refactor Controller
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { extractDeclarations, generateSlicePlan, applyPlan } = require('../src/workflow/refactor-controller.js');

test('extractDeclarations parses top-level functions and classes', () => {
  const code = `
  function add(a, b) {
    return a + b;
  }

  class Calculator {
    multiply(a, b) {
      return a * b;
    }
  }

  module.exports = { add, Calculator };
  `;
  const result = extractDeclarations(code.trim());
  assert.equal(result.decls.length, 2);
  assert.equal(result.decls[0].name, 'add');
  assert.equal(result.decls[1].name, 'Calculator');
});

test('generateSlicePlan creates submodules and barrel facade', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slice-test-'));
  const targetFile = path.join(tempDir, 'sample.js');
  const code = `
  function fn1() { return 1; }
  function fn2() { return 2; }
  function fn3() { return 3; }
  module.exports = { fn1, fn2, fn3 };
  `;
  fs.writeFileSync(targetFile, code.trim(), 'utf-8');

  const plan = generateSlicePlan(targetFile);
  assert.equal(plan.newFiles.length, 2);
  assert.ok(plan.newFiles[0].relativePath.includes('sample-core.js'));
  assert.ok(plan.newFiles[1].relativePath.includes('sample-utils.js'));
  assert.ok(plan.barrelFacade.content.includes('sample-core.js'));

  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('applyPlan rolls back if validation fails', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rollback-test-'));
  const targetFile = path.join(tempDir, 'target.js');
  const code = `
  function actionOne() { return 1; }
  function actionTwo() { return 2; }
  module.exports = { actionOne, actionTwo };
  `;
  fs.writeFileSync(targetFile, code.trim(), 'utf-8');

  const plan = generateSlicePlan(targetFile);
  // Specify a non-existent test to trigger verification failure
  const res = await applyPlan(plan, { testCommand: 'node -e "process.exit(1)"' });

  assert.equal(res.success, false);
  assert.ok(res.error.includes('Consensus failed'));
  // Ensure original file is restored
  const restoredContent = fs.readFileSync(targetFile, 'utf-8');
  assert.equal(restoredContent, code.trim());
  // Ensure submodules were deleted on rollback
  assert.equal(fs.existsSync(plan.newFiles[0].relativePath), false);

  fs.rmSync(tempDir, { recursive: true, force: true });
});
