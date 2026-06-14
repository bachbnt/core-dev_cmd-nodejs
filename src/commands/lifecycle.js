// Copyright (c) 2026 bachbnt

const path = require('path');
const { findXcodeContainer } = require('../projects/detect');
const { getProjectAdapter } = require('../projects/adapters');
const { createCommand } = require('../runner/command');

function buildLifecycleCommands(action, project, options = {}) {
  return getProjectAdapter(project).build(action, project, options);
}

function buildOpenCommands(project, mode, config) {
  if (mode === 'android') {
    if (process.platform === 'darwin') return [createCommand('open', ['-a', 'Android Studio', project.root])];
    return [createCommand('studio', [project.root])];
  }
  if (mode === 'ios') {
    const iosRoot = project.xcode ? project.root : path.join(project.root, 'ios');
    const xcode = project.xcode || findXcodeContainer(iosRoot);
    if (!xcode) throw new Error('No Xcode workspace or project was detected.');
    return [createCommand('open', [path.join(iosRoot, xcode.file)])];
  }
  return [createCommand(config.editor, [project.root])];
}

module.exports = {
  buildLifecycleCommands,
  buildOpenCommands,
};
