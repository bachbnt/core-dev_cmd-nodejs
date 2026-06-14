// Copyright (c) 2026 bachbnt

const node = require('./node');
const python = require('./python');
const flutter = require('./flutter');
const android = require('./android');
const ios = require('./ios');
const recipe = require('./recipe');

const adapters = [node, python, flutter, android, ios];

function getProjectAdapter(project) {
  if (project.recipe?.lifecycle?.adapter) {
    const configured = adapters.find((candidate) => candidate.id === project.recipe.lifecycle.adapter);
    if (!configured) {
      throw new Error(`Unknown lifecycle adapter: ${project.recipe.lifecycle.adapter}.`);
    }
    return configured;
  }
  if (recipe.matches(project)) return recipe;
  const adapter = adapters.find((candidate) => candidate.matches(project));
  if (!adapter) throw new Error(`No lifecycle adapter is available for project type: ${project.type}.`);
  return adapter;
}

module.exports = {
  adapters,
  getProjectAdapter,
  recipe,
};
