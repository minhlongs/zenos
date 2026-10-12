// proxy/tests/complexity-engine.test.js - Unit Tests for Complexity Engine
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {
  stripComments,
  countLines,
  countBranching,
  extractCoupling,
  calculateMonolithScore,
  analyzeFile,
  analyzeDirectory,
} = require('../src/workflow/complexity-engine.js');

test('countLines correctly categorizes lines and comments', () => {
  const code = `
  // Single line comment
  const x = 10;
  /* Multi-line
     comment */
  function test() {
    return x * 2;
  }
  `;
  const result = countLines(code.trim());
  assert.equal(result.commentLines, 3);
  assert.equal(result.codeLines, 4);
  assert.equal(result.totalLines, 7);
});

test('countBranching identifies keywords, ternaries, and iteration methods', () => {
  const code = `
  function process(items, flag) {
    if (flag) {
      for (const item of items) {
        if (item.valid && item.active) {
          return item ? item.val : null;
        }
      }
    } else if (items.length > 0) {
      return items.filter(x => x > 0).map(x => x * 2);
    }
    return [];
  }
  `;
  const count = countBranching(code);
  assert.ok(count >= 6, `Expected at least 6 branch tokens, got ${count}`);
});

test('extractCoupling parses CommonJS and ES module imports and exports', () => {
  const code = `
  import { foo } from 'bar';
  import def from './local';
  const fs = require('node:fs');
  export const val = 42;
  module.exports = { val };
  `;
  const coupling = extractCoupling(code);
  assert.equal(coupling.fanOut, 3);
  assert.ok(coupling.imports.includes('bar'));
  assert.ok(coupling.imports.includes('./local'));
  assert.ok(coupling.imports.includes('node:fs'));
  assert.ok(coupling.exportsCount >= 2);
});

test('calculateMonolithScore accurately calculates score and risk thresholds', () => {
  const low = calculateMonolithScore({ totalLines: 50, branchingCount: 3, fanOut: 2 });
  assert.equal(low.riskLevel, 'LOW');
  assert.ok(low.monolithScore < 25);

  const mod = calculateMonolithScore({ totalLines: 120, branchingCount: 5, fanOut: 3 });
  assert.equal(mod.riskLevel, 'MODERATE');
  assert.ok(mod.monolithScore >= 25 && mod.monolithScore < 50);

  const high = calculateMonolithScore({ totalLines: 180, branchingCount: 8, fanOut: 5 });
  assert.equal(high.riskLevel, 'HIGH');
  assert.ok(high.monolithScore >= 50 && high.monolithScore < 75);

  const critical = calculateMonolithScore({ totalLines: 320, branchingCount: 40, fanOut: 15 });
  assert.equal(critical.riskLevel, 'CRITICAL');
  assert.ok(critical.monolithScore >= 75);
});

test('analyzeFile and analyzeDirectory handle filesystem inspection', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'complexity-test-'));
  const file1 = path.join(tempDir, 'mod1.js');
  const file2 = path.join(tempDir, 'mod2.js');

  fs.writeFileSync(file1, 'const a = 1;\nif (a) { console.log(a); }\nmodule.exports = a;\n');
  fs.writeFileSync(file2, 'const b = 2;\n// comment\nmodule.exports = b;\n');

  const fileAnalysis = analyzeFile(file1);
  assert.equal(fileAnalysis.fileName, 'mod1.js');
  assert.ok(fileAnalysis.branchingCount >= 1);
  assert.ok(fileAnalysis.totalLines >= 3);

  const dirAnalysis = analyzeDirectory(tempDir);
  assert.equal(dirAnalysis.summary.totalFiles, 2);
  assert.equal(dirAnalysis.summary.workspaceHealthScore, 100);
  assert.equal(dirAnalysis.summary.highRiskFilesCount, 0);

  fs.rmSync(tempDir, { recursive: true, force: true });
});
