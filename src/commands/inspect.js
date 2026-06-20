// Copyright (c) 2026 bachbnt

const { buildLifecycleCommands, buildOpenCommands } = require('./lifecycle');
const { formatSequence } = require('../runner/command');
const { LIFECYCLE_COMMANDS } = require('../constants');

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
    actions: LIFECYCLE_COMMANDS.map((action) => inspectAction(action, project, config, openerRegistry)),
  };
}

module.exports = {
  INSPECT_ACTIONS: LIFECYCLE_COMMANDS,
  inspectAction,
  inspectProject,
};
