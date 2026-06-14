// Copyright (c) 2026 bachbnt

const { buildLifecycleCommands, buildOpenCommands } = require('./lifecycle');
const { formatSequence } = require('../runner/command');

const INSPECT_ACTIONS = ['install', 'run', 'test', 'build', 'check', 'clean', 'open'];

function inspectAction(action, project, config, openerRegistry) {
  try {
    const commands = action === 'open'
      ? buildOpenCommands(project, undefined, config, openerRegistry)
      : buildLifecycleCommands(action, project, { config });
    return {
      action,
      available: true,
      command: formatSequence(commands),
      commands,
    };
  } catch (error) {
    return { action, available: false, reason: error.message };
  }
}

function inspectProject(project, config, openerRegistry) {
  return {
    name: project.name,
    type: project.type,
    root: project.root,
    packageManager: project.packageManager,
    xcode: project.xcode,
    recipeSource: project.recipe?.source,
    actions: INSPECT_ACTIONS.map((action) => inspectAction(action, project, config, openerRegistry)),
  };
}

module.exports = {
  INSPECT_ACTIONS,
  inspectAction,
  inspectProject,
};
