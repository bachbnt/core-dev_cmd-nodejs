// Copyright (c) 2026 bachbnt

const path = require('node:path');

const NAME_PATTERN = /^[a-z][a-z0-9_]*$/;
const PLATFORMS = new Set(['darwin', 'linux', 'win32']);
const TARGETS = new Set(['project', 'android', 'xcode']);
const FORBIDDEN_NAMES = new Set(['recent', 'list', 'validate']);
const FORBIDDEN_SHELLS = new Set(['sh', 'bash', 'zsh', 'fish', 'cmd', 'cmd.exe', 'powershell', 'pwsh']);

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function validateName(value, label) {
  if (!NAME_PATTERN.test(value || '') || FORBIDDEN_NAMES.has(value)) {
    throw new Error(`${label} must use lowercase letters, numbers, and underscores and must not be reserved.`);
  }
}

function validateCommand(command, label) {
  assertObject(command, label);
  if (Object.keys(command).some((key) => !['executable', 'args', 'cwd'].includes(key))) {
    throw new Error(`${label} contains unsupported fields.`);
  }
  if (typeof command.executable !== 'string' || !command.executable.trim()) {
    throw new Error(`${label}.executable must be a non-empty string.`);
  }
  if (command.executable.includes('{')) {
    throw new Error(`${label}.executable cannot contain placeholders.`);
  }
  if (FORBIDDEN_SHELLS.has(path.basename(command.executable).toLowerCase())) {
    throw new Error(`${label} cannot use a shell executable.`);
  }
  if (!Array.isArray(command.args) || command.args.some((arg) => typeof arg !== 'string')) {
    throw new Error(`${label}.args must be an array of strings.`);
  }
  if (command.cwd !== undefined && typeof command.cwd !== 'string') {
    throw new Error(`${label}.cwd must be a string.`);
  }
}

function validateOpener(opener) {
  assertObject(opener, 'Opener');
  const allowed = ['name', 'aliases', 'description', 'target', 'platforms'];
  const unknown = Object.keys(opener).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) throw new Error(`Opener contains unsupported fields: ${unknown.join(', ')}`);

  validateName(opener.name, 'Opener name');
  if (opener.aliases !== undefined) {
    if (!Array.isArray(opener.aliases) || opener.aliases.length === 0) {
      throw new Error(`Opener ${opener.name} aliases must be a non-empty array.`);
    }
    const aliases = new Set();
    for (const alias of opener.aliases) {
      validateName(alias, `Opener ${opener.name} alias`);
      if (alias === opener.name || aliases.has(alias)) {
        throw new Error(`Opener ${opener.name} contains a duplicate alias: ${alias}`);
      }
      aliases.add(alias);
    }
  }
  if (typeof opener.description !== 'string' || !opener.description.trim()) {
    throw new Error(`Opener ${opener.name} requires a description.`);
  }
  if (!TARGETS.has(opener.target || 'project')) {
    throw new Error(`Opener ${opener.name} target must be one of: ${[...TARGETS].join(', ')}`);
  }
  assertObject(opener.platforms, `Opener ${opener.name} platforms`);
  const entries = Object.entries(opener.platforms);
  if (entries.length === 0) throw new Error(`Opener ${opener.name} requires at least one platform.`);
  for (const [platform, command] of entries) {
    if (!PLATFORMS.has(platform)) throw new Error(`Opener ${opener.name} has unsupported platform: ${platform}`);
    validateCommand(command, `Opener ${opener.name} platform ${platform}`);
  }
  return opener;
}

module.exports = { validateOpener };
