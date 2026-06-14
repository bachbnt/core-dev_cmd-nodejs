---
name: devcmd-add-device-provider
description: Add or update device discovery and control in DevCmd. Use when extending Android emulators, iOS simulators, device status parsing, boot or shutdown commands, runtime display, or introducing another local device platform.
---

<!-- Copyright (c) 2026 bachbnt -->

# Add A Device Provider

Keep discovery, parsing, selection, and control separate so provider output remains testable without real devices.

## Workflow

1. Inspect `src/devices/`, `src/commands/devices.js`, `src/handlers/devices.js`, and `test/devices.test.js`.
2. Check current official platform CLI documentation before selecting commands or parsing formats.
3. Implement pure parsers for captured command output before wiring process execution.
4. Represent boot, shutdown, and management operations as structured commands.
5. Expose stable labels, identifiers, runtime versions, availability, and running state.
6. Handle missing SDK tools, no installed devices, unavailable runtimes, and already-running devices clearly.
7. Update help, completion, doctor checks, tests, and README when the command surface changes.

## Guardrails

- Do not require a shell or command chaining.
- Never choose devices by ambiguous display text when a stable identifier exists.
- Keep platform-specific behavior behind the provider module.
- Mock command output in tests; do not boot a real emulator or simulator.

## Verify

Run parser/provider tests, `npm test`, a read-only device listing command where available, and `git diff --check`.
