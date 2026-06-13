// Copyright (c) 2026 bachbnt

const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function executeFile(executable, args, executeFileSync = childProcess.execFileSync) {
  return executeFileSync(executable, args, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });
}

function parseAdbDevices(output) {
  return output
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts.length === 2 && parts[1] === 'device')
    .map((parts) => parts[0])
    .filter((serial) => serial.startsWith('emulator-'));
}

function parseAvdNames(output) {
  return output.split('\n').map((name) => name.trim()).filter(Boolean);
}

function parseAndroidRuntime(config) {
  const image = config.match(/^image\.sysdir\.1\s*=\s*(.+)$/m)?.[1]?.trim();
  return image ? image.replace(/^system-images\//, '').replace(/\/$/, '') : 'Android';
}

function getRunningAndroidDevices(options = {}) {
  const executeFileSync = options.executeFileSync || childProcess.execFileSync;
  const running = new Map();
  try {
    const serials = parseAdbDevices(executeFile('adb', ['devices'], executeFileSync));
    for (const serial of serials) {
      try {
        const name = executeFile('adb', ['-s', serial, 'emu', 'avd', 'name'], executeFileSync)
          .split('\n')[0]
          .trim();
        if (name) running.set(name, serial);
      } catch (error) {
        // The emulator may disappear while the list is being collected.
      }
    }
  } catch (error) {
    return running;
  }
  return running;
}

function getAndroidDevices(options = {}) {
  const executeFileSync = options.executeFileSync || childProcess.execFileSync;
  const readFileSync = options.readFileSync || fs.readFileSync;
  const homeDirectory = options.homeDirectory || os.homedir();

  try {
    const running = getRunningAndroidDevices({ executeFileSync });
    const names = parseAvdNames(executeFile('emulator', ['-list-avds'], executeFileSync));
    return names.map((name) => {
      let runtime = 'Android';
      try {
        const configPath = path.join(homeDirectory, '.android', 'avd', `${name}.avd`, 'config.ini');
        runtime = parseAndroidRuntime(readFileSync(configPath, 'utf8'));
      } catch (error) {
        // Keep the generic runtime when the AVD config is unavailable.
      }
      return {
        id: name,
        name,
        runtime,
        status: running.has(name) ? 'Booted' : 'Shutdown',
      };
    });
  } catch (error) {
    return [];
  }
}

module.exports = {
  getAndroidDevices,
  getRunningAndroidDevices,
  parseAdbDevices,
  parseAndroidRuntime,
  parseAvdNames,
};
