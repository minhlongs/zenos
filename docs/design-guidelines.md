# ZenOS Design Guidelines & UI Standards

## 1. Visual Theme & Philosophy
- **Aesthetic**: Modern Cyber-Minimalist Dark Mode engineered for developer focus.
- **Background Palette**:
  - Deep Surface: `#020617` (slate-950)
  - Card / Panel Surface: `#0f172a` (slate-900)
  - Elevated Border: `#1e293b` (slate-800)
  - Subtle Border: `#334155` (slate-700)
- **Accent & Status Palette**:
  - Primary Action / Local Route: `#10b981` (emerald-500) & `#064e3b` (emerald-950)
  - Frontier Cloud Route / Complexity: `#8b5cf6` (violet-500) & `#2e1065` (violet-950)
  - Warning / LOC Threshold: `#f59e0b` (amber-500) & `#451a03` (amber-950)
  - Danger / Circuit Breaker / Rejected: `#ef4444` (red-500) & `#450a0a` (red-950)
  - Interactive Accent / Blue: `#38bdf8` (sky-400) & `#0369a1` (sky-700)

## 2. Typography & Hierarchy
- **Primary Font**: `Inter`, system-ui, -apple-system, sans-serif
- **Code / Monospace**: `JetBrains Mono`, `Fira Code`, `ui-monospace`, monospace
- **Scale**:
  - Page Titles: `text-2xl font-bold tracking-tight`
  - Section Headers: `text-lg font-semibold text-slate-200`
  - Body & Labels: `text-sm text-slate-300`
  - Metadata & Badges: `text-xs font-medium`

## 3. Component Design System
- **Cards**: `bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm`
- **Pills / Badges**: `px-2.5 py-0.5 rounded-full text-xs font-medium border`
- **Buttons**:
  - Primary: `bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md`
  - Secondary: `bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-700`
  - Destructive: `bg-red-950 hover:bg-red-900 text-red-300 text-xs font-semibold px-3 py-1.5 rounded-md border border-red-800`
- **Console / Log View**: `bg-slate-950 border border-slate-800 rounded-md p-4 font-mono text-xs text-slate-300`
