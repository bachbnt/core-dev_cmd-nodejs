// Copyright (c) 2026 bachbnt

const { buildOpenerCommands } = require('./engine');
const {
  createOpenerRegistry,
  loadBuiltInOpeners,
  loadOpenerDirectory,
  loadOpenerFile,
  loadOpenerRegistry,
  resolveOpener,
} = require('./loader');
const { validateOpener } = require('./schema');

const builtInOpenerRegistry = loadOpenerRegistry({ includeUser: false });

module.exports = {
  buildOpenerCommands,
  builtInOpenerRegistry,
  createOpenerRegistry,
  loadBuiltInOpeners,
  loadOpenerDirectory,
  loadOpenerFile,
  loadOpenerRegistry,
  resolveOpener,
  validateOpener,
};
