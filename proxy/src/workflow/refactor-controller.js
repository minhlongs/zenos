// proxy/src/workflow/refactor-controller.js - AST-Guided Refactor Controller
const fs = require('node:fs');
const path = require('node:path');
const { ConsensusGate } = require('./consensus-gate.js');
const { CookRunner } = require('./cook-runner.js');
const { validateFiles } = require('./loc-guard.js');

const gate = new ConsensusGate();

function extractDeclarations(source) {
  const lines = source.split('\n');
  const decls = [];
  let currentDecl = null;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^\s*(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([a-zA-Z0-9_]+)/);

    if (match && braceDepth === 0) {
      if (currentDecl) decls.push(currentDecl);
      currentDecl = { name: match[1], startLine: i, endLine: i, lines: [line] };
    } else if (currentDecl) {
      currentDecl.endLine = i;
      currentDecl.lines.push(line);
    }

    braceDepth += (line.match(/\{/g) || []).length;
    braceDepth -= (line.match(/\}/g) || []).length;

    if (braceDepth === 0 && currentDecl && i > currentDecl.startLine) {
      decls.push(currentDecl);
      currentDecl = null;
    }
  }
  if (currentDecl) decls.push(currentDecl);

  const exportsLine = lines.find(l => l.startsWith('module.exports'));
  const exported = exportsLine ? exportsLine.match(/([a-zA-Z0-9_]+)/g) : [];
  return { decls, exports: exported || [] };
}

function generateSlicePlan(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = extractDeclarations(content);
  if (parsed.decls.length < 2) throw new Error('Cannot slice file with fewer than 2 distinct declarations');

  const parsedPath = path.parse(filePath);
  const baseName = parsedPath.name;

  const mid = Math.ceil(parsed.decls.length / 2);
  const part1 = parsed.decls.slice(0, mid);
  const part2 = parsed.decls.slice(mid);

  const subMod1Name = `${baseName}-core`;
  const subMod2Name = `${baseName}-utils`;

  const imports1 = part1.map(d => d.name).join(', ');
  const imports2 = part2.map(d => d.name).join(', ');

  const file1 = {
    relativePath: path.join(parsedPath.dir, `${subMod1Name}.js`),
    content: part1.flatMap(d => d.lines).join('\n') + `\nmodule.exports = { ${imports1} };\n`,
    symbolsExported: part1.map(d => d.name)
  };

  const file2 = {
    relativePath: path.join(parsedPath.dir, `${subMod2Name}.js`),
    content: part2.flatMap(d => d.lines).join('\n') + `\nmodule.exports = { ${imports2} };\n`,
    symbolsExported: part2.map(d => d.name)
  };

  const barrelFacade = {
    relativePath: filePath,
    content: `const sub1 = require('./${subMod1Name}.js');\nconst sub2 = require('./${subMod2Name}.js');\nmodule.exports = { ...sub1, ...sub2 };\n`
  };

  return { targetFile: filePath, newFiles: [file1, file2], barrelFacade, estimatedLocs: [file1.content.split('\n').length, file2.content.split('\n').length] };
}

async function applyPlan(plan, options = {}) {
  const backupPath = `${plan.targetFile}.backup`;
  fs.copyFileSync(plan.targetFile, backupPath);

  try {
    for (const f of plan.newFiles) {
      fs.writeFileSync(f.relativePath, f.content, 'utf-8');
    }
    fs.writeFileSync(plan.barrelFacade.relativePath, plan.barrelFacade.content, 'utf-8');

    const testCommand = options.testCommand || `node --test ${plan.targetFile.replace('src/', 'tests/').replace('.js', '.test.js')}`;
    const cookRunner = new CookRunner({ maxIterations: 1 });
    const runResult = await cookRunner.runCycle({ maxLoops: 1, testCommand });

    const filesToValidate = [plan.targetFile, ...plan.newFiles.map(f => f.relativePath)];
    let auditorResult = { approved: true, reason: 'All <= 200 LOC' };
    try {
      validateFiles(filesToValidate);
    } catch (e) {
      auditorResult = { approved: false, reason: e.message };
    }

    const consensus = gate.evaluate({
      verifierResult: {
        passed: runResult.success === true,
        reason: runResult.error || 'Tests Passed'
      },
      auditorResult
    });

    if (consensus.status !== 'APPROVED') {
      throw new Error(`Consensus failed: ${consensus.reason}`);
    }

    fs.unlinkSync(backupPath);
    return { success: true, plan, consensus };

  } catch (error) {
    fs.copyFileSync(backupPath, plan.targetFile);
    fs.unlinkSync(backupPath);
    for (const f of plan.newFiles) {
      if (fs.existsSync(f.relativePath)) fs.unlinkSync(f.relativePath);
    }
    return { success: false, error: error.message };
  }
}

module.exports = { extractDeclarations, generateSlicePlan, applyPlan };