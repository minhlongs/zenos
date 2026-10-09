'use strict';

const RISK_TIERS = {
  SAFE: 'SAFE',
  MUTATING: 'MUTATING',
  DANGEROUS: 'DANGEROUS',
  BLOCKED: 'BLOCKED'
};

const BLOCKED_PATTERNS = [
  /rm\s+-rf?\s+(\/\s*|\/\*|\/\.\*)$/i,
  /:\(\)\s*\{\s*:\|:&\s*\};\s*:/,
  /mkfs(\.[a-z0-9]+)?\s+/i,
  /cat\s+.*(\.ssh|\.aws|\.gnupg)/i,
  /(curl|wget)\s+.*\|\s*(bash|sh|zsh)/i
];

const DANGEROUS_PATTERNS = [
  /\brm\s+(-[a-zA-Z]*f|[a-zA-Z0-9_\-\.\/]+)/i,
  /\bgit\s+reset\s+--hard/i,
  /\bgit\s+clean\s+-[a-zA-Z]*f/i,
  /\bgit\s+checkout\s+-[a-zA-Z]*f/i,
  /\bchmod\s+777/i,
  /\bkill\s+-9/i
];

const SAFE_COMMANDS = new Set([
  'ls', 'pwd', 'whoami', 'cat', 'head', 'tail', 'grep', 'wc',
  'node', 'npm', 'echo', 'date', 'which', 'git'
]);

function evaluateSingleCommand(cmd) {
  const trimmed = cmd.trim();
  if (!trimmed) return RISK_TIERS.SAFE;

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) return RISK_TIERS.BLOCKED;
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) return RISK_TIERS.DANGEROUS;
  }

  const firstToken = trimmed.split(/\s+/)[0];
  if (firstToken === 'git') {
    const sub = trimmed.split(/\s+/)[1];
    if (['status', 'diff', 'log', 'branch', 'show'].includes(sub)) {
      return RISK_TIERS.SAFE;
    }
    return RISK_TIERS.MUTATING;
  }

  if (firstToken === 'npm') {
    const sub = trimmed.split(/\s+/)[1];
    if (['test', 't', 'run'].includes(sub)) return RISK_TIERS.MUTATING;
  }

  if (SAFE_COMMANDS.has(firstToken) && !firstToken.match(/^(rm|chmod|chown)$/)) {
    return RISK_TIERS.SAFE;
  }

  return RISK_TIERS.MUTATING;
}

function classifyCommand(fullCommand) {
  if (!fullCommand || typeof fullCommand !== 'string') {
    return { tier: RISK_TIERS.SAFE, requiresApproval: false, blocked: false };
  }

  const trimmedFull = fullCommand.trim();
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmedFull)) {
      return { tier: RISK_TIERS.BLOCKED, requiresApproval: false, blocked: true };
    }
  }

  const subCommands = fullCommand.split(/&&|\|\||;/);
  let highestTier = RISK_TIERS.SAFE;

  const severityOrder = [
    RISK_TIERS.SAFE,
    RISK_TIERS.MUTATING,
    RISK_TIERS.DANGEROUS,
    RISK_TIERS.BLOCKED
  ];

  for (const sub of subCommands) {
    const tier = evaluateSingleCommand(sub);
    if (severityOrder.indexOf(tier) > severityOrder.indexOf(highestTier)) {
      highestTier = tier;
    }
  }

  return {
    tier: highestTier,
    requiresApproval: highestTier === RISK_TIERS.DANGEROUS,
    blocked: highestTier === RISK_TIERS.BLOCKED
  };
}

module.exports = { classifyCommand, RISK_TIERS };
