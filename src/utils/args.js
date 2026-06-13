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
  };

  while (args.length > 0) {
    const arg = args.shift();

    if (!arg.startsWith('-') && !options.target) {
      options.target = arg;
      continue;
    }

    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--cold-boot') options.coldBoot = true;
    else if (arg === '--shutdown-all') options.shutdownAll = true;
    else if (arg === '--typescript' || arg === '--ts') options.typescript = true;
    else if (arg === '--javascript' || arg === '--js') options.typescript = false;
    else if (arg === '--git') options.git = true;
    else if (arg === '--no-git') options.git = false;
    else if (arg === '--eslint') options.eslint = true;
    else if (arg === '--no-eslint') options.eslint = false;
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

  return { command, options };
}

function validateCommandFlags(command, options) {
  if (options.coldBoot && command !== 'android') {
    throw new Error('--cold-boot is only supported by the android command.');
  }
  if (options.shutdownAll && command !== 'ios') {
    throw new Error('--shutdown-all is only supported by the ios command.');
  }

  const hasPreset =
    options.typescript !== undefined ||
    options.packageManager !== undefined ||
    options.git !== undefined ||
    options.eslint !== undefined;
  if (hasPreset && !frameworkDefinitions[command]) {
    throw new Error('Project preset options can only be used with framework commands.');
  }
}

function validateFrameworkOptions(command, options) {
  const definition = frameworkDefinitions[command];
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
