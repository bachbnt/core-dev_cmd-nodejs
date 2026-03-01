# DEV CLI v2.0.0

A supercharged, interactive Command Line Interface for rapidly scaffolding new projects and booting up emulators/simulators. Built with `@clack/prompts` and Node.js.

## Features

- **Interactive UI**: Beautiful prompts, drop-downs, and colors for a great developer experience.
- **Dynamic Device Fetching**: Automatically detects available Android Emulators (`emulator -list-avds`) and iOS Simulators (`xcrun simctl list devices`).
- **Standardized Setup**: Pre-configured setup commands for popular frameworks like Flutter, React, Next.js, Vue, Express, and NestJS.
- **Zero Configuration**: Ready to use right out of the box. Just pick a command and follow the prompts.

## Prerequisites

- Node.js (`v24.13.0` or higher recommended). A `.nvmrc` is included.
- For Android: Android Studio & `emulator` CLI configured in your PATH.
- For iOS: Xcode & `xcrun simctl` configured.

## Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Make the Script Executable:**
   ```bash
   chmod +x dev
   ```
3. **Add to your PATH (Zsh/Mac example):**
   - Find your current dictionary absolute path using `pwd`.
   - Open your profile configuration:
     ```bash
     nano ~/.zshrc # Or ~/.zprofile
     ```
   - Add the following line, replacing `/path/to/directory` with your absolute path:
     ```bash
     export PATH="$PATH:/path/to/directory"
     ```
   - Reload your terminal configuration:
     ```bash
     source ~/.zshrc # Or ~/.zprofile
     ```

## Usage

You no longer need to pass the project name or device name immediately. The CLI is fully interactive!

```bash
dev <command>
```

### Examples

- **See all available commands:**
  ```bash
  dev help
  ```
- **Create a new Next.js project:**
  ```bash
  dev next
  # It will then prompt: "What is your project name?"
  ```
- **Boot an iOS Simulator:**
  ```bash
  dev ios
  # It will then prompt a searchable dropdown list of available iOS simulators on your machine.
  ```

### Supported Frameworks

- `flutter`: `flutter create <project-name>`
- `react`: `npx create-next-app@latest <project-name>`
- `react_native`: `npx react-native@latest init <project-name>`
- `next`: `npx create-next-app@latest <project-name>`
- `vue`: `npm create vue@latest <project-name>`
- `express`: `npx express-generator-typescript <project-name>`
- `nest`: `nest new <project-name>`

### Supported Devices

- `android`: `emulator -avd <device-name>`
- `ios`: `open -a Simulator && xcrun simctl boot '<device-name>'`
