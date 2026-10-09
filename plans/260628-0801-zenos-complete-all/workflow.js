export const meta = {
  name: 'zenos-complete-all',
  description: 'Complete every remaining gap in ZenOS — landing page nav, OpenAI adapter, Qdrant, ONNX, build verification',
  phases: [
    { title: 'Audit', detail: 'Scan all remaining gaps across frontend + backend' },
    { title: 'Fix', detail: 'Landing nav, OpenAI adapter, Qdrant config, ONNX, build' },
    { title: 'Verify', detail: 'Tests + TypeScript + commit' },
  ],
};

// Phase 1: Audit — already done in prior turns. Skipping to implementation.

phase('Fix: Landing page nav');
const landingFix = await agent('Fix the ZenOS landing page at /Users/macbook/ZenOS/frontend/app/page.tsx. Add a navigation header at the top of the page with: (1) ZenOS logo/name on the left, (2) "Dashboard" link pointing to /dashboard, (3) "Docs" link pointing to #. Style it with the project design tokens (bg-surface/80 backdrop-blur, text-text, border-surface-light). Place it inside the existing <section> but before the <AnimatedSection> hero. Keep all existing content intact. Do NOT remove the footer links.', {
  label: 'fix-landing-nav',
  phase: 'Fix',
});
log(`Landing nav: ${landingFix ? 'DONE' : 'FAILED'}`);

phase('Fix: OpenAI adapter activation');
const openaiFix = await agent('Activate the OpenAI adapter in ZenOS. Read these files first: (1) /Users/macbook/ZenOS/proxy/src/services/provider-registry.js to understand how providers are registered, (2) /Users/macbook/ZenOS/proxy/src/index.js to see how lmstudio is registered, (3) /Users/macbook/ZenOS/config/zenos.json to see current provider config. Then: (a) Add an "openai" entry to config/zenos.json providers section with enabled: false, type: "openai", displayName: "OpenAI", base_url: "https://api.openai.com/v1", api_key: "${OPENAI_API_KEY}". (b) In proxy/src/index.js, after the lmstudio registration, add code to check if openai provider is enabled in config and if so, create and register an OpenAIAdapter. You need to create the OpenAI adapter first at proxy/src/services/openai-adapter.js — it should extend ProviderInterface and implement getModels(), sendMessage(), streamMessages(), getStatus(), checkHealth(). It should use the OpenAI API format (same as LM Studio since both are OpenAI-compatible). Keep it minimal — reuse LMStudioAdapter patterns.', {
  label: 'fix-openai-adapter',
  phase: 'Fix',
});
log(`OpenAI adapter: ${openaiFix ? 'DONE' : 'FAILED'}`);

phase('Fix: Qdrant config wiring');
const qdrantFix = await agent('Fix Qdrant integration in ZenOS. Read /Users/macbook/ZenOS/proxy/src/services/vector-manager.js and /Users/macbook/ZenOS/config/zenos.json. The vector manager has fallback mode when Qdrant is offline. Make it properly attempt connection on init and expose a clear status. Specifically: (1) In vector-manager.js, add a connect() method that tries to reach Qdrant at the configured URL and sets connected state. (2) In the constructor, call connect() asynchronously (fire-and-forget, don\'t block init). (3) Expose isConnected() and isActive() methods that reflect real connection state, not just config presence. Keep the fallback behavior intact — if Qdrant is unreachable, continue in fallback mode without crashing.', {
  label: 'fix-qdrant-wiring',
  phase: 'Fix',
});
log(`Qdrant wiring: ${qdrantFix ? 'DONE' : 'FAILED'}`);

phase('Fix: ONNX embedding');
const onnxFix = await agent('Install ONNX Runtime for ZenOS real embeddings. Run: cd /Users/macbook/ZenOS/proxy && npm install onnxruntime-node 2>&1 | tail -10. If installation fails (common on M1), document the error and add a clear setup instruction comment in proxy/src/services/embedding-service.js near the import. Do NOT break the existing pseudo-embedding fallback — it must continue working regardless of ONNX status.', {
  label: 'fix-onnx-embedding',
  phase: 'Fix',
});
log(`ONNX embedding: ${onnxFix ? 'DONE' : 'ATTEMPTED'}`);

phase('Verify');
const testResult = await agent('Run verification for ZenOS. Execute these commands and report results: (1) cd /Users/macbook/ZenOS/proxy && npm test 2>&1 | tail -5, (2) cd /Users/macbook/ZenOS/frontend && npx tsc --noEmit 2>&1 | tail -5, (3) git -C /Users/macbook/ZenOS status --short | head -20. Report pass/fail counts and any errors found.', {
  label: 'verify-all',
  phase: 'Verify',
});
log(`Verification: ${testResult}`);

return {
  landing: landingFix ? 'fixed' : 'failed',
  openai: openaiFix ? 'activated' : 'failed',
  qdrant: qdrantFix ? 'wired' : 'failed',
  onnx: onnxFix ? 'installed' : 'attempted',
  verification: testResult,
};
