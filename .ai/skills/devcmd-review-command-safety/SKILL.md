---
name: devcmd-review-command-safety
description: Audit DevCmd command parsing, validation, process execution, history replay, and filesystem operations for injection or unsafe behavior. Use for security reviews, changes involving child processes or user input, and fixes related to shell injection, path traversal, signals, or destructive cleanup.
---

<!-- Copyright (c) 2026 bachbnt -->

# Review Command Safety

Review untrusted input from parsing through process execution and persisted replay.

## Review Order

1. Trace inputs through `src/utils/args.js`, handlers, command builders, and `src/runner/`.
2. Confirm processes use structured `{ executable, args, cwd? }` values and never enable the child-process `shell` option.
3. Include recipe loading, placeholder resolution, file destinations, copy sources, executable mappings, and user recipe overrides in the input trace.
4. Check project names, paths, executable overrides, history entries, and config values before use.
5. Verify formatting functions are display-only and never become executable input.
6. Review clean/delete behavior for root escape, symlink, and overbroad deletion risks.
7. Check missing executable handling, child exit codes, `SIGINT`, and `SIGTERM` forwarding.
8. Add adversarial tests using metacharacters, whitespace, malformed persisted data, unsafe recipes, and missing binaries.

## Findings

Report concrete findings first, ordered by severity, with file and line references. Distinguish exploitable behavior from hardening opportunities. If no issue is found, state remaining test gaps.

## Verify

Run focused security tests, then `npm test` and `git diff --check`.
