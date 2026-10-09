# Research Report: Gate 7 Frontend Visual Factory Dashboard

## 1. Objectives
Research the implementation of a visual dashboard for ZenOS Factory workflows, integrating real-time telemetry from SSE streams and providing control interfaces for state management.

## 2. Technical Strategy

### SSE Streaming (Next.js 14)
- **Problem**: Re-render cascades from frequent SSE updates.
- **Solution**: 
    - Use a dedicated React Context or Zustand store for global telemetry state.
    - Implement custom hooks using `useEffect` with `EventSource` and `useSyncExternalStore` for optimized reconciliation.
    - Component-level memoization (`React.memo`) to prevent parent propagation of child telemetry updates.

### Frontend Component Architecture
- **Zen Planning Studio**: Gauge chart (Radix UI + Tailwind), route-pill status toggles.
- **Cook TDD Console**: Xterm-like terminal emulator (xterm.js optional, or lightweight CSS grid-based log buffer).
- **Goal Milestone Manager**: Stateful xstate-like machine rendering a CSS grid progress tracker linked to the `/v1/factory` endpoints.

### Dashboard Extension (proxy/src/dashboard-html.js)
- Extend the embedded dashboard to support modular injection of control components while keeping the total payload well under 200 LOC per file in the proxy layer.

## 3. Trade-off Matrix

| Criterion | Next.js Frontend | Embedded Dashboard |
| :--- | :--- | :--- |
| **Complexity** | High (build, routing, hydration) | Ultra-low (js import, one file) |
| **Performance** | High (interactive richness) | High (minimal CPU/DOM) |
| **Maintenance** | Medium (bundle management) | Very Low (static JS) |
| **Architectural Fit** | Integrated with user portal | Diagnostic & rescue tool |

## 4. Adoption Risk
- **Stability**: SSE connections may jitter; need to implement robust reconnection logic in JS (`Exponential backoff`).
- **Complexity**: Avoid over-engineering the terminal if standard logs suffice. The system is YAGNI heavy.

## 5. Architectural Fit
- Leverage existing `/v1/factory` routes.
- Extend `dashboard-html.js` for lightweight infrastructure observability and use Next.js for the core management interface.

## 6. Recommendations
1. **Prioritize** the UI dashboard for high-level management (interactive controls).
2. **Reuse** the backend telemetry events for both interfaces to preserve symmetry.
3. **Keep** embedded dashboard as the "first-responder" view when the main frontend is unreachable.

## 7. Limitations
- Research did not evaluate third-party charting libraries; standard CSS/SVG representations were preferred to minimize bloat.

Status: DONE
Summary: The dashboard research confirms a hybrid approach: Next.js for end-user workflow management and a lean, embedded dashboard in the proxy for operational rescue, utilizing shared telemetry SSE streams and robust state-synchronization patterns.
