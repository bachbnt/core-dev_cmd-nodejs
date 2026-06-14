// Copyright (c) 2026 bachbnt

const fs = require('fs');
const path = require('path');
const { CONFIG_FILE, PACKAGE_MANAGERS } = require('./index');

const DEFAULT_CONFIG = {
  packageManager: 'npm',
  initializeGit: true,
  python: process.platform === 'win32' ? 'python' : 'python3',
  opener: 'vscode',
};

const CONFIG_KEYS = [...Object.keys(DEFAULT_CONFIG), 'editor'];

function readJson(file, fsImpl = fs) {
  try {
    return JSON.parse(fsImpl.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw new Error(`Unable to read config ${file}: ${error.message}`);
  }
}

function validateConfig(config) {
  if (!PACKAGE_MANAGERS.includes(config.packageManager)) {
    throw new Error(`packageManager must be one of: ${PACKAGE_MANAGERS.join(', ')}`);
  }
  if (typeof config.initializeGit !== 'boolean') {
    throw new Error('initializeGit must be true or false.');
  }
  if (typeof config.python !== 'string' || !config.python.trim()) {
    throw new Error('python must be a non-empty executable name or path.');
  }
  if (config.opener !== undefined && (typeof config.opener !== 'string' || !config.opener.trim())) {
    throw new Error('opener must be a non-empty opener name.');
  }
  if (config.editor !== undefined && (typeof config.editor !== 'string' || !config.editor.trim())) {
    throw new Error('editor must be a non-empty application or executable name.');
  }
  return config;
}

function loadConfig(options = {}) {
  const file = options.file || CONFIG_FILE;
  const fsImpl = options.fsImpl || fs;
  const saved = readJson(file, fsImpl);
  const config = { ...DEFAULT_CONFIG, ...saved };
  if (saved.editor && saved.opener === undefined) delete config.opener;
  return validateConfig(config);
}

function parseConfigValue(key, value) {
  if (!CONFIG_KEYS.includes(key)) {
    throw new Error(`Unknown config key: ${key}. Available keys: ${CONFIG_KEYS.join(', ')}`);
  }
  if (key === 'initializeGit') {
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new Error('initializeGit must be true or false.');
  }
  return value;
}

function saveConfig(config, options = {}) {
  const file = options.file || CONFIG_FILE;
  const fsImpl = options.fsImpl || fs;
  const validated = validateConfig({ ...config });
  fsImpl.mkdirSync(path.dirname(file), { recursive: true });
  fsImpl.writeFileSync(file, `${JSON.stringify(validated, null, 2)}\n`);
  return validated;
}

function setConfigValue(key, value, options = {}) {
  const config = loadConfig(options);
  if (key === 'editor') delete config.opener;
  if (key === 'opener') delete config.editor;
  config[key] = parseConfigValue(key, value);
  return saveConfig(config, options);
}

module.exports = {
  CONFIG_KEYS,
  DEFAULT_CONFIG,
  loadConfig,
  parseConfigValue,
  saveConfig,
  setConfigValue,
  validateConfig,
};
