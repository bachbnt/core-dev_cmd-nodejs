// Copyright (c) 2026 bachbnt

const {
  buildRecipeCommands,
  getRecipeRequirements,
  loadRecipeRegistry,
} = require('../recipes');

const builtInRegistry = loadRecipeRegistry({ includeUser: false });

function getRecipe(command, registry = builtInRegistry) {
  const recipe = registry.get(command);
  if (!recipe) throw new Error(`Unsupported framework: ${command}`);
  return recipe;
}

function buildFrameworkCommands(command, target, options = {}, registry = builtInRegistry) {
  return buildRecipeCommands(getRecipe(command, registry), target, options);
}

function buildPythonCommands(framework, target, options = {}, registry = builtInRegistry) {
  if (!['django', 'fastapi', 'flask'].includes(framework)) {
    throw new Error(`Unsupported Python framework: ${framework}`);
  }
  return buildFrameworkCommands(framework, target, options, registry);
}

function getFrameworkRequirements(command, options = {}, registry = builtInRegistry, target = 'project') {
  return getRecipeRequirements(getRecipe(command, registry), target, options);
}

module.exports = {
  buildFrameworkCommands,
  buildPythonCommands,
  builtInRegistry,
  getFrameworkRequirements,
  getRecipe,
};
