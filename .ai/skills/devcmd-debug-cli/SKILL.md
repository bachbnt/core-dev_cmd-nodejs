---
name: devcmd-debug-cli
description: Diagnose and fix DevCmd CLI failures. Use when commands exit unexpectedly, project detection is wrong, an executable is missing, options are rejected incorrectly, child processes hang, history replay fails, or behavior differs between direct execution and global installation.
---

<!-- Copyright (c) 2026 bachbnt -->

# Debug The CLI

Reproduce the smallest failing path, locate the owning layer, fix it, and protect the behavior with a regression test.

## Workflow

1. Capture the exact command, working directory, output, exit code, platform, Node version, and installed tool versions.
2. Reproduce with `--dry-run`, `dev inspect`, or a temporary project before invoking expensive scaffolders.
3. Classify the failure as parsing, validation, detection, adapter resolution, prerequisite checking, process execution, persistence, or packaging.
4. Read only the owning handler and its shared dependencies before editing.
5. Add a focused failing test, implement the smallest correction, then run related and full tests.
6. Verify both `./dev` and the linked or packaged binary when installation behavior is involved.

## Diagnostic Commands

Use `dev doctor`, `dev inspect`, `command -v <tool>`, `node --version`, `npm --version`, and `npm pack --dry-run` as appropriate. Inspect structured executable and argument arrays instead of copying formatted display strings into a shell.

## Completion Criteria

Explain the root cause, preserve the original exit semantics, add regression coverage, and state any environment dependency that cannot be tested locally.
