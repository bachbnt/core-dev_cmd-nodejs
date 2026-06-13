// Copyright (c) 2026 bachbnt

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getAndroidDevices,
  parseAdbDevices,
  parseAndroidRuntime,
  parseAvdNames,
} = require('../src/devices/android');
const { getIOSDevices, parseIOSDevices, parseRuntime } = require('../src/devices/ios');

test('Android parsers read adb, AVD names, and runtime config', () => {
  assert.deepEqual(
    parseAdbDevices('List of devices attached\nemulator-5554\tdevice\nphone\tdevice\nemulator-5556\toffline\n'),
    ['emulator-5554']
  );
  assert.deepEqual(parseAvdNames('Pixel_9\n\nPixel_Tablet\n'), ['Pixel_9', 'Pixel_Tablet']);
  assert.equal(
    parseAndroidRuntime('image.sysdir.1=system-images/android-35/google_apis/arm64-v8a/\n'),
    'android-35/google_apis/arm64-v8a'
  );
});

test('Android discovery reports runtime and running state', () => {
  const executeFileSync = (executable, args) => {
    if (executable === 'adb' && args[0] === 'devices') {
      return 'List of devices attached\nemulator-5554\tdevice\n';
    }
    if (executable === 'adb') return 'Pixel_9\nOK\n';
    if (executable === 'emulator') return 'Pixel_9\nPixel_Tablet\n';
    throw new Error('Unexpected command');
  };
  const devices = getAndroidDevices({
    executeFileSync,
    homeDirectory: '/home/test',
    readFileSync: (file) =>
      file.includes('Pixel_9')
        ? 'image.sysdir.1=system-images/android-35/google_apis/arm64-v8a/\n'
        : 'image.sysdir.1=system-images/android-34/default/x86_64/\n',
  });

  assert.deepEqual(devices, [
    {
      id: 'Pixel_9',
      name: 'Pixel_9',
      runtime: 'android-35/google_apis/arm64-v8a',
      status: 'Booted',
    },
    {
      id: 'Pixel_Tablet',
      name: 'Pixel_Tablet',
      runtime: 'android-34/default/x86_64',
      status: 'Shutdown',
    },
  ]);
});

test('iOS parser filters unavailable devices and formats runtime', () => {
  const fixture = {
    devices: {
      'com.apple.CoreSimulator.SimRuntime.iOS-26-5': [
        { name: 'iPhone 17 Pro', udid: 'A-1', state: 'Booted', isAvailable: true },
        { name: 'Old iPhone', udid: 'A-2', state: 'Shutdown', isAvailable: false },
      ],
    },
  };
  assert.equal(parseRuntime('com.apple.CoreSimulator.SimRuntime.iOS-26-5'), 'iOS 26.5');
  assert.deepEqual(parseIOSDevices(fixture), [
    {
      id: 'A-1',
      name: 'iPhone 17 Pro',
      runtime: 'iOS 26.5',
      status: 'Booted',
    },
  ]);
});

test('iOS discovery uses xcrun without a shell', () => {
  let invocation;
  const devices = getIOSDevices({
    executeFileSync(executable, args, options) {
      invocation = { executable, args, options };
      return JSON.stringify({
        devices: {
          'com.apple.CoreSimulator.SimRuntime.iOS-26-5': [
            { name: 'iPhone 17', udid: 'ID', state: 'Shutdown', isAvailable: true },
          ],
        },
      });
    },
  });
  assert.equal(invocation.executable, 'xcrun');
  assert.deepEqual(invocation.args, ['simctl', 'list', 'devices', 'available', '-j']);
  assert.equal(devices[0].id, 'ID');
});
