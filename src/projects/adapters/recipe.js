// Copyright (c) 2026 bachbnt

const { buildRecipeLifecycleCommands } = require('../../recipes');

function build(action, project, context) {
  return buildRecipeLifecycleCommands(project.recipe, action, project, context);
}

module.exports = {
  build,
  id: 'recipe',
  matches: (project) => Boolean(project.recipe?.lifecycle && !project.recipe.lifecycle.adapter),
};
