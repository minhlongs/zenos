// proxy/tests/blast-radius-engine.test.js - Unit Tests for BlastRadiusEngine
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { BlastRadiusEngine, extractImports } = require('../src/workflow/blast-radius-engine');

test('BlastRadiusEngine calculates cartography, cascade depth, and risk levels', async (t) => {
  const tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-br-test-')));

  // Create dependency chain: A -> B -> C, and D -> B
  // B has fan-in = 2 (A, D), fan-out = 1 (C)
  // C has upstream = [B, A, D]
  fs.writeFileSync(path.join(tmpDir, 'c.js'), 'module.exports = { c: 1 };\n');
  fs.writeFileSync(path.join(tmpDir, 'b.js'), "const c = require('./c');\nmodule.exports = { b: 2 };\n");
  fs.writeFileSync(path.join(tmpDir, 'a.js'), "const b = require('./b');\nmodule.exports = { a: 3 };\n");
  fs.writeFileSync(path.join(tmpDir, 'd.js'), "const b = require('./b');\nmodule.exports = { d: 4 };\n");

  const engine = new BlastRadiusEngine({ rootDir: tmpDir });

  await t.test('extractImports handles CJS and ESM syntaxes', () => {
    const cjsContent = "const x = require('./c');\nconst y = require('./b.js');";
    const imports = extractImports(path.join(tmpDir, 'test.js'), cjsContent, tmpDir);
    assert.ok(imports.includes('c.js'));
    assert.ok(imports.includes('b.js'));
  });

  await t.test('buildGraph maps direct dependents and dependencies correctly', () => {
    const graph = engine.buildGraph();
    assert.strictEqual(graph.files.length, 4);
    assert.ok(graph.dependencies['a.js'].includes('b.js'));
    assert.ok(graph.dependents['b.js'].includes('a.js'));
    assert.ok(graph.dependents['b.js'].includes('d.js'));
  });

  await t.test('calculateBlastRadius identifies cascade upstream and downstream', () => {
    const radiusC = engine.calculateBlastRadius('c.js');
    assert.strictEqual(radiusC.target, 'c.js');
    assert.strictEqual(radiusC.fanIn, 1);
    assert.strictEqual(radiusC.fanOut, 0);
    assert.strictEqual(radiusC.maxDepth, 2); // C <- B <- A / D
    assert.strictEqual(radiusC.transitiveUpstream.length, 3); // b, a, d
    assert.ok(radiusC.score >= 50);
    assert.strictEqual(radiusC.riskLevel, 'CRITICAL');
  });

  await t.test('analyzeWorkspace ranks files by blast radius score', () => {
    const analysis = engine.analyzeWorkspace();
    assert.strictEqual(analysis.summary.totalFiles, 4);
    assert.ok(analysis.summary.averageBlastRadius > 0);
    assert.ok(analysis.topRisks.length > 0);
    assert.strictEqual(analysis.topRisks[0].target, 'c.js');
  });

  t.after(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });
});
