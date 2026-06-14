// Copyright (c) 2026 bachbnt

const fs = require('fs');
const path = require('path');
const { createCommand } = require('../../runner/command');
const { internalCleaner, unsupported } = require('./common');

const TYPES = ['python', 'django', 'fastapi', 'flask'];

function venvPython(project) {
  const relative = process.platform === 'win32'
    ? path.join('.venv', 'Scripts', 'python.exe')
    : path.join('.venv', 'bin', 'python');
  return path.join(project.root, relative);
}

function getPython(project, config) {
  const executable = venvPython(project);
  return fs.existsSync(executable) ? executable : config.python;
}

function pyprojectContent(project) {
  try {
    return fs.readFileSync(path.join(project.root, 'pyproject.toml'), 'utf8').toLowerCase();
  } catch (error) {
    return '';
  }
}

function build(action, project, context) {
  const config = context.config;
  const python = getPython(project, config);

  if (action === 'install') {
    const executable = venvPython(project);
    const commands = [];
    if (!fs.existsSync(executable)) {
      commands.push(createCommand(config.python, ['-m', 'venv', '.venv'], { cwd: project.root }));
    }
    commands.push(createCommand(executable, ['-m', 'pip', 'install', '-e', '.[dev]'], { cwd: project.root }));
    return commands;
  }
  if (action === 'run' && project.type === 'django') {
    return [createCommand(python, ['manage.py', 'runserver'], { cwd: project.root })];
  }
  if (action === 'run' && project.type === 'fastapi') {
    return [createCommand(python, ['-m', 'fastapi', 'dev', 'app/main.py'], { cwd: project.root })];
  }
  if (action === 'run' && project.type === 'flask') {
    return [createCommand(python, ['-m', 'flask', '--app', 'app', 'run', '--debug'], { cwd: project.root })];
  }
  if (action === 'test') return [createCommand(python, ['-m', 'pytest'], { cwd: project.root })];
  if (action === 'build') return [createCommand(python, ['-m', 'build'], { cwd: project.root })];
  if (action === 'clean') return internalCleaner(project);
  if (action === 'check') {
    const commands = [];
    const pyproject = pyprojectContent(project);
    if (/\bruff\b/.test(pyproject)) {
      commands.push(createCommand(python, ['-m', 'ruff', 'check', '.'], { cwd: project.root }));
    }
    commands.push(
      createCommand(python, ['-m', 'pytest'], { cwd: project.root }),
      createCommand(python, ['-m', 'build'], { cwd: project.root })
    );
    return commands;
  }
  return unsupported(action, project);
}

module.exports = {
  build,
  getPython,
  id: 'python',
  matches: (project) => TYPES.includes(project.type),
  venvPython,
};
