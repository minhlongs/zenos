# ZenOS — Local AI Workstation Platform

> **ZenOS** là nền tảng trạm làm việc AI cục bộ (Local AI Workstation) tối ưu cho Apple Silicon (M1/M2/M3/M4 Max), kết nối Claude Code CLI với LM Studio và các mô hình cục bộ thông qua proxy thích ứng.
>
> **ZenOS** is a local AI workstation platform optimized for Apple Silicon, bridging Claude Code CLI with LM Studio and local open-weight models via an adaptive proxy layer.

---

## 🏗️ Architecture

```
┌─────────────┐       Anthropic API        ┌───────────────────────┐       OpenAI API       ┌───────────────┐
│ Claude Code │ ─────────────────────────> │      ZenOS Proxy      │ ─────────────────────> │   LM Studio   │
│     CLI     │  (http://localhost:20129)  │ - Model Auto-Router   │  (http://localhost:1234)│ - Local LLMs  │
└─────────────┘                            │ - Context Manager     │                        │   (Qwen,      │
                                           │ - Protocol Adapter    │                        │    DeepSeek,  │
                                           └───────────────────────┘                        │    Gemma)     │
                                                       │                                    └───────────────┘
                                                       ▼
                                           ┌───────────────────────┐
                                           │    ZenOS Frontend     │
                                           │  Dashboard & Monitor  │
                                           └───────────────────────┘
```

## 📁 Repository Structure

```
ZenOS/
├── .agentkit/         # AgentKit ownership & kit tracking manifest
├── .claude/           # Claude Code workspace configuration & rules
├── frontend/          # Next.js 14 Management Dashboard & Web UI
├── proxy/             # Express.js Proxy Server (Port 20129)
├── memory/            # Local memory layers (SQLite, Vector, Markdown)
├── plans/             # Architecture specifications & roadmap plans
├── scripts/           # Automation & model management utilities
├── skills/            # Model routing & skill definitions
└── .env.example       # Environment configuration template
```

## 🚀 Quick Start

### 1. Requirements
- macOS (Apple Silicon recommended, M1/M2/M3/M4 Max 64GB+)
- Node.js >= 18.0.0
- LM Studio running with local server enabled at `http://localhost:1234`

### 2. Environment Setup
```bash
cp .env.example .env
source .env
```

### 3. Proxy Server
```bash
cd proxy
npm install
npm start
```

### 4. Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```

### 5. Claude Code Configuration
Set the base URL for Claude Code to point to ZenOS Proxy:
```bash
export ANTHROPIC_BASE_URL="http://localhost:20129"
claude
```

---

## 📜 License
MIT License © 2026 ZenOS Contributors.
