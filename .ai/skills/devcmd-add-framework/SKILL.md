---
name: devcmd-add-framework
description: Add or update framework scaffold support in DevCmd end to end. Use when introducing a framework command, changing an existing scaffolder, adding framework-specific options, or reviewing whether framework commands follow current official best practices.
---

<!-- Copyright (c) 2026 bachbnt -->

# Add A DevCmd Framework

Implement framework support across the complete CLI surface while preserving DevCmd's process safety and existing conventions.

## Workflow

1. Inspect `src/recipes/built-ins.json`, `src/recipes/`, `src/handlers/scaffold.js`, argument validation, completion, tests, and README.
2. Check current official framework documentation before choosing a scaffolder or flags. Prefer an official, maintained, non-deprecated generator.
3. Decide whether the request belongs in DevCmd as a built-in recipe or can be delivered as a user recipe under `~/.devcmd/recipes`; do not edit core source for a user-only recipe.
4. Determine whether generation is interactive, which flags make it deterministic, supported package managers, language choices, Git behavior, install skipping, and required executables.
5. For a built-in, define the recipe description, capabilities, requirements, scaffold actions, detection rules, and lifecycle adapter or actions in `src/recipes/built-ins.json`.
6. Express every process as a structured recipe `run` action. Keep executable and arguments separate.
7. Update validation, config defaults, interactive prompts, requirements, help, completion, and README where applicable.
8. Add focused tests for exact executable and argument arrays, supported and rejected options, requirements, and completion visibility.
9. Determine whether generated projects also require new detection or lifecycle adapter support.

## Guardrails

- Follow the existing built-in recipe schema and resolver patterns before adding new engine features.
- Do not add a framework-specific branch to CLI handlers when the recipe schema can represent it.
- Do not execute a real scaffold during tests.
- Preserve user changes and avoid unrelated refactors.
- Keep project names validated before they reach a child process.
- Never introduce `shell: true`, command chaining, or interpolated shell strings.
- Add `// Copyright (c) 2026 bachbnt` at the beginning of new JavaScript files.
- Report any difference between the official recommendation and DevCmd's chosen behavior.

## Verify

Run `npm test`, `dev <framework> example-app --dry-run`, and `git diff --check`. Confirm the framework appears in help and completion, rejects unsupported options, produces a safe command sequence, has tests, and is documented.
