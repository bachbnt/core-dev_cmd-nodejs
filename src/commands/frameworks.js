// Copyright (c) 2026 bachbnt

const path = require('path');
const { createCommand } = require('../runner/command');

const PYTHON_EXECUTABLE = process.platform === 'win32' ? 'python' : 'python3';
const VENV_PYTHON = process.platform === 'win32'
  ? path.join('.venv', 'Scripts', 'python.exe')
  : path.join('.venv', 'bin', 'python');

function packageCommand(packageManager, tool, target, toolArgs = []) {
  if (tool === 'vite') {
    if (packageManager === 'npm') return createCommand('npm', ['create', 'vite@latest', target, '--', ...toolArgs]);
    if (packageManager === 'pnpm') return createCommand('pnpm', ['create', 'vite', target, ...toolArgs]);
    if (packageManager === 'yarn') return createCommand('yarn', ['create', 'vite', target, ...toolArgs]);
    return createCommand('bun', ['create', 'vite', target, ...toolArgs]);
  }

  if (tool === 'next') {
    if (packageManager === 'npm') return createCommand('npx', ['create-next-app@latest', target, ...toolArgs]);
    if (packageManager === 'pnpm') return createCommand('pnpm', ['create', 'next-app@latest', target, ...toolArgs]);
    if (packageManager === 'yarn') return createCommand('yarn', ['create', 'next-app', target, ...toolArgs]);
    return createCommand('bunx', ['create-next-app@latest', target, ...toolArgs]);
  }

  if (tool === 'expo') {
    if (packageManager === 'npm') return createCommand('npx', ['create-expo-app@latest', target, ...toolArgs]);
    if (packageManager === 'pnpm') return createCommand('pnpm', ['create', 'expo-app', target, ...toolArgs]);
    if (packageManager === 'yarn') return createCommand('yarn', ['create', 'expo-app', target, ...toolArgs]);
    return createCommand('bun', ['create', 'expo-app', target, ...toolArgs]);
  }

  if (tool === 'nuxt') {
    if (packageManager === 'npm') return createCommand('npm', ['create', 'nuxt@latest', target, '--', ...toolArgs]);
    if (packageManager === 'pnpm') return createCommand('pnpm', ['create', 'nuxt@latest', target, ...toolArgs]);
    if (packageManager === 'yarn') return createCommand('yarn', ['create', 'nuxt', target, ...toolArgs]);
    return createCommand('bun', ['create', 'nuxt@latest', target, ...toolArgs]);
  }

  if (tool === 'vue') {
    if (packageManager === 'npm') return createCommand('npm', ['create', 'vue@latest', target, '--', ...toolArgs]);
    if (packageManager === 'pnpm') return createCommand('pnpm', ['create', 'vue@latest', target, ...toolArgs]);
    if (packageManager === 'yarn') return createCommand('yarn', ['create', 'vue@latest', target, ...toolArgs]);
    return createCommand('bun', ['create', 'vue@latest', target, ...toolArgs]);
  }

  throw new Error(`Unsupported package tool: ${tool}`);
}

function withGit(commands, target, enabled) {
  return enabled ? [...commands, createCommand('git', ['-C', target, 'init'])] : commands;
}

function buildPythonCommands(framework, target, options) {
  const generator = path.join(__dirname, '..', 'generators', 'python-project.js');
  const git = options.git !== false;
  const pythonExecutable = options.python || PYTHON_EXECUTABLE;
  const projectPython = path.join(target, VENV_PYTHON);
  const commands = [createCommand('node', [generator, framework, target])];

  if (options.noInstall) return withGit(commands, target, git);

  commands.push(
    createCommand(pythonExecutable, ['-m', 'venv', path.join(target, '.venv')]),
    createCommand(projectPython, ['-m', 'pip', 'install', '-e', `${target}[dev]`])
  );

  if (framework === 'django') {
    commands.push(
      createCommand(projectPython, [
        '-m',
        'django',
        'startproject',
        'config',
        target,
      ])
    );
  }

  return withGit(commands, target, git);
}

function buildFrameworkCommands(command, target, options = {}) {
  const packageManager = options.packageManager || 'npm';
  const typescript = options.typescript !== false;
  const git = options.git !== false;
  const eslint = options.eslint !== false;

  if (command === 'flutter') {
    const args = ['create', target];
    if (options.noInstall) args.push('--no-pub');
    return withGit([createCommand('flutter', args)], target, git);
  }

  if (command === 'react') {
    const template = typescript ? 'react-ts' : 'react';
    return withGit(
      [packageCommand(packageManager, 'vite', target, ['--template', template, '--no-interactive'])],
      target,
      git
    );
  }

  if (command === 'react_native') {
    const template = typescript ? 'default' : 'blank';
    const args = ['--template', template, '--yes'];
    if (options.noInstall) args.push('--no-install');
    return withGit(
      [packageCommand(packageManager, 'expo', target, args)],
      target,
      git
    );
  }

  if (command === 'react_native_bare') {
    const args = ['@react-native-community/cli@latest', 'init', target, '--pm', packageManager];
    if (!git) args.push('--skip-git-init');
    if (options.noInstall) args.push('--skip-install');
    return [createCommand('npx', args)];
  }

  if (command === 'next') {
    const args = [
      typescript ? '--ts' : '--js',
      eslint ? '--eslint' : '--no-linter',
      `--use-${packageManager}`,
    ];
    if (!git) args.push('--disable-git');
    if (options.noInstall) args.push('--skip-install');
    args.push('--yes');
    return [packageCommand(packageManager, 'next', target, args)];
  }

  if (command === 'nuxt') {
    const args = [
      '--template',
      'minimal',
      '--packageManager',
      packageManager,
      '--gitInit=false',
      '--modules=',
    ];
    if (options.noInstall) args.push('--no-install');
    return withGit([packageCommand(packageManager, 'nuxt', target, args)], target, git);
  }

  if (command === 'vue') {
    const args = [];
    if (typescript) args.push('--typescript');
    if (eslint) args.push('--eslint');
    if (args.length === 0) args.push('--default');
    return withGit([packageCommand(packageManager, 'vue', target, args)], target, git);
  }

  if (command === 'express') {
    return withGit(
      [createCommand('npx', ['express-generator@latest', target, '--no-view'])],
      target,
      git
    );
  }

  if (command === 'nest') {
    const args = [
      '@nestjs/cli@latest',
      'new',
      target,
      '--package-manager',
      packageManager,
      '--language',
      typescript ? 'TypeScript' : 'JavaScript',
    ];
    if (!git) args.push('--skip-git');
    if (options.noInstall) args.push('--skip-install');
    return [createCommand('npx', args)];
  }

  if (['django', 'fastapi', 'flask'].includes(command)) {
    return buildPythonCommands(command, target, options);
  }

  throw new Error(`Unsupported framework: ${command}`);
}

function getFrameworkRequirements(command, options = {}) {
  const requirements = ['node'];
  const packageManager = options.packageManager || 'npm';

  if (command === 'flutter') requirements.push('flutter');
  else if (['react', 'next', 'nuxt', 'vue', 'react_native'].includes(command)) {
    requirements.push(packageManager === 'npm' ? (command === 'next' || command === 'react_native' ? 'npx' : 'npm') : packageManager);
  } else if (['react_native_bare', 'express', 'nest'].includes(command)) {
    requirements.push('npx');
  } else if (['django', 'fastapi', 'flask'].includes(command) && !options.noInstall) {
    requirements.push(options.python || PYTHON_EXECUTABLE);
  }

  if (options.git !== false) requirements.push('git');
  return requirements;
}

module.exports = {
  buildFrameworkCommands,
  buildPythonCommands,
  getFrameworkRequirements,
  packageCommand,
};
