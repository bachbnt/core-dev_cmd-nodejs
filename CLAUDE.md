<!-- Copyright (c) 2026 bachbnt -->

# DevCmd Claude Code Instructions

## Project

DevCmd is a CommonJS Node.js CLI. It scaffolds projects and runs development lifecycle commands through structured child-process definitions.

## Engineering Rules

- Read the relevant implementation and tests before editing.
- Keep process execution as `{ executable, args, cwd? }`; never enable a shell or concatenate user input into command strings.
- Use `src/config/index.js` as the source of framework capabilities and `package.json` as the source of the CLI version.
- Follow existing handlers, project adapters, and runner APIs instead of adding parallel execution paths.
- Add `// Copyright (c) 2026 bachbnt` at the beginning of new JavaScript files.
- Keep changes scoped and preserve unrelated working-tree changes.
- Update tests and README for user-visible behavior.

## Verification

Run `npm test` and `git diff --check`. For CLI behavior, also run a representative command with `--dry-run` or use a temporary project fixture.

## Skills

Reusable AI skills live in `.ai/skills`. Claude Code discovers the same canonical skills through the `.claude/skills` symlink.
