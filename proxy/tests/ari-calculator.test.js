'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { AriCalculator } = require('../src/workflow/ari-calculator');

test('AriCalculator computes quantitative Architectural Risk Index correctly', async (t) => {
  const calc = new AriCalculator();

  await t.test('calculates base risk score for low-impact strategy', () => {
    const result = calc.calculateRisk({
      blastRadius: 15,
      complexity: 8,
      invariantRisk: 10,
      churnProbability: 5
    });

    assert.equal(typeof result.score, 'number');
    assert.equal(result.tier, 'SAFE');
    assert.equal(result.score < 30, true);
    assert.equal(typeof result.breakdown, 'object');
  });

  await t.test('assigns CAUTION tier for moderate complexity and blast radius', () => {
    const result = calc.calculateRisk({
      blastRadius: 40,
      complexity: 25,
      invariantRisk: 30,
      churnProbability: 20
    });

    assert.equal(result.tier, 'CAUTION');
    assert.equal(result.score >= 30 && result.score < 60, true);
  });

  await t.test('assigns CRITICAL tier for high blast radius and high complexity', () => {
    const result = calc.calculateRisk({
      blastRadius: 85,
      complexity: 65,
      invariantRisk: 70,
      churnProbability: 80
    });

    assert.equal(result.tier, 'CRITICAL');
    assert.equal(result.score >= 60, true);
    assert.equal(result.score <= 100, true);
  });

  await t.test('compares multiple strategies and ranks by Pareto optimality', () => {
    const strategies = [
      { id: 'strat_1', name: 'Monolith Slice', blastRadius: 18, complexity: 12, invariantRisk: 15, churnProbability: 10 },
      { id: 'strat_2', name: 'Micro-Adapter', blastRadius: 55, complexity: 35, invariantRisk: 40, churnProbability: 30 },
      { id: 'strat_3', name: 'Full Rewrite', blastRadius: 90, complexity: 80, invariantRisk: 85, churnProbability: 75 }
    ];

    const ranked = calc.rankStrategies(strategies);
    assert.equal(ranked.length, 3);
    assert.equal(ranked[0].id, 'strat_1');
    assert.equal(ranked[0].tier, 'SAFE');
    assert.equal(ranked[0].isRecommended, true);
    assert.equal(ranked[2].id, 'strat_3');
    assert.equal(ranked[2].tier, 'CRITICAL');
  });
});
