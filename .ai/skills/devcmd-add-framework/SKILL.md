---
name: devcmd-add-framework
description: Add or update framework scaffold support in DevCmd end to end. Use when introducing a framework command, changing an existing scaffolder, adding framework-specific options, or reviewing whether framework commands follow current official best practices.
---

<!-- Copyright (c) 2026 bachbnt -->

# Add A DevCmd Framework

Implement framework support across the complete CLI surface while preserving DevCmd's process safety and existing conventions.

## Workflow

1. Read `references/framework-checklist.md` and inspect the files it names.
2. Check the framework's current official documentation before choosing a scaffolder or flags. Prefer an official, non-deprecated project generator.
3. Define the command name, defaults, supported capabilities, required executables, and `--no-install` behavior.
4. Build every process with `createCommand(executable, args)`. Keep executable and arguments separate; never introduce `shell: true` or shell command strings.
5. Update configuration, command construction, validation, interactive prompts, help, completion, and README where applicable.
6. Add focused tests for the exact executable and argument array, option validation, requirements, and completion visibility.
7. Run `npm test`, `git diff --check`, and at least one representative `dev <framework> <target> --dry-run` command.

## Guardrails

- Follow the existing framework definitions and command-builder patterns before adding abstractions.
- Do not execute a real scaffold during tests.
- Preserve user changes and avoid unrelated refactors.
- Keep project names validated before they reach a child process.
- Add `// Copyright (c) 2026 bachbnt` at the beginning of new JavaScript files.
- Report any difference between the official recommendation and DevCmd's chosen behavior.

## Completion Criteria

Finish only when the framework appears in help and completion, rejects unsupported options, produces a safe command sequence, has tests, and is documented.
