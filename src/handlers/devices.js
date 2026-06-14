// Copyright (c) 2026 bachbnt

const { DEFAULT_DEVICES } = require('../config');
const { buildAndroidCommands, buildIOSBootCommands, buildIOSShutdownCommands } = require('../commands/devices');
const { formatDevice, getAndroidDevices, getIOSDevices } = require('../devices');
const { executeCommands } = require('../runtime/execute');

function handleDeviceList(context) {
  const { p, pc } = context;
  const android = getAndroidDevices();
  const ios = getIOSDevices();
  p.note([
    pc.bold('Android'),
    ...(android.length ? android.map((device) => `  ${formatDevice(device)}`) : ['  No devices found']),
    '',
    pc.bold('iOS'),
    ...(ios.length ? ios.map((device) => `  ${formatDevice(device)}`) : ['  No devices found']),
  ].join('\n'), 'Available devices');
  p.outro(`${android.length + ios.length} device(s) found.`);
  return 0;
}

async function handleDeviceCommand(context) {
  const { p, pc, command, options } = context;
  if (command === 'ios' && options.shutdownAll) {
    return executeCommands(p, pc, buildIOSShutdownCommands(), { command: 'ios', action: 'shutdown-all' }, {
      ...options,
      requirements: ['xcrun'],
    });
  }

  const availableDevices = command === 'android' ? getAndroidDevices() : getIOSDevices();
  let target = options.target;
  if (!target && availableDevices.length > 0) {
    const preferred = availableDevices.find((device) => device.name === DEFAULT_DEVICES[command]);
    const selected = await p.select({
      message: 'Select a device:',
      options: availableDevices.map((device) => ({
        value: device.id,
        label: formatDevice(device),
        hint: preferred?.id === device.id ? 'default' : '',
      })),
      initialValue: preferred?.id || availableDevices[0].id,
    });
    if (p.isCancel(selected)) {
      p.cancel('Operation cancelled.');
      return 130;
    }
    target = selected;
  }
  if (!target) {
    const result = await p.text({
      message: 'No device was detected. Enter a device name or identifier:',
      placeholder: DEFAULT_DEVICES[command],
      defaultValue: DEFAULT_DEVICES[command],
      validate: (value) => (!value ? 'Device name is required.' : undefined),
    });
    if (p.isCancel(result)) {
      p.cancel('Operation cancelled.');
      return 130;
    }
    target = result;
  }
  if (command === 'ios') {
    const match = availableDevices.find((device) => device.id === target || device.name === target);
    target = match?.id || target;
  }
  const commands = command === 'android' ? buildAndroidCommands(target, options) : buildIOSBootCommands(target);
  return executeCommands(p, pc, commands, { command, target, options }, {
    ...options,
    requirements: command === 'android' ? ['emulator'] : ['open', 'xcrun'],
  });
}

module.exports = {
  handleDeviceCommand,
  handleDeviceList,
};
