'use strict';

const crypto = require('node:crypto');

const COMPLEXITY_HIGH_KEYWORDS = [
  'architecture', 'refactor', 'distributed', 'security', 'database',
  'migration', 'consensus', 'concurrency', 'e2e', 'multi-file', 'protocol'
];

const COMPLEXITY_MODERATE_KEYWORDS = [
  'endpoint', 'service', 'validation', 'crud', 'route', 'integration', 'cache'
];

class ZenDirector {
  constructor(options = {}) {
    this.localModel = options.localModel || 'qwen2.5-coder-14b';
    this.cloudModel = options.cloudModel || 'claude-3-5-sonnet-20241022';
    this.localThreshold = options.localThreshold || 3;
  }

  evaluateComplexity(prompt, context = {}) {
    if (!prompt || typeof prompt !== 'string') {
      return { score: 1, rationale: 'Empty prompt defaults to minimal complexity', route: 'local', model: this.localModel };
    }

    const lower = prompt.toLowerCase();
    let score = 1;
    const reasons = [];

    // Factor 1: Length and detail of prompt
    if (lower.length > 500) {
      score += 1;
      reasons.push('Extensive prompt specification');
    }

    // Factor 2: High complexity keywords
    const highMatches = COMPLEXITY_HIGH_KEYWORDS.filter(k => lower.includes(k));
    if (highMatches.length > 0) {
      score += Math.min(highMatches.length, 3);
      reasons.push(`Contains architectural keywords: ${highMatches.join(', ')}`);
    }

    // Factor 3: Moderate keywords
    const modMatches = COMPLEXITY_MODERATE_KEYWORDS.filter(k => lower.includes(k));
    if (modMatches.length > 0 && score < 3) {
      score += 1;
      reasons.push(`Contains service-level keywords: ${modMatches.join(', ')}`);
    }

    // Factor 4: Explicit context files or flags
    if (context.files && Array.isArray(context.files) && context.files.length > 3) {
      score += 1;
      reasons.push(`Touches ${context.files.length} multiple files`);
    }

    // Clamp score to [1, 5]
    score = Math.max(1, Math.min(score, 5));
    const route = score <= this.localThreshold ? 'local' : 'cloud';
    const model = route === 'local' ? this.localModel : this.cloudModel;

    return {
      score,
      rationale: reasons.length ? reasons.join('; ') : 'Localized single-scope change',
      route,
      model
    };
  }

  planExecution(prompt, context = {}) {
    const complexity = this.evaluateComplexity(prompt, context);
    const planId = `zen_plan_${crypto.randomUUID()}`;

    // Derive suggested target names from prompt or context
    const fileHint = context.fileHint || 'module';
    const cleanHint = fileHint.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();

    return {
      id: planId,
      prompt,
      complexity,
      strategy: 'TDD_STRICT',
      phases: [
        {
          name: 'RED',
          goal: 'Create failing unit tests verifying the specification',
          action: 'write_tests',
          targetFile: context.testFile || `tests/${cleanHint}.test.js`
        },
        {
          name: 'GREEN',
          goal: 'Implement minimal production code satisfying the tests',
          action: 'write_code',
          targetFile: context.sourceFile || `src/${cleanHint}.js`
        },
        {
          name: 'REFACTOR',
          goal: 'Inspect LOC limit (< 200 LOC), style, and code quality',
          action: 'verify_invariants',
          maxLoc: 200
        }
      ],
      suggestedTestFiles: [context.testFile || `tests/${cleanHint}.test.js`],
      suggestedSourceFiles: [context.sourceFile || `src/${cleanHint}.js`],
      acceptanceCriteria: [
        '100% green test pass rate',
        'All touched files strictly under 200 LOC',
        'Zero regressions in existing test suite'
      ],
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = { ZenDirector, COMPLEXITY_HIGH_KEYWORDS };
