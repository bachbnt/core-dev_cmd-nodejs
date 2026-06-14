// Copyright (c) 2026 bachbnt

const fs = require('fs');
const os = require('os');
const path = require('path');
const builtInRecipes = require('./built-ins.json');
const { validateRecipe } = require('./schema');

function attachSource(recipe, source, baseDir) {
  return { ...recipe, source, baseDir };
}

function loadBuiltInRecipes() {
  return builtInRecipes.map((recipe) => attachSource(validateRecipe(recipe), 'built-in', __dirname));
}

function loadRecipeFile(file, source, fsImpl = fs) {
  let parsed;
  try {
    parsed = JSON.parse(fsImpl.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read recipe ${file}: ${error.message}`);
  }
  const recipes = Array.isArray(parsed) ? parsed : [parsed];
  return recipes.map((recipe) => {
    try {
      return attachSource(validateRecipe(recipe), source, path.dirname(file));
    } catch (error) {
      throw new Error(`Invalid recipe ${file}: ${error.message}`);
    }
  });
}

function loadRecipeDirectory(directory, source, options = {}) {
  const fsImpl = options.fsImpl || fs;
  let entries;
  try {
    entries = fsImpl.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new Error(`Unable to read recipe directory ${directory}: ${error.message}`);
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => loadRecipeFile(path.join(directory, entry.name), source, fsImpl));
}

function createRegistry(recipes) {
  const registry = new Map();
  for (const recipe of recipes) registry.set(recipe.name, recipe);
  return registry;
}

function loadRecipeRegistry(options = {}) {
  const home = options.home || os.homedir();
  const userDirectory = options.userDirectory || path.join(home, '.devcmd', 'recipes');
  const builtIns = options.builtIns || loadBuiltInRecipes();
  const userRecipes = options.includeUser === false
    ? []
    : loadRecipeDirectory(userDirectory, 'user', options);
  return createRegistry([...builtIns, ...userRecipes]);
}

function getRecipeDefinitions(registry) {
  return Object.fromEntries(
    [...registry.entries()].map(([name, recipe]) => [name, {
      description: recipe.description,
      capabilities: recipe.capabilities || {},
      source: recipe.source,
    }])
  );
}

module.exports = {
  createRegistry,
  getRecipeDefinitions,
  loadBuiltInRecipes,
  loadRecipeDirectory,
  loadRecipeFile,
  loadRecipeRegistry,
};
