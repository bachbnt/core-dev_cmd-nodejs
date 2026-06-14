// Copyright (c) 2026 bachbnt

const node = require('./node');
const python = require('./python');
const flutter = require('./flutter');
const android = require('./android');
const ios = require('./ios');

const adapters = [node, python, flutter, android, ios];

function getProjectAdapter(project) {
  const adapter = adapters.find((candidate) => candidate.matches(project));
  if (!adapter) throw new Error(`No lifecycle adapter is available for project type: ${project.type}.`);
  return adapter;
}

module.exports = {
  adapters,
  getProjectAdapter,
};
