// Copyright (c) 2026 bachbnt

const path = require('path');
const { PACKAGE_MANAGERS, frameworkDefinitions } = require('../config');
const {
  buildFrameworkCommands,
  builtInRegistry,
  getFrameworkRequirements,
  getRecipe,
} = require('../commands/frameworks');
const { executeCommands } = require('../runtime/execute');
const { validateFrameworkOptions, validateProjectName } = require('../utils/args');

function applyConfigDefaults(command, options, config, definitions = frameworkDefinitions) {
  const capabilities = definitions[command].capabilities;
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

async function promptFrameworkOptions(
  p,
  command,
  options,
  config,
  definitions = frameworkDefinitions,
  recipe = builtInRegistry.get(command)
) {
  const capabilities = definitions[command].capabilities;
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
  options.values ||= {};
  for (const [name, input] of Object.entries(recipe?.inputs || {})) {
    if (options.values[name] !== undefined || input.default !== undefined || !input.required) continue;
    const value = unwrap(await p.text({
      message: input.description || `Enter ${name}:`,
      validate(candidate) {
        if (!candidate?.trim()) return `${name} is required.`;
        return undefined;
      },
    }));
    if (!value) return false;
    options.values[name] = value;
  }
  return true;
}

async function handleScaffold(context) {
  const { p, pc, command, positionals, options, config } = context;
  const definitions = context.frameworkDefinitions || frameworkDefinitions;
  const recipeRegistry = context.recipeRegistry || builtInRegistry;
  const recipe = getRecipe(command, recipeRegistry);
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
  if (interactive && !(await promptFrameworkOptions(
    p,
    command,
    options,
    config,
    definitions,
    recipe
  ))) {
    p.cancel('Operation cancelled.');
    return 130;
  }
  applyConfigDefaults(command, options, config, definitions);
  validateFrameworkOptions(command, options, definitions);

  const commands = buildFrameworkCommands(command, target, options, recipeRegistry);
  return executeCommands(p, pc, commands, {
    command,
    target,
    options,
    projectName: target,
    projectPath: path.resolve(target),
    projectType: command,
    recipeSource: recipe.source,
    config,
  }, {
    ...options,
    requirements: getFrameworkRequirements(command, options, recipeRegistry, target),
  });
}

async function handleInit(context) {
  const { p } = context;
  const definitions = context.frameworkDefinitions || frameworkDefinitions;

  const framework = await p.select({
    message: 'Select a framework:',
    options: Object.entries(definitions).map(([value, def]) => ({
      value,
      label: value,
      hint: def.description,
    })),
  });

  if (p.isCancel(framework)) {
    p.cancel('Operation cancelled.');
    return 130;
  }

  return handleScaffold({ ...context, command: framework });
}

module.exports = {
  applyConfigDefaults,
  handleInit,
  handleScaffold,
  promptFrameworkOptions,
};
