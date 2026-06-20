// Copyright (c) 2026 bachbnt

const { createCommand } = require('../../runner/command');
const { internalCleaner, internalResetter, unsupported } = require('./common');

function runScript(project, script) {
  return createCommand(project.packageManager, ['run', script], { cwd: project.root });
}

function findScript(project, names) {
  return names.find((name) => project.packageJson?.scripts?.[name]);
}

function requireScript(project, names, action) {
  const script = findScript(project, names);
  if (!script) {
    throw new Error(`No package.json script is available for dev ${action}. Expected: ${names.join(' or ')}.`);
  }
  return script;
}

function build(action, project) {
  if (action === 'install') {
    return [createCommand(project.packageManager, ['install'], { cwd: project.root })];
  }
  if (action === 'run') return [runScript(project, requireScript(project, ['dev', 'start'], action))];
  if (action === 'test') return [runScript(project, requireScript(project, ['test'], action))];
  if (action === 'build') return [runScript(project, requireScript(project, ['build'], action))];
  if (action === 'reset') {
    return [...internalResetter(project), createCommand(project.packageManager, ['install'], { cwd: project.root })];
  }
  if (action === 'clean') {
    return project.packageJson.scripts?.clean ? [runScript(project, 'clean')] : internalCleaner(project);
  }
  if (action === 'check') {
    const scripts = ['lint', 'typecheck', 'test', 'build'].filter(
      (script) => project.packageJson.scripts?.[script]
    );
    if (scripts.length === 0) {
      throw new Error('No quality scripts were found. Add one of: lint, typecheck, test, build.');
    }
    return scripts.map((script) => runScript(project, script));
  }
  return unsupported(action, project);
}

module.exports = {
  build,
  findScript,
  id: 'node',
  matches: (project) => Boolean(project.packageJson),
};
