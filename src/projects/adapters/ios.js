// Copyright (c) 2026 bachbnt

const { createCommand } = require('../../runner/command');
const { unsupported } = require('./common');

function baseArgs(project) {
  return project.xcode.kind === 'workspace'
    ? ['-workspace', project.xcode.file]
    : ['-project', project.xcode.file];
}

function xcodebuild(project, action) {
  return createCommand('xcodebuild', [...baseArgs(project), action], { cwd: project.root });
}

function build(action, project) {
  if (action === 'install') {
    return [createCommand('xcodebuild', [...baseArgs(project), '-resolvePackageDependencies'], { cwd: project.root })];
  }
  if (action === 'reset') {
    return [xcodebuild(project, 'clean'), createCommand('xcodebuild', [...baseArgs(project), '-resolvePackageDependencies'], { cwd: project.root })];
  }
  if (['build', 'test', 'clean'].includes(action)) return [xcodebuild(project, action)];
  if (action === 'check') return [xcodebuild(project, 'analyze'), xcodebuild(project, 'build')];
  if (action === 'run') {
    throw new Error('Automatic iOS run requires a scheme and destination. Use dev open ios for now.');
  }
  return unsupported(action, project);
}

module.exports = {
  build,
  id: 'ios',
  matches: (project) => project.type === 'ios',
};
