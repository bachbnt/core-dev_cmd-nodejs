// Copyright (c) 2026 bachbnt

const childProcess = require('child_process');

function parseRuntime(runtime) {
  return runtime
    .replace(/^com\.apple\.CoreSimulator\.SimRuntime\./, '')
    .replace(/-/g, ' ')
    .replace(/(\d) (\d)/g, '$1.$2');
}

function parseIOSDevices(output) {
  const data = typeof output === 'string' ? JSON.parse(output) : output;
  const result = [];
  for (const [runtime, devices] of Object.entries(data.devices || {})) {
    for (const device of devices) {
      if (device.isAvailable && device.name) {
        result.push({
          id: device.udid,
          name: device.name,
          runtime: parseRuntime(runtime),
          status: device.state || 'Shutdown',
        });
      }
    }
  }
  return result;
}

function getIOSDevices(options = {}) {
  const executeFileSync = options.executeFileSync || childProcess.execFileSync;
  try {
    const output = executeFileSync('xcrun', ['simctl', 'list', 'devices', 'available', '-j'], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return parseIOSDevices(output);
  } catch (error) {
    return [];
  }
}

module.exports = {
  getIOSDevices,
  parseIOSDevices,
  parseRuntime,
};
