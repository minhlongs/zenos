'use strict';

class SwarmRoles {
  static ROLES = {
    ARCHITECT: 'ARCHITECT',
    CODER: 'CODER',
    VERIFIER: 'VERIFIER',
    AUDITOR: 'AUDITOR'
  };

  static ARTIFACT_TYPES = {
    SPEC: 'SPEC',
    CODE_DIFF: 'CODE_DIFF',
    TEST_OUTPUT: 'TEST_OUTPUT',
    AUDIT_REPORT: 'AUDIT_REPORT'
  };

  static buildArchitectPrompt(objective) {
    return [
      'You are the ZenOS Swarm ARCHITECT.',
      'Decompose the objective into formal acceptance criteria, file targets, and test assertions.',
      'Constraints: adhere to < 200 LOC per file, 0 external npm dependencies.',
      `Objective: ${objective}`,
      'Emit a structured JSON specification with keys: { "summary", "targets", "assertions", "guidelines" }.'
    ].join('\n');
  }

  static buildCoderPrompt({ objective, spec, previousDiff, feedback }) {
    return [
      'You are the ZenOS Swarm CODER.',
      'Implement minimal surgical code changes satisfying the spec.',
      'Constraints: adhere strictly to < 200 LOC per file, zero external npm dependencies.',
      `Objective: ${objective}`,
      `Spec: ${typeof spec === 'object' ? JSON.stringify(spec) : spec}`,
      previousDiff ? `Previous Diff:\n${previousDiff}` : '',
      feedback ? `Feedback to address:\n${feedback}` : '',
      'Emit a diff or file map representation with key "diff" or "files".'
    ].filter(Boolean).join('\n');
  }

  static buildVerifierPrompt({ testResult, assertions }) {
    const passed = testResult ? testResult.exitCode === 0 : false;
    return {
      role: SwarmRoles.ROLES.VERIFIER,
      artifactType: SwarmRoles.ARTIFACT_TYPES.TEST_OUTPUT,
      passed,
      exitCode: testResult ? testResult.exitCode : 1,
      stdout: testResult ? testResult.stdout : '',
      stderr: testResult ? testResult.stderr : '',
      assertionsSummary: assertions || (passed ? 'All assertions passed' : 'Assertions failed')
    };
  }

  static buildAuditorPrompt({ objective, spec, diff, testOutput }) {
    return [
      'You are the ZenOS Swarm AUDITOR.',
      'Perform adversarial inspection of the code diff against the specification and system invariants.',
      'Invariants: < 200 LOC per file, zero external dependencies, no security regressions.',
      `Objective: ${objective}`,
      `Spec: ${typeof spec === 'object' ? JSON.stringify(spec) : spec}`,
      `Diff: ${diff}`,
      `Test Output: ${typeof testOutput === 'object' ? JSON.stringify(testOutput) : testOutput}`,
      'Emit JSON with keys: { "approved": boolean, "invariants_verified": string[], "security_status": "CLEAN"|"FLAGGED", "notes": string }.'
    ].join('\n');
  }

  static parseAuditResponse(content) {
    if (!content) return { approved: false, reason: 'Empty audit content' };
    if (typeof content === 'object') {
      return {
        approved: Boolean(content.approved),
        reason: content.notes || content.reason || (content.approved ? 'Audit passed' : 'Audit rejected'),
        invariantsVerified: content.invariants_verified || []
      };
    }
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          approved: Boolean(parsed.approved),
          reason: parsed.notes || parsed.reason || (parsed.approved ? 'Audit passed' : 'Audit rejected'),
          invariantsVerified: parsed.invariants_verified || []
        };
      }
    } catch {
      // fallback text parsing
    }
    const approved = content.toUpperCase().includes('SIGN_APPROVAL') || content.toUpperCase().includes('APPROVED');
    return { approved, reason: content.slice(0, 200) };
  }
}

module.exports = { SwarmRoles };
