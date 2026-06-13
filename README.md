# DevCmd

DevCmd is an interactive development CLI for scaffolding projects and managing Android emulators and iOS simulators.

## Features

- Scaffold JavaScript, mobile, and Python web projects with framework-appropriate defaults.
- Pass project or device targets directly, or use interactive prompts.
- Preview commands with `--dry-run`.
- Select TypeScript/JavaScript, package manager, Git, and ESLint where supported.
- Inspect device runtime and boot status.
- Cold boot Android emulators and shut down all iOS simulators.
- View command history and repeat the latest successful command.

## Requirements

- Node.js 20.19 or newer is recommended for current Vite and Vue tooling.
- Android Studio and the `emulator`/`adb` commands for Android features.
- Xcode and `xcrun simctl` for iOS features.
- The SDK or CLI required by the framework you want to scaffold.

## Installation

```bash
npm install
chmod +x dev
npm link
```

Or run the reusable setup script:

```bash
./scripts/setup-dev.sh
# or
npm run setup
```

The setup creates an npm symlink from the active Node.js installation to this repository. Run it once; later source changes are used automatically the next time `dev` runs, without `source ~/.zshrc` or relinking. When switching to a different Node.js version with NVM, run the setup script once for that Node.js version.

## Usage

```bash
dev <command> [target] [options]
```

Interactive project creation:

```bash
dev next
```

Direct, non-interactive project creation:

```bash
dev react my-app --typescript --pnpm --git
dev next my-app --typescript --npm --eslint
dev nuxt my-app --pnpm --git
dev vue my-app --javascript --yarn --no-eslint
dev django my-app
dev fastapi my-api
dev flask my-app
```

Preview without executing:

```bash
dev flutter demo --dry-run
```

## Framework Commands

| Command | Scaffolder |
| --- | --- |
| `flutter` | `flutter create` |
| `react` | Vite React template for apps built from scratch |
| `react_native` | Expo via `create-expo-app` (recommended) |
| `react_native_bare` | React Native Community CLI without a framework |
| `next` | `create-next-app` |
| `nuxt` | Official `create-nuxt` minimal starter |
| `vue` | Official `create-vue` |
| `express` | Official `express-generator` |
| `nest` | Nest CLI |
| `django` | Official Django `startproject` inside a local virtual environment |
| `fastapi` | Minimal FastAPI package with tests and `pyproject.toml` |
| `flask` | Flask application factory with tests and `pyproject.toml` |

Direct targets use recommended defaults: TypeScript, npm, Git, and ESLint where the selected scaffolder supports them. Run a framework command without a target to configure supported presets interactively.

React recommends using a framework for new production applications. Use `dev next` for a full-stack React framework, or `dev react` when a client-side Vite application is the right fit. React Native recommends a framework, so `dev react_native` uses Expo; use `dev react_native_bare` only when framework constraints do not fit the project.

Nuxt is the full-stack Vue option. Nuxt has built-in TypeScript support, so `dev nuxt` exposes package manager and Git choices without a redundant TypeScript/JavaScript flag.

Python projects create a local `.venv`, install their declared dependencies, and include development instructions in the generated README. Django uses the official project generator; FastAPI and Flask use small DevCmd templates based on their official recommended layouts.

```bash
dev django my-app
dev fastapi my-api --no-git
dev flask my-app
```

```bash
dev react web-app --typescript --pnpm
dev react_native mobile-app --typescript --pnpm
dev react_native_bare NativeApp --bun
```

## Device Commands

```bash
dev devices
dev android Pixel_9_Pro_Fold
dev android Pixel_9_Pro_Fold --cold-boot
dev ios "iPhone 17 Pro"
dev ios --shutdown-all
```

`dev devices` shows device name, runtime, and `Booted`/`Shutdown` status.

## History

```bash
dev history
dev again
dev again --dry-run
```

The latest 50 successful commands are stored in `~/.devcmd/history.json`.

History entries store executables and argument arrays instead of shell command strings. Compatible older entries are rebuilt from their saved metadata before `dev again` runs them.

## Options

```text
--dry-run
--typescript, --ts
--javascript, --js
--package-manager <npm|pnpm|yarn|bun>
--npm, --pnpm, --yarn, --bun
--git, --no-git
--eslint, --no-eslint
--cold-boot
--shutdown-all
```

## Development

DevCmd does not execute generated commands through a shell. Every executable and argument is passed separately to Node.js `spawn`, and multi-step operations such as scaffolding followed by `git init` run as separate processes.

```text
dev                 CLI entry point
src/cli.js          Prompt and command orchestration
src/commands/       Framework, device, and history commands
src/config/         Branding, version, and supported frameworks
src/devices/        Android and iOS discovery
src/runner/         Command formatting and process execution
src/utils/          Argument parsing and validation
test/               Node.js unit tests
```

Run the test suite with:

```bash
npm test
```

`SIGINT` and `SIGTERM` are forwarded to the active child process. DevCmd preserves child exit codes, uses `127` for missing executables, and uses conventional signal exit codes such as `130` for `SIGINT`.
