// Copyright (c) 2026 bachbnt

const { getProjectAdapter } = require('../projects/adapters');
const { createCommand } = require('../runner/command');
const { buildRecipeLifecycleCommands } = require('../recipes');
const { buildOpenerCommands, builtInOpenerRegistry, resolveOpener } = require('../openers');

function buildLifecycleCommands(action, project, options = {}) {
  return getProjectAdapter(project).build(action, project, options);
}

function buildOpenCommands(
  project,
  openerName,
  config,
  openerRegistry = builtInOpenerRegistry,
  options = {}
) {
  if (!openerName && options.editor) return [createCommand(options.editor, [project.root])];
  if (!openerName && !config.opener && config.editor) {
    return [createCommand(config.editor, [project.root])];
  }
  if (!openerName && project.recipe?.lifecycle?.open && !project.recipe.lifecycle.adapter) {
    return buildRecipeLifecycleCommands(project.recipe, 'open', project, { config });
  }
  const requested = openerName || config.opener || 'vscode';
  const opener = resolveOpener(openerRegistry, requested);
  if (!opener) throw new Error(`Unknown opener: ${requested}. Run dev open --list.`);
  return buildOpenerCommands(opener, project, options);
}

module.exports = {
  buildLifecycleCommands,
  buildOpenCommands,
};
