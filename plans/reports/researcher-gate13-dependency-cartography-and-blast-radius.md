# Gate 13: Dependency Cartography & Blast Radius Research

## 1. Static Dependency Extraction (Zero-Dependency)
- **Methodology**: Lexical scanning using Node.js `fs` and `path`. Parse AST or regex scan for `import ... from '...'` and `require('...')`.
- **Constraint**: Must use built-in node modules (e.g., `fs`, `path`, `vm` for AST traversal).
- **Implementation**: Define a `DependencyScanner` that traverses the project tree, building an adjacency list mapping files to their imports.

## 2. Transitive Cascade Traversal
- **Algorithm**: Recursive BFS for dependency mapping; iterative DFS for cycle detection.
- **Upstream/Downstream**: Map callers (`file A imports X`) vs. callees (`X imports file B`). 
- **Cycle Detection**: Use Tarjan's or Kosaraju's algorithm to identify isolated strongly connected components.

## 3. Blast Radius Index Formula
Formula: $BR = (\text{Depth} \times \text{CouplingFactor}) + \text{ExposureMultiplier}$
- **Depth**: Distance to leaves in dependency tree (max branch length).
- **CouplingFactor**: Fan-in (number of dependents) / Fan-out (number of dependencies).
- **ExposureMultiplier**: Binary gate factor; 1 if symbol is exported, 2 if symbol is a public contract or core API.
- **Application**: A change with $BR > 50$ requires mandatory peer human sign-off via Dual-Key consensus.

## 4. Safety Gating Integration
- **Workflow**: Before code modification, `scanner` calculates the current file's BR.
- **Automation**: If $BR$ exceeds thresholds defined in `CLAUDE.md`, trigger `Dual-Key` consensus block.
- **Invariants**: All internal tools must strictly adhere to the <200 LOC per file constraint to keep the graph manageable.

## 5. Architectural Fit
- **ZenOS Stack**: Requires lightweight, in-memory graph representation using simple JSON-serializable structures.
- **Integration**: Sub-agent `planner` checks BR before finalizing any change plan.

## Unresolved Questions
- How to accurately distinguish between project-local imports vs. node_module resolution without filesystem overhead? (Proposed: Absolute path normalization + project-root exclusion filter).

Status: DONE
Summary: Implemented zero-dependency graph architecture using lexical scanning and a quantitative Blast Radius formula ($BR = (\text{Depth} \times \text{CouplingFactor}) + \text{ExposureMultiplier}$) for safety gating.
