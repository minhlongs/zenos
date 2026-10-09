'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ZenDirector } = require('../src/workflow/zen-director');

test('zen-director: evaluates low complexity for simple prompt', () => {
  const director = new ZenDirector();
  const res = director.evaluateComplexity('fix typo in docs');
  assert.equal(res.score, 1);
  assert.equal(res.route, 'local');
  assert.equal(res.model, 'qwen2.5-coder-14b');
});

test('zen-director: evaluates moderate complexity for single endpoint', () => {
  const director = new ZenDirector();
  const res = director.evaluateComplexity('add user validation crud endpoint');
  assert.ok(res.score >= 2 && res.score <= 3);
  assert.equal(res.route, 'local');
});

test('zen-director: evaluates high complexity for architectural refactor', () => {
  const director = new ZenDirector();
  const res = director.evaluateComplexity(
    'Redesign distributed architecture with database migration, security protocol, and multi-file refactor'
  );
  assert.ok(res.score >= 4);
  assert.equal(res.route, 'cloud');
  assert.equal(res.model, 'claude-3-5-sonnet-20241022');
  assert.ok(res.rationale.includes('architectural keywords'));
});

test('zen-director: generates structured TDD execution plan', () => {
  const director = new ZenDirector();
  const plan = director.planExecution('Implement JSON tokenizer', {
    fileHint: 'tokenizer',
    testFile: 'tests/tokenizer.test.js',
    sourceFile: 'src/tokenizer.js'
  });

  assert.ok(plan.id.startsWith('zen_plan_'));
  assert.equal(plan.strategy, 'TDD_STRICT');
  assert.equal(plan.phases.length, 3);
  assert.equal(plan.phases[0].name, 'RED');
  assert.equal(plan.phases[1].name, 'GREEN');
  assert.equal(plan.phases[2].name, 'REFACTOR');
  assert.deepEqual(plan.suggestedTestFiles, ['tests/tokenizer.test.js']);
  assert.deepEqual(plan.suggestedSourceFiles, ['src/tokenizer.js']);
  assert.ok(plan.acceptanceCriteria.length >= 3);
});

test('zen-director: handles empty or invalid inputs gracefully', () => {
  const director = new ZenDirector();
  const resNull = director.evaluateComplexity(null);
  assert.equal(resNull.score, 1);
  assert.equal(resNull.route, 'local');
});
