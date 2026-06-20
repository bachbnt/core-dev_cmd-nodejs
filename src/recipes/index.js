// Copyright (c) 2026 bachbnt

const {
  buildRecipeActions,
  buildRecipeCommands,
  buildRecipeLifecycleCommands,
  getRecipeRequirements,
  resolveInputs,
} = require('./engine');
const {
  getRecipeDefinitions,
  loadBuiltInRecipes,
  loadRecipeDirectory,
  loadRecipeFile,
  loadRecipeRegistry,
} = require('./loader');
const { validateRecipe } = require('./schema');

const builtInRegistry = loadRecipeRegistry({ includeUser: false });

module.exports = {
  builtInRegistry,
  buildRecipeCommands,
  buildRecipeActions,
  buildRecipeLifecycleCommands,
  getRecipeDefinitions,
  getRecipeRequirements,
  loadBuiltInRecipes,
  loadRecipeDirectory,
  loadRecipeFile,
  loadRecipeRegistry,
  resolveInputs,
  validateRecipe,
};
