// Copyright (c) 2026 bachbnt

const path = require('path');
const { PACKAGE_MANAGERS, frameworkDefinitions } = require('../config');
const { buildFrameworkCommands, getFrameworkRequirements } = require('../commands/frameworks');
const { executeCommands } = require('../runtime/execute');
const { validateFrameworkOptions, validateProjectName } = require('../utils/args');

function applyConfigDefaults(command, options, config) {
  const capabilities = frameworkDefinitions[command].capabilities;
  if (capabilities.packageManager && !options.packageManager) {
    const supported = Array.isArray(capabilities.packageManager)
      ? capabilities.packageManager
      : PACKAGE_MANAGERS;
    options.packageManager = supported.includes(config.packageManager)
      ? config.packageManager
      : supported[0];
  }
  if (capabilities.git && options.git === undefined) options.git = config.initializeGit;
  if (capabilities.python && !options.python) options.python = config.python;
}

async function promptFrameworkOptions(p, command, options, config) {
  const capabilities = frameworkDefinitions[command].capabilities;
  const unwrap = (value) => (p.isCancel(value) ? undefined : value);

  if (capabilities.language && options.typescript === undefined) {
    options.typescript = unwrap(await p.confirm({ message: 'Use TypeScript?', initialValue: true }));
    if (options.typescript === undefined) return false;
  }
  if (capabilities.packageManager && !options.packageManager) {
    const supported = Array.isArray(capabilities.packageManager)
      ? capabilities.packageManager
      : PACKAGE_MANAGERS;
    options.packageManager = unwrap(await p.select({
      message: 'Select a package manager:',
      options: supported.map((value) => ({ value, label: value })),
      initialValue: supported.includes(config.packageManager) ? config.packageManager : supported[0],
    }));
    if (!options.packageManager) return false;
  }
  if (capabilities.git && options.git === undefined) {
    options.git = unwrap(await p.confirm({
      message: 'Initialize a Git repository?',
      initialValue: config.initializeGit,
    }));
    if (options.git === undefined) return false;
  }
  if (capabilities.eslint && options.eslint === undefined) {
    options.eslint = unwrap(await p.confirm({ message: 'Include ESLint?', initialValue: true }));
    if (options.eslint === undefined) return false;
  }
  return true;
}

async function handleScaffold(context) {
  const { p, pc, command, positionals, options, config } = context;
  if (positionals.length > 1) throw new Error(`Unexpected argument: ${positionals[1]}`);

  const interactive = !options.target;
  let target = options.target;
  if (!target) {
    const result = await p.text({
      message: 'What is your project name?',
      placeholder: 'my-awesome-app',
      validate(value) {
        try {
          validateProjectName(value);
        } catch (error) {
          return error.message;
        }
      },
    });
    if (p.isCancel(result)) {
      p.cancel('Operation cancelled.');
      return 130;
    }
    target = result;
  }

  validateProjectName(target);
  if (interactive && !(await promptFrameworkOptions(p, command, options, config))) {
    p.cancel('Operation cancelled.');
    return 130;
  }
  applyConfigDefaults(command, options, config);
  validateFrameworkOptions(command, options);

  const commands = buildFrameworkCommands(command, target, options);
  return executeCommands(p, pc, commands, {
    command,
    target,
    options,
    projectName: target,
    projectPath: path.resolve(target),
    projectType: command,
  }, { ...options, requirements: getFrameworkRequirements(command, options) });
}

module.exports = {
  applyConfigDefaults,
  handleScaffold,
  promptFrameworkOptions,
};
