'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { analyzeFile, analyzeDirectory, stripComments } = require('./complexity-engine');
const { BlastRadiusEngine } = require('./blast-radius-engine');

function extractSeamNames(source, relPath) {
  const clean = stripComments(source || '');
  const seams = new Set();
  const fnRegex = /\b(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(|class\s+([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = fnRegex.exec(clean)) !== null) {
    seams.add(match[1] || match[2]);
  }
  const methodRegex = /^\s{2,4}(?:async\s+)?([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/gm;
  const reserved = new Set(['if', 'for', 'while', 'switch', 'catch', 'constructor']);
  while ((match = methodRegex.exec(clean)) !== null) {
    if (!reserved.has(match[1])) seams.add(match[1]);
  }
  if (seams.size === 0) {
    const base = path.basename(relPath || 'module', path.extname(relPath || '.js'));
    return [`${base}-core`, `${base}-handlers`, `${base}-validators`];
  }
  return Array.from(seams).slice(0, 8);
}

class DeepCodeInspector {
  constructor(options = {}) {
    this.rootDir = path.resolve(options.rootDir || process.cwd());
    this.blastEngine = options.blastEngine || new BlastRadiusEngine({ rootDir: this.rootDir });
  }

  inspectFile(targetFile = 'proxy/src/router.js', cachedGraph = null) {
    const normalizedInput = String(targetFile || 'proxy/src/router.js').trim();
    const absPath = path.isAbsolute(normalizedInput)
      ? normalizedInput
      : path.resolve(this.rootDir, normalizedInput);
    const inWorkspace = absPath === this.rootDir || absPath.startsWith(this.rootDir + path.sep);
    const relPath = inWorkspace ? (path.relative(this.rootDir, absPath) || normalizedInput) : normalizedInput;
    const exists = inWorkspace && fs.existsSync(absPath) && fs.statSync(absPath).isFile();

    let comp = {
      totalLines: 140, codeLines: 115, branchingCount: 14, branchingDensity: 0.12,
      fanOut: 3, exportsCount: 2, monolithScore: 48, riskLevel: 'MODERATE',
    };
    let blast = {
      score: 24, riskLevel: 'CAUTION', fanIn: 2, fanOut: 3,
      maxDepth: 2, hasCycle: false, transitiveUpstream: [], transitiveDownstream: [],
    };
    let detectedSeams = [];

    if (exists) {
      comp = analyzeFile(absPath);
      blast = this.blastEngine.calculateBlastRadius(relPath, cachedGraph);
      detectedSeams = extractSeamNames(fs.readFileSync(absPath, 'utf-8'), relPath);
    } else {
      detectedSeams = extractSeamNames('', relPath);
    }

    const combinedMetrics = {
      totalLines: comp.totalLines, codeLines: comp.codeLines,
      branchingCount: comp.branchingCount, branchingDensity: comp.branchingDensity,
      fanIn: blast.fanIn, fanOut: Math.max(comp.fanOut || 0, blast.fanOut || 0),
      maxDepth: blast.maxDepth, hasCycle: Boolean(blast.hasCycle),
      exportsCount: comp.exportsCount, detectedSeams,
    };

    const splitBlueprint = this.proposeSeams(relPath, combinedMetrics);
    const highestRisk =
      comp.riskLevel === 'CRITICAL' || blast.riskLevel === 'CRITICAL'
        ? 'CRITICAL'
        : comp.riskLevel === 'HIGH' || blast.riskLevel === 'CAUTION'
          ? 'HIGH'
          : comp.riskLevel;

    return {
      targetFile: relPath,
      exists,
      ...combinedMetrics,
      transitiveUpstream: blast.transitiveUpstream || [],
      transitiveDownstream: blast.transitiveDownstream || [],
      monolithScore: comp.monolithScore,
      blastRadiusScore: blast.score,
      riskLevel: highestRisk,
      splitBlueprint,
    };
  }

  proposeSeams(targetFile, metrics = {}) {
    const ext = path.extname(targetFile) || '.js';
    const dir = path.dirname(targetFile);
    const base = path.basename(targetFile, ext);
    const totalLines = Math.max(60, Number(metrics.totalLines) || 140);
    const sliceCount = totalLines >= 220 ? 3 : 2;
    const perSliceLoc = Math.min(110, Math.max(35, Math.round((totalLines * 0.78) / sliceCount)));
    const seams = Array.isArray(metrics.detectedSeams) && metrics.detectedSeams.length > 0
      ? metrics.detectedSeams
      : [`${base}Core`, `${base}Handlers`, `${base}Policy`];

    const suffixes = ['core', 'handlers', 'policy'];
    const responsibilities = [
      `Core domain state & pure logic (${seams.slice(0, 2).join(', ') || 'primary operations'})`,
      `I/O orchestration, routing & boundary handlers (${seams.slice(2, 4).join(', ') || 'dispatchers'})`,
      `Validation invariants, schemas & error guards (${seams.slice(4, 6).join(', ') || 'safety guards'})`,
    ];

    const extractedSubmodules = [];
    for (let i = 0; i < sliceCount; i++) {
      const subName = `${base}-${suffixes[i]}${ext}`;
      extractedSubmodules.push({
        path: dir && dir !== '.' ? `${dir}/${subName}` : subName,
        estimatedLoc: perSliceLoc,
        responsibility: responsibilities[i],
      });
    }

    return {
      originalFile: targetFile,
      facadePath: targetFile,
      facadeEstimatedLoc: Math.min(55, Math.max(20, Math.round(totalLines * 0.22))),
      extractedSubmodules,
    };
  }

  discoverHotspots(limit = 5, scanDir = null) {
    const targetDir = scanDir ? path.resolve(this.rootDir, scanDir) : this.rootDir;
    const dirReport = analyzeDirectory(targetDir);
    const graph = this.blastEngine.buildGraph(targetDir);

    const ranked = dirReport.files.map((fileInfo) => {
      const relPath = path.relative(this.rootDir, fileInfo.filePath);
      const inspected = this.inspectFile(relPath, graph);
      const compositeScore = Math.round(inspected.monolithScore * 0.65 + inspected.blastRadiusScore * 0.35);
      return { ...inspected, compositeScore };
    });

    ranked.sort((a, b) => b.compositeScore - a.compositeScore || b.totalLines - a.totalLines);
    return ranked.slice(0, Math.max(1, limit));
  }
}

module.exports = { DeepCodeInspector, extractSeamNames };
