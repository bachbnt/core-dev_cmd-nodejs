// Copyright (c) 2026 bachbnt

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const builtIns = require('./built-ins.json');
const { validateOpener } = require('./schema');

function attachSource(opener, source, baseDir) {
  return { target: 'project', ...opener, source, baseDir };
}

function loadBuiltInOpeners() {
  return builtIns.map((opener) => attachSource(validateOpener(opener), 'built-in', __dirname));
}

function loadOpenerFile(file, source, fsImpl = fs) {
  let parsed;
  try {
    parsed = JSON.parse(fsImpl.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read opener ${file}: ${error.message}`);
  }
  const openers = Array.isArray(parsed) ? parsed : [parsed];
  return openers.map((opener) => {
    try {
      return attachSource(validateOpener(opener), source, path.dirname(file));
    } catch (error) {
      throw new Error(`Invalid opener ${file}: ${error.message}`);
    }
  });
}

function loadOpenerDirectory(directory, source, options = {}) {
  const fsImpl = options.fsImpl || fs;
  let entries;
  try {
    entries = fsImpl.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new Error(`Unable to read opener directory ${directory}: ${error.message}`);
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => loadOpenerFile(path.join(directory, entry.name), source, fsImpl));
}

function createOpenerRegistry(openers) {
  const registry = new Map();
  for (const opener of openers) registry.set(opener.name, opener);

  const names = new Map([...registry.keys()].map((name) => [name, name]));
  for (const opener of registry.values()) {
    for (const alias of opener.aliases || []) {
      const owner = names.get(alias);
      if (owner && owner !== opener.name) {
        throw new Error(`Opener alias ${alias} conflicts with opener: ${owner}`);
      }
      names.set(alias, opener.name);
    }
  }
  return registry;
}

function loadOpenerRegistry(options = {}) {
  const home = options.home || os.homedir();
  const userDirectory = options.userDirectory || path.join(home, '.devcmd', 'openers');
  const builtInOpeners = options.builtIns || loadBuiltInOpeners();
  const userOpeners = options.includeUser === false
    ? []
    : loadOpenerDirectory(userDirectory, 'user', options);
  return createOpenerRegistry([...builtInOpeners, ...userOpeners]);
}

function resolveOpener(registry, name) {
  if (!name) return undefined;
  if (registry.has(name)) return registry.get(name);
  return [...registry.values()].find((opener) => (opener.aliases || []).includes(name));
}

module.exports = {
  createOpenerRegistry,
  loadBuiltInOpeners,
  loadOpenerDirectory,
  loadOpenerFile,
  loadOpenerRegistry,
  resolveOpener,
};
