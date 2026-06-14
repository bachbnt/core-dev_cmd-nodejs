---
name: devcmd-add-lifecycle-adapter
description: Add or update DevCmd project detection and lifecycle behavior. Use when supporting a new project type, changing install/run/test/build/check/clean/open resolution, or fixing inconsistencies between project inspection and command execution.
---

<!-- Copyright (c) 2026 bachbnt -->

# Add A Lifecycle Adapter

Implement detection and lifecycle actions through the shared project adapter architecture.

## Workflow

1. Inspect `src/projects/detect.js`, `src/projects/adapters/`, `src/commands/inspect.js`, and lifecycle tests.
2. Define reliable marker files, root selection, framework identity, and package-manager detection.
3. Add an adapter that resolves supported actions to `{ executable, args, cwd? }` commands.
4. Return an explicit unsupported reason for unavailable actions instead of inventing a fallback.
5. Register the adapter once so inspect and execution resolve through the same implementation.
6. Add fixtures covering detection from both the project root and a child directory.
7. Test every supported action and at least one unsupported action.

## Guardrails

- Prefer project-local tools and virtual environments.
- Never use shell command strings or `shell: true`.
- Avoid false-positive detection from nested mobile directories.
- Keep clean operations restricted to known generated paths.
- Update README when lifecycle behavior becomes user-visible.

## Verify

Run `npm test`, `dev inspect <fixture>`, a representative lifecycle dry run, and `git diff --check`.
