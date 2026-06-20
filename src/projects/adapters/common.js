// Copyright (c) 2026 bachbnt

const path = require('path');
const { createCommand } = require('../../runner/command');

function internalCleaner(project) {
  const cleaner = path.join(__dirname, '..', '..', 'generators', 'clean-project.js');
  return [createCommand(process.execPath, [cleaner, project.root, project.type])];
}

function internalResetter(project) {
  const resetter = path.join(__dirname, '..', '..', 'generators', 'reset-project.js');
  return [createCommand(process.execPath, [resetter, project.root, project.type])];
}

function unsupported(action, project) {
  throw new Error(`dev ${action} is not supported for detected project type: ${project.type}.`);
}

module.exports = {
  internalCleaner,
  internalResetter,
  unsupported,
};
