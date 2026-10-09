'use strict';

class ConsensusGate {
  evaluate(input = {}) {
    let verifierResult = input.verifierResult;
    let auditorResult = input.auditorResult;

    // Handle positional arguments evaluate(verifierResult, auditorResult) or evaluate({ verifierResult, auditorResult })
    if (arguments.length >= 2) {
      verifierResult = arguments[0];
      auditorResult = arguments[1];
    }

    const key1Passed = Boolean(verifierResult && verifierResult.passed === true);
    const key2Approved = Boolean(auditorResult && auditorResult.approved === true);

    const key1Reason = key1Passed
      ? (verifierResult && verifierResult.reason) || 'Tests and verification suites passed'
      : (verifierResult && (verifierResult.reason || verifierResult.error)) || 'Verifier reported test failures or incomplete execution';

    const key2Reason = key2Approved
      ? (auditorResult && auditorResult.reason) || 'Architecture, security, and LOC policies approved'
      : (auditorResult && (auditorResult.reason || auditorResult.error)) || 'Auditor identified policy or security violations';

    const approved = key1Passed && key2Approved;
    let status = 'REJECTED';
    if (approved) {
      status = 'APPROVED';
    } else if (!verifierResult && !auditorResult) {
      status = 'PENDING';
    }

    let notes = '';
    if (status === 'APPROVED') {
      notes = 'Dual-key consensus reached: Verifier and Auditor both approved.';
    } else if (status === 'PENDING') {
      notes = 'Awaiting verifier and auditor evaluations.';
    } else if (!key1Passed && !key2Approved) {
      notes = `Dual rejection: Verifier failed (${key1Reason}); Auditor rejected (${key2Reason}).`;
    } else if (!key1Passed) {
      notes = `Key 1 failure: Verifier rejected (${key1Reason}).`;
    } else {
      notes = `Key 2 failure: Auditor rejected (${key2Reason}).`;
    }

    const details = {
      key1: { passed: key1Passed, reason: key1Reason },
      key2: { approved: key2Approved, reason: key2Reason }
    };

    return {
      approved,
      status,
      reason: notes,
      key1: details.key1,
      key2: details.key2,
      notes,
      details
    };
  }

  formatVerdict(consensus) {
    if (!consensus) return 'NO_CONSENSUS_RECORDED';
    const status = consensus.status || consensus.verdict || (consensus.approved ? 'APPROVED' : 'PENDING');
    const key1 = consensus.key1 ? (consensus.key1.passed ? 'PASS' : 'FAIL') : (consensus.verifierPass ? 'PASS' : 'FAIL');
    const key2 = consensus.key2 ? (consensus.key2.approved ? 'PASS' : 'FAIL') : (consensus.auditorPass ? 'PASS' : 'FAIL');
    const notes = consensus.notes || consensus.reason || '';
    return `[${status}] Key1(Verifier)=${key1} | Key2(Auditor)=${key2}${notes ? ` - ${notes}` : ''}`;
  }
}

module.exports = { ConsensusGate };
