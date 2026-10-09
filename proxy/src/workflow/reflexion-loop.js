'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { DiagnosticExtractor } = require('./diagnostic-extractor.js');

class ReflexionLoop extends EventEmitter {
  constructor(options = {}) {
    super();
    this.workspaceRoot = path.resolve(options.workspaceRoot || process.cwd());
    this.modelClient = options.modelClient || null;
    this.concurrencyGate = options.concurrencyGate || null;
    this.extractor = options.extractor || new DiagnosticExtractor({ workspaceRoot: this.workspaceRoot });
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : 3;
    this.model = options.model || 'qwen2.5-coder-14b';
  }

  async run(options = {}) {
    const { task, targetFile, runVerifier } = options;
    if (typeof runVerifier !== 'function') throw new Error('runVerifier function is required');

    this.emit('reflexion_start', { task, targetFile });
    const history = [];
    let attempts = 0;

    let initialResult = await runVerifier();
    let passed = initialResult.success || initialResult.exitCode === 0;
    const initialPassed = passed;

    history.push({
      turn: 0,
      passed,
      diagnostic: passed ? null : this.extractor.extract(initialResult.stderr || initialResult.output, { targetFile })
    });

    while (!passed && attempts < this.maxRetries) {
      attempts++;
      const lastEntry = history[history.length - 1];
      const diag = lastEntry.diagnostic;

      const critique = this.buildCritique(task, targetFile, diag);
      this.emit('reflexion_critique', { turn: attempts, critique, diag });

      const patch = await this.generatePatch({ task, targetFile, diag, critique });
      this.emit('reflexion_patch', { turn: attempts, patch });

      if (patch && targetFile) {
        this.applyPatch(targetFile, patch);
      }

      const verifyResult = await runVerifier();
      passed = verifyResult.success || verifyResult.exitCode === 0;

      const nextDiag = passed ? null : this.extractor.extract(verifyResult.stderr || verifyResult.output, { targetFile });
      history.push({
        turn: attempts,
        critique,
        patch,
        passed,
        diagnostic: nextDiag
      });

      this.emit('reflexion_verified', { turn: attempts, passed, verifyResult });
    }

    const outcome = {
      success: passed,
      initialPassed,
      finalPassed: passed,
      attempts,
      maxRetries: this.maxRetries,
      history
    };

    this.emit('reflexion_complete', outcome);
    return outcome;
  }

  buildCritique(task, targetFile, diag) {
    let critique = `Goal: ${task}\nTarget: ${targetFile}\n`;
    if (diag) {
      critique += `Failed Assertion: ${diag.failureMessage}\n`;
      if (diag.codeContext) critique += `Fault Context:\n${diag.codeContext}\n`;
    }
    critique += `Instruction: Provide surgical, minimal correction to satisfy the verification.`;
    return critique;
  }

  async generatePatch({ task, targetFile, diag, critique }) {
    if (!this.modelClient) return null;

    const prompt = `You are a self-healing code repair assistant.
Task: ${task}
Target File: ${targetFile}
${critique}

Respond with only the complete corrected code for ${targetFile} wrapped in \`\`\`javascript ... \`\`\`.`;

    const executeInference = async () => {
      const res = await this.modelClient.createChatCompletion({
        model: this.model,
        messages: [{ role: 'user', content: prompt }]
      });
      const content = res.choices?.[0]?.message?.content || '';
      return this.extractCodeBlock(content);
    };

    if (this.concurrencyGate) {
      return await this.concurrencyGate.enqueue(executeInference);
    }
    return await executeInference();
  }

  extractCodeBlock(content) {
    const match = content.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
    return match ? match[1].trim() : content.trim();
  }

  applyPatch(targetFile, patchContent) {
    const fullPath = path.resolve(this.workspaceRoot, targetFile);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, patchContent, 'utf8');
  }
}

module.exports = { ReflexionLoop };
