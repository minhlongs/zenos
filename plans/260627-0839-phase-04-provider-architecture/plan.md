# Phase 4: Provider Architecture — File Change Plan

> **Status:** Design Complete — Ready for Implementation
> **Date:** 2026-06-27
> **Effort:** 2–3 days
> **Dependencies:** Phase 2 (proxy server), Phase 3 (Claude integration) — both complete

---

## 1. Architecture Summary

### Problem

The current proxy hardcodes LM Studio as the sole LLM backend. `AnthropicAdapter` is a single class with `toLMStudio()`/`fromLMStudio()` methods baked in. `ModelRouter` directly references `LMSTUDIO_URL`. Adding a new provider (OpenAI, Anthropic direct, Ollama, vLLM) requires touching multiple files with no clear contract.

### Solution

Introduce a **Provider Interface** + **Adapter Pattern** + **Registry System** that:
- Defines a minimal contract every backend must implement
- Translates between provider-native APIs and ZenOS's internal message format
- Registers, selects, and falls back between providers at runtime
- Reads provider config from `zenos.json` (backward compatible with existing `lmstudio` section)

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Proxy Routes (index.js)                                    │
│  POST /v1/messages  POST /v1/chat/completions              │
│  GET  /v1/models   POST /model/switch  GET /model/recommend│
└────────────────────────┬────────────────────────────────────┘
                         │ uses
┌────────────────────────┴────────────────────────────────────┐
│  Provider Registry  (registry.js)                           │
│  • register(provider)  • select(modelHint) → Provider       │
│  • fallbackChain(providers)  • healthCheck()                │
└────────────────────────┬────────────────────────────────────┘
                         │ delegates to
┌────────────────────────┴────────────────────────────────────┐
│  Provider Interface  (provider-interface.js)                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  init(config)          → Promise<void>                  ││
│  │  complete(messages, opts) → Promise<CompletionResult>   ││
│  │  stream(messages, opts) → AsyncIterator<StreamChunk>    ││
│  │  getModels()           → Promise<ModelInfo[]>           ││
│  │  healthCheck()         → Promise<boolean>               ││
│  │  getCapabilities()     → ProviderCapabilities           ││
│  └─────────────────────────────────────────────────────────┘│
└────────────────────────┬────────────────────────────────────┘
                         │ implemented by
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
│ LMStudioAdapter │ │ OpenAIAdapter│ │ OllamaAdapter│
│ (existing logic │ │ (new)        │ │ (new)        │
│  migrated here) │ │              │ │              │
└─────────────────┘ └──────────────┘ └──────────────┘
```

### Config Schema Extension

```jsonc
// zenos.json — new top-level "providers" section
{
  "zenos": {
    // ... existing task_keywords, routing, display_names ...

    "providers": {
      "default": "lmstudio",
      "registry": {
        "lmstudio": {
          "type": "lmstudio",
          "enabled": true,
          "priority": 1,
          "base_url": "http://localhost:1234",
          "timeout_ms": 120000,
          "models": {
            "qwen":   { "id": "qwen3.6-35b-a3b",     "preset": "qwen" },
            "r1":     { "id": "deepseek-r1-distill-32b", "preset": "r1" },
            "gemma":  { "id": "gemma4-26b",            "preset": "gemma" }
          }
        },
        "openai": {
          "type": "openai",
          "enabled": false,
          "priority": 2,
          "api_key": "${OPENAI_API_KEY}",
          "base_url": "https://api.openai.com/v1",
          "models": {
            "gpt4o": { "id": "gpt-4o", "preset": "openai-default" }
          }
        },
        "ollama": {
          "type": "ollama",
          "enabled": false,
          "priority": 3,
          "base_url": "http://localhost:11434",
          "models": {
            "llama3": { "id": "llama3:70b", "preset": "ollama-default" }
          }
        }
      },
      "fallback_chain": ["lmstudio", "ollama", "openai"],
      "presets": {
        "qwen":           { "temperature": 0.2, "top_p": 0.9, "max_context": 32768 },
        "r1":             { "temperature": 0.6, "top_p": 0.95, "max_context": 32768 },
        "gemma":          { "temperature": 0.8, "top_p": 0.95, "max_context": 8192 },
        "openai-default": { "temperature": 0.7, "top_p": 0.95, "max_context": 128000 },
        "ollama-default": { "temperature": 0.7, "top_p": 0.9, "max_context": 8192 }
      }
    }
  }
}
```

**Backward compatibility:** The existing `lmstudio` section under `zenos.lmstudio` is preserved. The registry reads from it if the new `providers.registry.lmstudio` is absent. Migration is automatic.

---

## 2. File Change Plan

### New Files (5)

| File | Purpose |
|------|---------|
| `proxy/src/providers/provider-interface.js` | Abstract base class defining the contract |
| `proxy/src/providers/lmstudio-adapter.js` | LM Studio adapter (logic migrated from `anthropic-adapter.js` + `model-router.js` forward methods) |
| `proxy/src/providers/openai-adapter.js` | OpenAI-compatible adapter (template for new backends) |
| `proxy/src/providers/registry.js` | Provider registry: register, select, fallback, health |
| `proxy/src/providers/index.js` | Barrel export for clean imports |

### Modified Files (3)

| File | Changes |
|------|---------|
| `proxy/src/index.js` | Replace direct `ModelRouter`/`AnthropicAdapter` usage with `ProviderRegistry`. Routes call `registry.select()` then `provider.complete()` or `provider.stream()`. |
| `proxy/src/services/model-router.js` | Extract provider-specific forwarding logic into adapters. Router becomes a pure selection engine: `detectTaskType()` + `selectModel()` → returns `{ providerId, modelId }`. No HTTP calls. |
| `proxy/src/services/anthropic-adapter.js` | **Deprecated** — logic moves to `lmstudio-adapter.js`. Keep file as thin re-export shim for backward compatibility during transition. |

### Config Changes (1)

| File | Changes |
|------|---------|
| `config/zenos.json` | Add `providers` section (see schema above). Existing `lmstudio` section preserved. |

### Deleted Files (0)

Nothing deleted. `anthropic-adapter.js` becomes a shim, not removed.

---

## 3. Interface Contract

```js
// provider-interface.js — abstract base (not instantiated directly)

export class ProviderInterface {
  // Lifecycle
  async init(config) { throw new Error('Not implemented'); }
  async shutdown() { throw new Error('Not implemented'); }

  // Core completion (non-streaming)
  async complete(messages, options) {
    // options: { model, temperature, top_p, max_tokens, tools, system }
    // returns: { id, content, model, stop_reason, usage: { input_tokens, output_tokens } }
    throw new Error('Not implemented');
  }

  // Streaming completion
  async *stream(messages, options) {
    // yields: { id, delta, model, finish_reason }
    throw new Error('Not implemented');
  }

  // Metadata
  async getModels() { throw new Error('Not implemented'); }
  async healthCheck() { throw new Error('Not implemented'); }
  getCapabilities() { throw new Error('Not implemented'); }
  getProviderId() { throw new Error('Not implemented'); }
}
```

### CompletionResult shape (internal ZenOS format)

```js
{
  id: string,           // "msg_<timestamp>_<random>"
  role: "assistant",
  content: [
    { type: "text", text: string }
    // | { type: "tool_use", id, name, input }
  ],
  model: string,        // resolved model ID
  stop_reason: string,  // "end_turn" | "max_tokens" | "tool_use" | "error"
  usage: {
    input_tokens: number,
    output_tokens: number
  }
}
```

### StreamChunk shape

```js
{
  id: string,
  delta: { content?: string, tool_calls?: [...] },
  model: string,
  finish_reason: string | null
}
```

---

## 4. Adapter Responsibilities

Each adapter handles:
1. **Format translation** — Convert ZenOS internal message format to/from provider-native format
2. **Auth** — Inject API keys, headers, auth tokens from config
3. **Error mapping** — Translate provider error codes to ZenOS error types
4. **Capability detection** — Report streaming support, tool support, context limits

### LMStudioAdapter (migrates existing logic)

- `toNative()` — Convert messages to OpenAI-compatible format (existing `toOpenAICompatible` logic)
- `fromNative()` — Convert OpenAI response to ZenOS CompletionResult (existing `toOpenAIResponse` logic)
- `streamNative()` — SSE parsing (existing `forwardStream` logic)
- HTTP calls to `http://localhost:1234/v1/chat/completions`

### OpenAIAdapter (new, template)

- `toNative()` — Same OpenAI-compatible format (no translation needed for OpenAI itself)
- `fromNative()` — Same as LMStudio (OpenAI → ZenOS)
- Auth via `Authorization: Bearer <api_key>` header
- Configurable `base_url` (supports OpenRouter, Together, Groq, etc.)

### OllamaAdapter (new, template)

- `toNative()` — Convert to Ollama `/api/chat` format (different field names: `model`, `messages`, `stream`, `options.temperature`)
- `fromNative()` — Convert Ollama response to ZenOS format
- Streaming via Ollama's NDJSON format

---

## 5. Registry Design

```js
class ProviderRegistry {
  constructor() {
    this.providers = new Map();   // providerId → ProviderInterface instance
    this.modelMap = new Map();    // modelId → { providerId, modelConfig }
    this.presets = new Map();     // presetName → { temperature, top_p, ... }
    this.defaultProvider = null;
    this.fallbackChain = [];
  }

  async loadConfig(configPath) { /* parse zenos.json providers section */ }
  async register(provider) { /* init + store */ }
  async select(modelHint) { /* resolve model → provider, with sticky override */ }
  async complete(modelHint, messages, options) { /* select → provider.complete() */ }
  async *stream(modelHint, messages, options) { /* select → provider.stream() */ }
  async healthCheckAll() { /* check all registered providers */ }
  getAvailableModels() { /* aggregate models from all providers */ }
}
```

**Selection logic:**
1. If `modelHint` matches a known model ID → return its registered provider
2. If sticky override active and not expired → use sticky provider
3. If `modelHint` is a preset name (qwen/r1/gemma) → resolve to provider via model map
4. Fallback: use `defaultProvider`

---

## 6. Migration Path

### Step 1: Create provider interface + LMStudio adapter
- Extract `toOpenAICompatible`/`toOpenAIResponse`/`forwardStream` from `anthropic-adapter.js` into `lmstudio-adapter.js`
- Implement `ProviderInterface` base class
- Write unit tests for LMStudioAdapter

### Step 2: Create registry
- Implement `ProviderRegistry` with config loading from `zenos.json`
- Register LMStudioAdapter as default provider
- Write unit tests for registry (register, select, fallback, health)

### Step 3: Wire into proxy routes
- Replace `new ModelRouter()` + `new AnthropicAdapter()` in `index.js` with `new ProviderRegistry()`
- Routes call `registry.complete()` / `registry.stream()` instead of manual adapter + router coordination
- Keep `ModelRouter`'s `detectTaskType()` as a standalone utility (moves to `utils/task-detector.js` which already exists)

### Step 4: Add OpenAI adapter template
- Create `openai-adapter.js` implementing the interface
- Disabled by default in config (`"enabled": false`)
- Unit tests with mock HTTP

### Step 5: Config migration
- Add `providers` section to `zenos.json`
- Ensure backward compatibility: if `providers.registry.lmstudio` absent, derive from existing `zenos.lmstudio` section

---

## 7. Files to Create

```
proxy/src/providers/
├── provider-interface.js    # Abstract base class (~60 lines)
├── lmstudio-adapter.js      # LM Studio backend (~120 lines, migrated)
├── openai-adapter.js        # OpenAI-compatible backend (~80 lines, template)
├── ollama-adapter.js        # Ollama backend (~80 lines, template)
├── registry.js              # Provider registry (~150 lines)
└── index.js                 # Barrel export (~10 lines)
```

## 8. Files to Modify

```
proxy/src/index.js           # ~30 lines changed: swap Router+Adapter → Registry
proxy/src/services/
├── model-router.js          # ~40 lines removed (HTTP forwarding), ~20 kept (selection logic)
└── anthropic-adapter.js     # → thin shim re-exporting from lmstudio-adapter
config/zenos.json            # Add providers section (~30 lines)
```

## 9. Tests

| Test File | Coverage |
|-----------|----------|
| `proxy/tests/test-provider-interface.js` | Contract validation (abstract methods throw) |
| `proxy/tests/test-lmstudio-adapter.js` | Format conversion, mock HTTP responses |
| `proxy/tests/test-openai-adapter.js` | Format conversion, auth header injection |
| `proxy/tests/test-registry.js` | Register, select, fallback, health check, config loading |
| `proxy/tests/test-provider-integration.js` | End-to-end through registry with mock providers |

**Target:** All new tests pass. Existing 25/25 tests still pass (backward compat shim).

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Breaking existing proxy behavior | Shim layer in `anthropic-adapter.js`; routes switch atomically in one commit |
| Config migration breaks existing setups | Auto-derive from old `lmstudio` section if new `providers` section absent |
| LM Studio adapter misses edge cases | Migrate line-by-line from proven code; test against existing test vectors |
| Over-engineering for 1 provider | Interface is ~60 lines; registry ~150 lines. YAGNI satisfied — no extra abstraction |

---

## 11. Acceptance Criteria

- [ ] `ProviderInterface` abstract class with 6 methods defined
- [ ] `LMStudioAdapter` passes all existing adapter test vectors
- [ ] `ProviderRegistry` loads config, registers providers, selects by model hint
- [ ] Proxy routes work identically to current behavior (same API responses)
- [ ] All 25 existing tests pass + 15+ new tests pass
- [ ] `zenos.json` backward compatible (old configs load without `providers` section)
- [ ] `openai-adapter.js` template ready for activation via config flag
