'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { SwarmRoles } = require('../src/workflow/swarm-roles.js');

test('SwarmRoles constants are defined', () => {
  assert.strictEqual(SwarmRoles.ROLES.ARCHITECT, 'ARCHITECT');
  assert.strictEqual(SwarmRoles.ROLES.CODER, 'CODER');
  assert.strictEqual(SwarmRoles.ROLES.VERIFIER, 'VERIFIER');
  assert.strictEqual(SwarmRoles.ROLES.AUDITOR, 'AUDITOR');
  assert.strictEqual(SwarmRoles.ARTIFACT_TYPES.SPEC, 'SPEC');
  assert.strictEqual(SwarmRoles.ARTIFACT_TYPES.CODE_DIFF, 'CODE_DIFF');
  assert.strictEqual(SwarmRoles.ARTIFACT_TYPES.TEST_OUTPUT, 'TEST_OUTPUT');
  assert.strictEqual(SwarmRoles.ARTIFACT_TYPES.AUDIT_REPORT, 'AUDIT_REPORT');
});

test('SwarmRoles prompts contain required constraints and objectives', () => {
  const archPrompt = SwarmRoles.buildArchitectPrompt('Refactor auth module');
  assert.ok(archPrompt.includes('ARCHITECT'));
  assert.ok(archPrompt.includes('< 200 LOC'));
  assert.ok(archPrompt.includes('Refactor auth module'));

  const coderPrompt = SwarmRoles.buildCoderPrompt({
    objective: 'Implement login',
    spec: { summary: 'Login spec' },
    previousDiff: '- old\n+ new',
    feedback: 'Fix error handler'
  });
  assert.ok(coderPrompt.includes('CODER'));
  assert.ok(coderPrompt.includes('Login spec'));
  assert.ok(coderPrompt.includes('Fix error handler'));

  const auditorPrompt = SwarmRoles.buildAuditorPrompt({
    objective: 'Security test',
    spec: 'Spec',
    diff: '+ diff',
    testOutput: { passed: true }
  });
  assert.ok(auditorPrompt.includes('AUDITOR'));
  assert.ok(auditorPrompt.includes('invariants_verified'));
});

test('SwarmRoles verifier prompt formats exitCode and assertions', () => {
  const v1 = SwarmRoles.buildVerifierPrompt({ testResult: { exitCode: 0, stdout: 'OK' } });
  assert.strictEqual(v1.passed, true);
  assert.strictEqual(v1.exitCode, 0);

  const v2 = SwarmRoles.buildVerifierPrompt({ testResult: { exitCode: 1, stderr: 'Err' } });
  assert.strictEqual(v2.passed, false);
  assert.strictEqual(v2.exitCode, 1);
});

test('SwarmRoles parseAuditResponse parses JSON and text formats', () => {
  const jsonParsed = SwarmRoles.parseAuditResponse({
    approved: true,
    notes: 'All checks passed',
    invariants_verified: ['<200 LOC']
  });
  assert.strictEqual(jsonParsed.approved, true);
  assert.strictEqual(jsonParsed.reason, 'All checks passed');

  const textJson = SwarmRoles.parseAuditResponse('```json\n{"approved": false, "notes": "LOC exceeded"}\n```');
  assert.strictEqual(textJson.approved, false);
  assert.strictEqual(textJson.reason, 'LOC exceeded');

  const plainApproval = SwarmRoles.parseAuditResponse('SIGN_APPROVAL on diff');
  assert.strictEqual(plainApproval.approved, true);

  const emptyResponse = SwarmRoles.parseAuditResponse('');
  assert.strictEqual(emptyResponse.approved, false);
});
