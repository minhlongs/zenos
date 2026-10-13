'use strict';

/**
 * AriCalculator - Quantitative Architectural Risk Index & Pareto Ranker
 * Strict Invariant: < 200 LOC, Zero external dependencies.
 */
class AriCalculator {
  constructor(weights = {}) {
    this.wBlast = weights.wBlast ?? 0.35;
    this.wComplexity = weights.wComplexity ?? 0.25;
    this.wInvariant = weights.wInvariant ?? 0.25;
    this.wChurn = weights.wChurn ?? 0.15;
  }

  calculateRisk(metrics = {}) {
    const br = Math.min(100, Math.max(0, Number(metrics.blastRadius) || 0));
    const comp = Math.min(100, Math.max(0, Number(metrics.complexity) || 0));
    const inv = Math.min(100, Math.max(0, Number(metrics.invariantRisk) || 0));
    const churn = Math.min(100, Math.max(0, Number(metrics.churnProbability) || 0));

    const weightedScore = (
      (br * this.wBlast) +
      (comp * this.wComplexity) +
      (inv * this.wInvariant) +
      (churn * this.wChurn)
    );

    const score = Math.round(Math.min(100, Math.max(0, weightedScore)) * 10) / 10;
    const tier = this.resolveTier(score);

    return {
      score,
      tier,
      breakdown: {
        blastRadius: { value: br, weighted: Math.round(br * this.wBlast * 10) / 10 },
        complexity: { value: comp, weighted: Math.round(comp * this.wComplexity * 10) / 10 },
        invariantRisk: { value: inv, weighted: Math.round(inv * this.wInvariant * 10) / 10 },
        churnProbability: { value: churn, weighted: Math.round(churn * this.wChurn * 10) / 10 }
      }
    };
  }

  resolveTier(score) {
    if (score < 30) return 'SAFE';
    if (score < 60) return 'CAUTION';
    return 'CRITICAL';
  }

  rankStrategies(strategies = []) {
    if (!Array.isArray(strategies)) return [];

    const scored = strategies.map((strat) => {
      const risk = this.calculateRisk(strat);
      return {
        ...strat,
        ariScore: risk.score,
        tier: risk.tier,
        breakdown: risk.breakdown
      };
    });

    scored.sort((a, b) => a.ariScore - b.ariScore);

    return scored.map((item, index) => ({
      ...item,
      rank: index + 1,
      isRecommended: index === 0 && item.tier !== 'CRITICAL'
    }));
  }
}

module.exports = { AriCalculator };
