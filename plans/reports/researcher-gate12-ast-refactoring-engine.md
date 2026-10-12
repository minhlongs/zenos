# Research Report: Gate 12 AST-Guided Code Refactoring Engine

## 1. Zero-Dependency Code Analysis (Native Node.js)
Parsing JS/TS without npm requires a hand-rolled recursive descent parser or state machine lexer. 
- **Lexer**: Tokenizes source based on regex-based patterns (identifiers, keywords, strings, literals, delimiters).
- **Parser**: Identifies nodes (FunctionDeclaration, ClassDeclaration, ExpressionStatement, ImportDeclaration).
- **Symbol Table**: Tracks scope, imports, and exports via recursive tree traversal (visitor pattern).

## 2. Semantic Slicing Engine
- **Cohesion Metric**: Function call graphs (FCN) and dependency distance.
- **Extraction Protocol**: Move nodes to new files, derive export signatures, and establish barrel exports (`index.ts`) for consumers.
- **Constraint**: Strict < 200 LOC per file drives aggressive helper extraction and module flattening.

## 3. Contract Preservation & Rewiring
- **Export Facade**: Generate barrel files `export * from './sub-module'` to avoid breaking existing import paths.
- **Import Rewiring**: Walk the AST of dependent files; replace module specifiers with aliased relative paths (e.g., `@/seed/mod/sub` -> `../sub`).
- **Safety**: Verify symbols exist in the new location using the metadata collected during analysis.

## 4. Transformation Pipeline (Autonomous)
1. **Analyze**: Parse tree, construct dependency graph, tag targets > 250 LOC.
2. **Plan**: Identify modular boundaries (e.g., separating controller logic from data access).
3. **Decompose**: Copy/paste segments, strip unreachable state.
4. **Rewire**: Update internal references.
5. **Verify**: Run `npm test` inside `ProcessJail` (Gate 8).

## 5. Edge Cases
- **Circular Deps**: Detect via graph coloring; utilize delayed resolution or refactor shared logic into a common/utils layer.
- **Lexical Closures**: Hoisting closures into shared state interfaces or passing state explicitly (closure-lifting).
- **Dynamic Imports**: Flag as out-of-scope for autonomous migration; require human review.

Status: DONE
Summary: Gate 12 leverages native recursive-descent parsing to enforce < 200 LOC modules, utilizing barrel exports and automated refactoring loops within the established ProcessJail harness.
