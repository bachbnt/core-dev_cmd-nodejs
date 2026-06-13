// Copyright (c) 2026 bachbnt

const { createCommand } = require('../runner/command');

function buildAndroidCommands(target, options = {}) {
  const args = ['-avd', target];
  if (options.coldBoot) args.push('-no-snapshot-load');
  return [createCommand('emulator', args)];
}

function buildIOSBootCommands(target) {
  return [
    createCommand('open', ['-a', 'Simulator']),
    createCommand('xcrun', ['simctl', 'boot', target]),
  ];
}

function buildIOSShutdownCommands() {
  return [createCommand('xcrun', ['simctl', 'shutdown', 'all'])];
}

module.exports = {
  buildAndroidCommands,
  buildIOSBootCommands,
  buildIOSShutdownCommands,
};
