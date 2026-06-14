---
name: devcmd-add-lifecycle-adapter
description: Add or update DevCmd project detection and lifecycle behavior. Use when supporting a new project type, changing install/run/test/build/check/clean/open resolution, or fixing inconsistencies between project inspection and command execution.
---

<!-- Copyright (c) 2026 bachbnt -->

# Add A Lifecycle Adapter

Implement detection and lifecycle actions through the shared project adapter architecture.

## Workflow

1. Inspect `src/recipes/schema.js`, `src/recipes/engine.js`, `src/openers/`, `src/projects/detect.js`, `src/projects/adapters/`, inspection, and lifecycle tests.
2. Prefer recipe detection rules and lifecycle actions for custom project types; use a named adapter only for shared behavior that cannot remain declarative.
3. Resolve declarative recipe actions through the recipe engine and named adapter actions through the shared adapter registry; both must produce `{ executable, args, cwd? }` commands.
4. Return an explicit unsupported reason for unavailable actions instead of inventing a fallback.
5. Register the adapter once so inspect and execution resolve through the same implementation.
6. Add fixtures covering detection from both the project root and a child directory.
7. Test every supported action and at least one unsupported action.
8. When changing `dev open`, use the opener registry for IDE selection and preserve recipe-defined open actions unless the user selects an explicit opener.

## Guardrails

- Prefer project-local tools and virtual environments.
- Never use shell command strings or `shell: true`.
- Avoid false-positive detection from nested mobile directories.
- Keep clean operations restricted to known generated paths.
- Update README when lifecycle behavior becomes user-visible.

## Verify

Run `npm test`, `dev inspect <fixture>`, a representative lifecycle dry run, and `git diff --check`.
