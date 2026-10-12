// proxy/src/workflow/complexity-engine.js - Pure Node.js Code Complexity Engine
const fs = require('node:fs');
const path = require('node:path');

const IGNORED_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'coverage', '.cache']);
const SUPPORTED_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, (match) => '\n'.repeat(match.split('\n').length - 1))
               .replace(/\/\/.*$/gm, '');
}

function countLines(source) {
  const lines = source.split('\n');
  let blank = 0, comment = 0, code = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { blank++; continue; }
    if (inBlockComment) {
      comment++;
      if (trimmed.includes('*/')) inBlockComment = false;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      comment++;
      if (!trimmed.includes('*/')) inBlockComment = true;
      continue;
    }
    if (trimmed.startsWith('//')) { comment++; continue; }
    code++;
  }
  return { totalLines: lines.length, codeLines: code, commentLines: comment, blankLines: blank };
}

function countBranching(source) {
  const clean = stripComments(source);
  const keywords = /\b(if|else\s+if|switch|case|for|while|catch|do)\b/g;
  const kwMatches = (clean.match(keywords) || []).length;
  const logicalMatches = (clean.match(/(&&|\|\||\?\?)/g) || []).length;
  const ternaryMatches = (clean.match(/\s+\?\s+/g) || []).length;
  const iterators = (clean.match(/\.(map|filter|reduce|forEach)\s*\(/g) || []).length;
  return kwMatches + logicalMatches + ternaryMatches + iterators;
}

function extractCoupling(source) {
  const clean = stripComments(source);
  const imports = new Set();
  const importRegex = /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
  let match;
  while ((match = importRegex.exec(clean)) !== null) {
    imports.add(match[1] || match[2]);
  }
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(clean)) !== null) {
    imports.add(match[1]);
  }
  const exportMatches = clean.match(/\b(export\s+default|export\s+(?:const|let|var|function|class)|module\.exports|exports\.)\b/g) || [];
  return { fanOut: imports.size, imports: Array.from(imports), exportsCount: exportMatches.length };
}

function calculateMonolithScore({ totalLines, branchingCount, fanOut }) {
  const lineScore = (Math.min(totalLines, 500) / 200) * 40;
  const branchScore = (Math.min(branchingCount, 50) / 15) * 40;
  const couplingScore = (Math.min(fanOut, 20) / 10) * 20;
  const rawScore = Math.min(100, Math.round(lineScore + branchScore + couplingScore));

  let riskLevel = 'LOW';
  if (rawScore >= 75 || totalLines >= 250) riskLevel = 'CRITICAL';
  else if (rawScore >= 50 || totalLines >= 200) riskLevel = 'HIGH';
  else if (rawScore >= 25) riskLevel = 'MODERATE';

  return { monolithScore: rawScore, riskLevel };
}

function analyzeFile(filePath) {
  const resolved = path.resolve(filePath);
  const content = fs.readFileSync(resolved, 'utf-8');
  const lineInfo = countLines(content);
  const branchingCount = countBranching(content);
  const branchingDensity = lineInfo.codeLines > 0 ? Number((branchingCount / lineInfo.codeLines).toFixed(2)) : 0;
  const coupling = extractCoupling(content);
  const { monolithScore, riskLevel } = calculateMonolithScore({
    totalLines: lineInfo.totalLines,
    branchingCount,
    fanOut: coupling.fanOut,
  });

  return {
    filePath: resolved,
    fileName: path.basename(resolved),
    ...lineInfo,
    branchingCount,
    branchingDensity,
    fanOut: coupling.fanOut,
    imports: coupling.imports,
    exportsCount: coupling.exportsCount,
    monolithScore,
    riskLevel,
  };
}

function analyzeDirectory(dirPath, options = {}) {
  const resolvedDir = path.resolve(dirPath);
  const results = [];

  function walk(current) {
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.claude') continue;
      if (IGNORED_DIRS.has(entry.name)) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && SUPPORTED_EXTS.has(path.extname(entry.name))) {
        try { results.push(analyzeFile(fullPath)); } catch {}
      }
    }
  }

  walk(resolvedDir);
  results.sort((a, b) => b.monolithScore - a.monolithScore);

  const totalFiles = results.length;
  const totalLines = results.reduce((acc, f) => acc + f.totalLines, 0);
  const totalComplexity = results.reduce((acc, f) => acc + f.branchingCount, 0);
  const highRiskFiles = results.filter((f) => f.riskLevel === 'HIGH' || f.riskLevel === 'CRITICAL');
  const compliantFiles = results.filter((f) => f.totalLines < 200).length;
  const healthScore = totalFiles > 0 ? Number(((compliantFiles / totalFiles) * 100).toFixed(1)) : 100;

  return {
    files: results,
    summary: {
      totalFiles,
      totalLines,
      averageComplexity: totalFiles > 0 ? Number((totalComplexity / totalFiles).toFixed(1)) : 0,
      highRiskFilesCount: highRiskFiles.length,
      workspaceHealthScore: healthScore,
    },
  };
}

module.exports = {
  stripComments,
  countLines,
  countBranching,
  extractCoupling,
  calculateMonolithScore,
  analyzeFile,
  analyzeDirectory,
};
