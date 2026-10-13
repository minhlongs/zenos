// proxy/src/workflow/blast-radius-engine.js - Dependency Cartography & Blast Radius Engine
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const IGNORED_DIRS = new Set(['node_modules', '.git', '.next', '.zenos', 'dist', 'build', 'coverage']);
const CODE_EXTS = new Set(['.js', '.ts', '.tsx', '.mjs', '.cjs']);

function resolveImportPath(importerPath, importStr, rootDir) {
  if (!importStr.startsWith('.')) return null;
  const dir = path.dirname(importerPath);
  const resolvedBase = path.resolve(dir, importStr);

  for (const ext of ['', '.js', '.ts', '.tsx', '/index.js', '/index.ts']) {
    const candidate = path.normalize(resolvedBase + ext);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.relative(rootDir, candidate);
    }
  }
  return path.relative(rootDir, resolvedBase);
}

function extractImports(filePath, content, rootDir) {
  const imports = new Set();
  const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  while ((match = cjsRegex.exec(content)) !== null) {
    const resolved = resolveImportPath(filePath, match[1], rootDir);
    if (resolved) imports.add(resolved);
  }

  const esmRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g;
  while ((match = esmRegex.exec(content)) !== null) {
    const resolved = resolveImportPath(filePath, match[1], rootDir);
    if (resolved) imports.add(resolved);
  }
  return Array.from(imports);
}

class BlastRadiusEngine {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  buildGraph(targetDir = this.rootDir) {
    const files = [];
    const scan = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') && entry.name !== '.zenos') continue;
        if (entry.isDirectory()) {
          if (!IGNORED_DIRS.has(entry.name)) scan(path.join(dir, entry.name));
        } else if (CODE_EXTS.has(path.extname(entry.name))) {
          files.push(path.join(dir, entry.name));
        }
      }
    };
    scan(targetDir);

    const dependencies = {};
    const dependents = {};
    for (const file of files) {
      const rel = path.relative(this.rootDir, file);
      dependencies[rel] = [];
      if (!dependents[rel]) dependents[rel] = [];
    }

    for (const file of files) {
      const rel = path.relative(this.rootDir, file);
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const fileImports = extractImports(file, content, this.rootDir);
        dependencies[rel] = fileImports;
        for (const imp of fileImports) {
          if (!dependents[imp]) dependents[imp] = [];
          if (!dependents[imp].includes(rel)) dependents[imp].push(rel);
        }
      } catch {
        // Skip unreadable files
      }
    }
    return { dependencies, dependents, files: Object.keys(dependencies) };
  }

  calculateBlastRadius(targetPath, graph = null) {
    const activeGraph = graph || this.buildGraph();
    const normalizedTarget = path.isAbsolute(targetPath)
      ? path.relative(this.rootDir, targetPath)
      : targetPath;

    const directDependents = activeGraph.dependents[normalizedTarget] || [];
    const directDependencies = activeGraph.dependencies[normalizedTarget] || [];

    const upstream = new Set();
    const queue = [[normalizedTarget, 0]];
    const visited = new Set([normalizedTarget]);
    let maxDepth = 0;
    let hasCycle = false;

    while (queue.length > 0) {
      const [curr, depth] = queue.shift();
      const callers = activeGraph.dependents[curr] || [];
      for (const caller of callers) {
        if (caller === normalizedTarget) hasCycle = true;
        if (!visited.has(caller)) {
          visited.add(caller);
          upstream.add(caller);
          const nextDepth = depth + 1;
          if (nextDepth > maxDepth) maxDepth = nextDepth;
          queue.push([caller, nextDepth]);
        }
      }
    }

    const downstream = new Set();
    const downQueue = [normalizedTarget];
    const downVisited = new Set([normalizedTarget]);
    while (downQueue.length > 0) {
      const curr = downQueue.shift();
      const callees = activeGraph.dependencies[curr] || [];
      for (const callee of callees) {
        if (!downVisited.has(callee)) {
          downVisited.add(callee);
          downstream.add(callee);
          downQueue.push(callee);
        }
      }
    }

    const fanIn = directDependents.length;
    const fanOut = directDependencies.length;
    const couplingFactor = fanOut > 0 ? (fanIn + 1) / fanOut : fanIn + 1;
    const rawScore = (maxDepth * 12) + (fanIn * 8) + (upstream.size * 5) + Math.min(20, Math.round(couplingFactor * 5));
    const score = Math.min(100, Math.max(0, rawScore));

    let riskLevel = 'SAFE';
    if (score >= 50 || upstream.size >= 8 || maxDepth >= 4) riskLevel = 'CRITICAL';
    else if (score >= 20 || upstream.size >= 3 || maxDepth >= 2) riskLevel = 'CAUTION';

    return {
      target: normalizedTarget,
      score,
      riskLevel,
      fanIn,
      fanOut,
      maxDepth,
      hasCycle,
      directDependents,
      directDependencies,
      transitiveUpstream: Array.from(upstream),
      transitiveDownstream: Array.from(downstream)
    };
  }

  analyzeWorkspace(targetDir = this.rootDir) {
    const graph = this.buildGraph(targetDir);
    const results = graph.files.map((file) => this.calculateBlastRadius(file, graph));
    results.sort((a, b) => b.score - a.score);

    const totalFiles = results.length;
    const criticalCount = results.filter((r) => r.riskLevel === 'CRITICAL').length;
    const cautionCount = results.filter((r) => r.riskLevel === 'CAUTION').length;
    const safeCount = results.filter((r) => r.riskLevel === 'SAFE').length;
    const avgScore = totalFiles > 0
      ? Math.round((results.reduce((acc, r) => acc + r.score, 0) / totalFiles) * 10) / 10
      : 0;

    return {
      summary: { totalFiles, criticalCount, cautionCount, safeCount, averageBlastRadius: avgScore },
      topRisks: results.slice(0, 10),
      all: results
    };
  }
}

module.exports = { BlastRadiusEngine, extractImports, resolveImportPath };
