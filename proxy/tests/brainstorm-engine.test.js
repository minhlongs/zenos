'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { DebateProtocol } = require('../src/workflow/debate-protocol');
const { BrainstormEngine } = require('../src/workflow/brainstorm-engine');

test('DebateProtocol generates structured Socratic turns (Standard & Deep)', async (t) => {
  const protocol = new DebateProtocol();

  await t.test('generates Advocate argument', () => {
    const turn = protocol.generateAdvocateTurn('Refactor routes-factory monolith');
    assert.equal(turn.persona, 'ADVOCATE');
    assert.equal(typeof turn.argument, 'string');
    assert.equal(turn.argument.length > 10, true);
  });

  await t.test('generates Adversary critique addressing invariants and blast radius', () => {
    const turn = protocol.generateAdversaryTurn('Refactor routes-factory monolith', { blastRadius: 45 });
    assert.equal(turn.persona, 'ADVERSARY');
    assert.equal(typeof turn.argument, 'string');
    assert.equal(turn.riskIdentified, true);
  });

  await t.test('generates Cross-Examiner and Rebuttal turns for --deep mode', () => {
    const crossTurn = protocol.generateCrossExaminerTurn('Refactor routes-factory monolith', { detectedSeams: 3 });
    assert.equal(crossTurn.persona, 'CROSS_EXAMINER');
    assert.equal(Array.isArray(crossTurn.socraticQuestions), true);
    assert.equal(crossTurn.socraticQuestions.length >= 2, true);

    const rebTurn = protocol.generateRebuttalTurn('Refactor routes-factory monolith', { targetFile: 'src/router.js' });
    assert.equal(rebTurn.persona, 'REBUTTAL');
    assert.equal(rebTurn.riskIdentified, false);
  });

  await t.test('generates Synthesizer consensus and Pareto proposals', () => {
    const turn = protocol.generateSynthesizerTurn('Refactor routes-factory monolith', [
      { persona: 'ADVOCATE', argument: 'Decouple into sub-routers' },
      { persona: 'ADVERSARY', argument: 'Watch out for breaking SSE stream' }
    ]);
    assert.equal(turn.persona, 'SYNTHESIZER');
    assert.equal(Array.isArray(turn.candidateStrategies), true);
    assert.equal(turn.candidateStrategies.length >= 3, true);
  });
});

test('BrainstormEngine orchestrates full brainstorming session', async (t) => {
  const engine = new BrainstormEngine();

  await t.test('runs standard 3-turn brainstorming session emitting events', async () => {
    const events = [];
    engine.on('debate_turn', (e) => events.push(e));

    const session = await engine.startSession({
      topic: 'Decompose monolithic router',
      targetFile: 'src/workflow/routes-factory.js',
      context: { blastRadius: 35, complexity: 22 }
    });

    assert.equal(typeof session.id, 'string');
    assert.equal(session.deep, false);
    assert.equal(session.turns.length, 3); // Advocate, Adversary, Synthesizer
    assert.equal(Array.isArray(session.strategies), true);
    assert.equal(session.strategies.length >= 2, true);
    assert.equal(session.recommendedStrategy !== null, true);
    assert.equal(events.length, 3);
  });

  await t.test('runs 5-turn --deep Socratic session with live telemetry and splitBlueprint', async () => {
    const session = await engine.startSession({
      topic: 'Deep Modularization of complexity-engine',
      targetFile: 'src/workflow/complexity-engine.js',
      deep: true
    });

    assert.equal(session.deep, true);
    assert.equal(session.turns.length, 5);
    assert.deepEqual(
      session.turns.map((turn) => turn.persona),
      ['ADVOCATE', 'ADVERSARY', 'CROSS_EXAMINER', 'REBUTTAL', 'SYNTHESIZER']
    );
    assert.equal(typeof session.telemetry, 'object');
    assert.equal(session.telemetry.totalLines > 0, true);
    assert.equal(typeof session.splitBlueprint, 'object');
    assert.equal(Array.isArray(session.splitBlueprint.extractedSubmodules), true);
  });

  await t.test('autoBrainstormHotspots discovers top workspace hotspots and runs --deep sessions', async () => {
    const sessions = await engine.autoBrainstormHotspots(2);
    assert.equal(Array.isArray(sessions), true);
    assert.equal(sessions.length, 2);
    assert.equal(sessions[0].deep, true);
    assert.equal(sessions[0].turns.length, 5);
  });

  await t.test('converts chosen strategy into executable /zen plan with submodule slice steps', async () => {
    const session = await engine.startSession({
      topic: 'Split complexity-engine into AST parser and metric calculator',
      targetFile: 'src/workflow/complexity-engine.js',
      deep: true
    });

    const zenPlan = engine.dispatchToZen(session.id, session.recommendedStrategy.id);
    assert.equal(typeof zenPlan, 'object');
    assert.equal(zenPlan.topic, session.topic);
    assert.equal(Array.isArray(zenPlan.steps), true);
    assert.equal(zenPlan.steps.some((step) => step.includes('Slice submodule:')), true);
  });
});
