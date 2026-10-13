'use strict';

/**
 * DebateProtocol - Socratic dialectic generator (Advocate vs Adversary vs Synthesizer)
 * Strict Invariant: < 200 LOC, Zero external dependencies.
 */
class DebateProtocol {
  generateAdvocateTurn(topic, context = {}) {
    return {
      persona: 'ADVOCATE',
      role: 'Velocity & Decoupling Champion',
      argument: `Proposing modular decomposition for "${topic}". Isolating functional components promotes testability, reduces cognitive load, and enables parallel sub-agent velocity.`,
      recommendedFocus: 'Extract domain logic into cohesive standalone modules (< 200 LOC).',
      timestamp: new Date().toISOString()
    };
  }

  generateAdversaryTurn(topic, context = {}) {
    const br = context.blastRadius || 30;
    return {
      persona: 'ADVERSARY',
      role: 'Invariant & Safety Inquisitor',
      argument: `Caution on "${topic}". Existing blast radius is ${br}. Refactoring risks cascading breakage in dependent callers and potential circular dependency cycles.`,
      riskIdentified: true,
      invariantWarnings: [
        'Must maintain strict < 200 LOC ceiling per output module',
        'Must avoid new external npm dependencies',
        'Must preserve backward compatibility via facade barrel exports'
      ],
      timestamp: new Date().toISOString()
    };
  }

  generateSynthesizerTurn(topic, priorTurns = [], context = {}) {
    const baseBR = context.blastRadius || 25;
    const baseCC = context.complexity || 20;

    const candidateStrategies = [
      {
        id: 'strat_surgical_slice',
        name: 'Surgical Facade Extraction',
        description: 'Slice atomic submodules while retaining a lightweight facade barrel export.',
        blastRadius: Math.max(10, Math.round(baseBR * 0.6)),
        complexity: Math.max(5, Math.round(baseCC * 0.5)),
        invariantRisk: 12,
        churnProbability: 15,
        estimatedTouchedFiles: 3
      },
      {
        id: 'strat_modular_split',
        name: 'Deep Domain Partitioning',
        description: 'Fully decouple into distinct domain services with dedicated event contracts.',
        blastRadius: Math.round(baseBR * 1.3),
        complexity: Math.max(15, Math.round(baseCC * 0.9)),
        invariantRisk: 45,
        churnProbability: 50,
        estimatedTouchedFiles: 6
      }
    ];

    return {
      persona: 'SYNTHESIZER',
      role: 'Pareto Consensus Arbitrator',
      argument: `Consensus reached on "${topic}". Balancing velocity with blast radius containment favors surgical facade extraction with Dual-Key verification.`,
      candidateStrategies,
      consensusSummary: 'Proceed with low-risk surgical modularization shielded by facade barrels.',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { DebateProtocol };
