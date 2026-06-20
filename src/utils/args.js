// Copyright (c) 2026 bachbnt

const { PACKAGE_MANAGERS, frameworkDefinitions } = require('../config');

function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift();
  const options = {
    dryRun: false,
    coldBoot: false,
    shutdownAll: false,
    target: undefined,
    typescript: undefined,
    packageManager: undefined,
    git: undefined,
    eslint: undefined,
    noInstall: false,
    python: undefined,
    editor: undefined,
    opener: undefined,
    list: false,
    values: {},
  };
  const positionals = [];

  while (args.length > 0) {
    const arg = args.shift();

    if (!arg.startsWith('-')) {
      positionals.push(arg);
      if (!options.target) options.target = arg;
      continue;
    }

    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--cold-boot') options.coldBoot = true;
    else if (arg === '--shutdown-all') options.shutdownAll = true;
    else if (arg === '--list') options.list = true;
    else if (arg === '--typescript' || arg === '--ts') options.typescript = true;
    else if (arg === '--javascript' || arg === '--js') options.typescript = false;
    else if (arg === '--git') options.git = true;
    else if (arg === '--no-git') options.git = false;
    else if (arg === '--eslint') options.eslint = true;
    else if (arg === '--no-eslint') options.eslint = false;
    else if (arg === '--no-install') options.noInstall = true;
    else if (arg === '--install') options.noInstall = false;
    else if (arg === '--python') {
      options.python = args.shift();
      if (!options.python || options.python.startsWith('-')) {
        throw new Error('--python requires an executable name or path.');
      }
    } else if (arg === '--editor') {
      options.editor = args.shift();
      if (!options.editor || options.editor.startsWith('-')) {
        throw new Error('--editor requires an application or executable name.');
      }
    } else if (arg === '--with') {
      options.opener = args.shift();
      if (!options.opener || options.opener.startsWith('-')) {
        throw new Error('--with requires an opener name.');
      }
    } else if (arg === '--set') {
      const assignment = args.shift();
      const separator = assignment?.indexOf('=') ?? -1;
      if (separator < 1) throw new Error('--set requires name=value.');
      const name = assignment.slice(0, separator);
      const value = assignment.slice(separator + 1);
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name) || !value) {
        throw new Error('--set requires a valid name and non-empty value.');
      }
      options.values[name] = value;
    }
    else if (PACKAGE_MANAGERS.includes(arg.replace(/^--/, ''))) {
      options.packageManager = arg.replace(/^--/, '');
    } else if (arg === '--package-manager' || arg === '--pm') {
      options.packageManager = args.shift();
      if (!PACKAGE_MANAGERS.includes(options.packageManager)) {
        throw new Error(`Package manager must be one of: ${PACKAGE_MANAGERS.join(', ')}`);
      }
    } else {
      throw new Error(`Unsupported option: ${arg}`);
    }
  }

  return { command, options, positionals };
}

function validateCommandFlags(command, options, definitions = frameworkDefinitions) {
  if (options.coldBoot && command !== 'android') {
    throw new Error('--cold-boot is only supported by the android command.');
  }
  if (options.shutdownAll && command !== 'ios') {
    throw new Error('--shutdown-all is only supported by the ios command.');
  }
  if (options.list && command !== 'open') {
    throw new Error('--list is only supported by the open command.');
  }
  if (options.opener && command !== 'open') {
    throw new Error('--with is only supported by the open command.');
  }
  if (options.editor && command !== 'open') {
    throw new Error('--editor is only supported by the open command.');
  }
  if (options.editor && options.opener) {
    throw new Error('--editor and --with cannot be used together.');
  }

  const hasPreset =
    options.typescript !== undefined ||
    options.packageManager !== undefined ||
    options.git !== undefined ||
    options.eslint !== undefined ||
    options.noInstall ||
    options.python !== undefined ||
    Object.keys(options.values || {}).length > 0;
  if (hasPreset && !definitions[command]) {
    throw new Error('Project preset options can only be used with framework commands.');
  }
}

function validateFrameworkOptions(command, options, definitions = frameworkDefinitions) {
  const definition = definitions[command];
  if (!definition) throw new Error(`Unsupported framework: ${command}`);

  const capabilities = definition.capabilities;
  if (options.typescript !== undefined && !capabilities.language) {
    throw new Error(`${command} does not support selecting TypeScript or JavaScript.`);
  }
  if (options.packageManager && !capabilities.packageManager) {
    throw new Error(`${command} does not support selecting a package manager.`);
  }
  if (options.git !== undefined && !capabilities.git) {
    throw new Error(`${command} does not support configuring Git initialization.`);
  }
  if (options.eslint !== undefined && !capabilities.eslint) {
    throw new Error(`${command} does not support configuring ESLint.`);
  }
  if (options.noInstall && !capabilities.noInstall) {
    throw new Error(`${command} does not support --no-install.`);
  }
  if (options.python && !capabilities.python) {
    throw new Error(`${command} does not support selecting a Python executable.`);
  }
  if (
    Array.isArray(capabilities.packageManager) &&
    options.packageManager &&
    !capabilities.packageManager.includes(options.packageManager)
  ) {
    throw new Error(
      `${command} supports package managers: ${capabilities.packageManager.join(', ')}`
    );
  }
}

function validateProjectName(target) {
  if (!target) throw new Error('Project name is required.');
  if (!/^[A-Za-z0-9._-]+$/.test(target)) {
    throw new Error('Invalid project name. Use only letters, numbers, dots, underscores, and hyphens.');
  }
}

module.exports = {
  parseArgs,
  validateCommandFlags,
  validateFrameworkOptions,
  validateProjectName,
};
