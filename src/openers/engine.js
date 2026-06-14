// Copyright (c) 2026 bachbnt

const fs = require('node:fs');
const path = require('node:path');
const { findXcodeContainer } = require('../projects/detect');
const { createCommand } = require('../runner/command');

function interpolate(value, context) {
  return value.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, key) => {
    if (context[key] === undefined) throw new Error(`Unknown opener placeholder: ${key}`);
    return String(context[key]);
  });
}

function resolveTarget(opener, project, options = {}) {
  const fsImpl = options.fsImpl || fs;
  if (opener.target === 'android') {
    const androidRoot = path.join(project.root, 'android');
    try {
      if (fsImpl.statSync(androidRoot).isDirectory()) return androidRoot;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    return project.root;
  }
  if (opener.target === 'xcode') {
    if ((options.platform || process.platform) !== 'darwin') {
      throw new Error('Xcode is only available on macOS.');
    }
    const iosRoot = project.xcode ? project.root : path.join(project.root, 'ios');
    const xcode = project.xcode || findXcodeContainer(iosRoot, fsImpl);
    if (!xcode) throw new Error('No Xcode workspace or project was detected.');
    return path.join(iosRoot, xcode.file);
  }
  return project.root;
}

function buildOpenerCommands(opener, project, options = {}) {
  const platform = options.platform || process.platform;
  const definition = opener.platforms[platform];
  if (!definition) {
    throw new Error(`${opener.description} is not configured for platform: ${platform}.`);
  }
  const target = resolveTarget(opener, project, options);
  const context = { target, root: project.root, platform };
  return [createCommand(
    interpolate(definition.executable, context),
    definition.args.map((arg) => interpolate(arg, context)),
    definition.cwd === undefined ? {} : { cwd: interpolate(definition.cwd, context) }
  )];
}

module.exports = { buildOpenerCommands, interpolate, resolveTarget };
