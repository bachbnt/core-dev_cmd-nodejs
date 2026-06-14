---
name: devcmd-review-command-safety
description: Audit DevCmd command parsing, validation, process execution, history replay, and filesystem operations for injection or unsafe behavior. Use for security reviews, changes involving child processes or user input, and fixes related to shell injection, path traversal, signals, or destructive cleanup.
---

<!-- Copyright (c) 2026 bachbnt -->

# Review Command Safety

Review untrusted input from parsing through process execution and persisted replay.

## Review Order

1. Trace inputs through `src/utils/args.js`, handlers, command builders, and `src/runner/`.
2. Confirm processes use structured `{ executable, args, cwd? }` values and `shell: false`.
3. Check project names, paths, executable overrides, history entries, and config values before use.
4. Verify formatting functions are display-only and never become executable input.
5. Review clean/delete behavior for root escape, symlink, and overbroad deletion risks.
6. Check missing executable handling, child exit codes, `SIGINT`, and `SIGTERM` forwarding.
7. Add adversarial tests using metacharacters, whitespace, malformed persisted data, and missing binaries.

## Findings

Report concrete findings first, ordered by severity, with file and line references. Distinguish exploitable behavior from hardening opportunities. If no issue is found, state remaining test gaps.

## Verify

Run focused security tests, then `npm test` and `git diff --check`.
