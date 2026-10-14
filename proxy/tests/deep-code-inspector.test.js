'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { DeepCodeInspector } = require('../src/workflow/deep-code-inspector');
const { getDashboardHtml } = require('../src/dashboard-html');
const { getDashboardClientScript } = require('../src/dashboard-client-script');

const REPO_ROOT = path.resolve(__dirname, '../..');
const PROXY_SRC = path.resolve(__dirname, '../src');

describe('Gate 15 Phase 1: DeepCodeInspector & Dashboard Slicing', () => {
  it('inspects a real file in proxy/src and extracts complexity + blast radius + seams', () => {
    const inspector = new DeepCodeInspector({ rootDir: REPO_ROOT });
    const report = inspector.inspectFile('proxy/src/workflow/complexity-engine.js');

    assert.equal(report.exists, true);
    assert.equal(report.targetFile, 'proxy/src/workflow/complexity-engine.js');
    assert.ok(report.totalLines > 50, 'should report real line count');
    assert.ok(report.branchingCount >= 5, 'should report real branching count');
    assert.ok(report.fanIn >= 1, 'should detect upstream callers');
    assert.ok(Array.isArray(report.detectedSeams) && report.detectedSeams.length > 0);
    assert.ok(report.detectedSeams.includes('analyzeFile'));
    assert.ok(report.splitBlueprint);
    assert.ok(report.splitBlueprint.extractedSubmodules.length >= 2);
  });

  it('gracefully handles synthetic / non-existent file paths with fallback metrics', () => {
    const inspector = new DeepCodeInspector({ rootDir: REPO_ROOT });
    const report = inspector.inspectFile('proxy/src/synthetic-non-existent-module.js');

    assert.equal(report.exists, false);
    assert.equal(report.targetFile, 'proxy/src/synthetic-non-existent-module.js');
    assert.ok(report.totalLines > 0);
    assert.ok(report.splitBlueprint.extractedSubmodules.every((m) => m.estimatedLoc < 120));
  });

  it('proposeSeams guarantees every extracted submodule is strictly < 120 LOC', () => {
    const inspector = new DeepCodeInspector({ rootDir: REPO_ROOT });
    const blueprint = inspector.proposeSeams('proxy/src/workflow/monolith-engine.js', {
      totalLines: 280,
      detectedSeams: ['parseAst', 'computeGraph', 'validateSeams', 'emitEvents'],
    });

    assert.equal(blueprint.originalFile, 'proxy/src/workflow/monolith-engine.js');
    assert.equal(blueprint.extractedSubmodules.length, 3);
    for (const sub of blueprint.extractedSubmodules) {
      assert.ok(sub.estimatedLoc < 120, `Submodule ${sub.path} must be < 120 LOC`);
      assert.ok(sub.path.startsWith('proxy/src/workflow/monolith-engine-'));
      assert.ok(sub.responsibility.length > 10);
    }
  });

  it('discoverHotspots scans proxy/src and returns ranked hotspot summaries', () => {
    const inspector = new DeepCodeInspector({ rootDir: REPO_ROOT });
    const hotspots = inspector.discoverHotspots(4, PROXY_SRC);

    assert.equal(hotspots.length, 4);
    assert.ok(hotspots[0].compositeScore >= hotspots[1].compositeScore);
    assert.ok(hotspots[0].splitBlueprint.extractedSubmodules.length >= 2);
  });

  it('preserves 100% of dashboard HTML DOM IDs and client script after modular slicing', () => {
    const html = getDashboardHtml();
    const script = getDashboardClientScript();

    assert.ok(script.includes("EventSource('/v1/telemetry/events')"));
    assert.ok(html.includes(script));
    for (const id of [
      'active-jails',
      'total-req',
      'active-req',
      'latency-stats',
      'error-rate',
      'approvals-tbody',
      'events-log',
    ]) {
      assert.ok(html.includes(`id="${id}"`), `Missing DOM ID #${id}`);
    }
  });
});
