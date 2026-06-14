// Copyright (c) 2026 bachbnt

const { createCommand } = require('../../runner/command');
const { unsupported } = require('./common');

function gradle(project, tasks) {
  const executable = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  return createCommand(executable, tasks, { cwd: project.root });
}

function build(action, project) {
  if (action === 'install' || action === 'run') return [gradle(project, ['installDebug'])];
  if (action === 'test') return [gradle(project, ['test'])];
  if (action === 'build') return [gradle(project, ['assembleDebug'])];
  if (action === 'clean') return [gradle(project, ['clean'])];
  if (action === 'check') return [gradle(project, ['lint', 'test'])];
  return unsupported(action, project);
}

module.exports = {
  build,
  id: 'android',
  matches: (project) => project.type === 'android',
};
