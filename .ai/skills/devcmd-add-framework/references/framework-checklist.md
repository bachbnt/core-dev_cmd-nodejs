<!-- Copyright (c) 2026 bachbnt -->

# Framework Integration Checklist

## Source Map

- `src/config/index.js`: framework name, description, and capabilities.
- `src/commands/frameworks.js`: executable, arguments, Git initialization, and requirements.
- `src/handlers/scaffold.js`: config defaults and interactive prompts driven by capabilities.
- `src/utils/args.js`: shared option parsing and capability validation.
- `src/commands/completion.js`: derives framework commands from configuration.
- `src/runner/command.js`: structured process representation and display formatting.
- `test/frameworks.test.js`: exact command arrays and framework behavior.
- `test/args.test.js`: supported and rejected options.
- `test/config-projects-completion.test.js`: completion and config defaults.
- `README.md`: framework table, examples, defaults, and caveats.

## Design Questions

Answer these before editing:

1. Is the generator maintained by the framework team?
2. Is it interactive by default, and which flags make it deterministic?
3. Which package managers are officially supported?
4. Can dependency installation and Git initialization be disabled?
5. Does the framework support TypeScript, JavaScript, ESLint, or a Python executable choice?
6. Which executables must `dev doctor` or preflight validation require?
7. Does the generated project need lifecycle detection or a new project adapter?

## Verification

Run:

```bash
npm test
dev <framework> example-app --dry-run
git diff --check
```

Confirm the dry-run output contains no shell operators or interpolated command string.
