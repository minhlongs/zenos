'use strict';

/**
 * DebateProtocol - Socratic dialectic generator (Advocate, Adversary, CrossExaminer, Rebuttal, Synthesizer)
 * Strict Invariant: < 200 LOC, Zero external dependencies.
 */
class DebateProtocol {
  generateAdvocateTurn(topic, context = {}) {
    const loc = context.totalLines ? ` (${context.totalLines} LOC, ${context.branchingCount || 0} branches)` : '';
    return {
      persona: 'ADVOCATE',
      role: 'Velocity & Decoupling Champion',
      argument: `Proposing modular decomposition for "${topic}"${loc}. Isolating functional components promotes testability, reduces cognitive load, and enables parallel sub-agent velocity.`,
      recommendedFocus: 'Extract domain logic into cohesive standalone modules (< 200 LOC).',
      timestamp: new Date().toISOString()
    };
  }

  generateAdversaryTurn(topic, context = {}) {
    const br = context.blastRadius ?? context.blastRadiusScore ?? 30;
    const fanIn = context.fanIn ?? 1;
    return {
      persona: 'ADVERSARY',
      role: 'Invariant & Safety Inquisitor',
      argument: `Caution on "${topic}". Existing blast radius is ${br} (Fan-In: ${fanIn}). Refactoring risks cascading breakage in dependent callers and potential circular dependency cycles.`,
      riskIdentified: true,
      invariantWarnings: [
        'Must maintain strict < 200 LOC ceiling per output module',
        'Must avoid new external npm dependencies',
        'Must preserve backward compatibility via facade barrel exports'
      ],
      timestamp: new Date().toISOString()
    };
  }

  generateCrossExaminerTurn(topic, context = {}) {
    const seams = context.detectedSeams || 2;
    const submodules = context.splitBlueprint?.extractedSubmodules || [];
    const maxSubLoc = submodules.reduce((max, m) => Math.max(max, m.estimatedLoc || 0), 90);
    return {
      persona: 'CROSS_EXAMINER',
      role: 'Socratic Seam & Invariant Auditor',
      argument: `Cross-examining "${topic}" across ${seams} detected AST/lexical seams. Audited candidate submodule ceiling (${maxSubLoc} est. LOC) against the strict < 200 LOC constitution.`,
      socraticQuestions: [
        `Do all ${seams} extracted submodules remain strictly under 120 LOC after decomposition?`,
        'Are transitive upstream callers shielded by a zero-breaking-change barrel facade?',
        'Does any extracted seam introduce a bidirectional require() cycle?'
      ],
      timestamp: new Date().toISOString()
    };
  }

  generateRebuttalTurn(topic, context = {}) {
    const facade = context.splitBlueprint?.facadePath || context.targetFile || 'module-facade.js';
    const count = context.splitBlueprint?.extractedSubmodules?.length || 2;
    return {
      persona: 'REBUTTAL',
      role: 'Architectural Seam Defender',
      argument: `Rebuttal verified for "${topic}": retaining "${facade}" as a thin re-exporting barrel isolates all ${count} extracted submodules from upstream callers and eliminates cycle risk.`,
      riskIdentified: false,
      timestamp: new Date().toISOString()
    };
  }

  generateSynthesizerTurn(topic, priorTurns = [], context = {}) {
    const baseBR = context.blastRadius ?? context.blastRadiusScore ?? 25;
    const baseCC = context.complexity ?? context.branchingCount ?? 20;

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
        id: 'strat_strangler_seam',
        name: 'Incremental Strangler Seam',
        description: 'Extract pure helper and script modules first with 100% contract parity.',
        blastRadius: Math.max(12, Math.round(baseBR * 0.75)),
        complexity: Math.max(8, Math.round(baseCC * 0.65)),
        invariantRisk: 18,
        churnProbability: 22,
        estimatedTouchedFiles: 4
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
      argument: `Consensus reached on "${topic}" after ${priorTurns.length + 1} Socratic turns. Balancing velocity with blast radius containment favors surgical facade extraction with Dual-Key verification.`,
      candidateStrategies,
      splitBlueprint: context.splitBlueprint || null,
      consensusSummary: 'Proceed with low-risk surgical modularization shielded by facade barrels.',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { DebateProtocol };
