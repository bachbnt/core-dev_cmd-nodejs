// Copyright (c) 2026 bachbnt

const { getAndroidDevices } = require('./android');
const { getIOSDevices } = require('./ios');

function formatDevice(device) {
  return `${device.name} | ${device.runtime} | ${device.status}`;
}

module.exports = {
  formatDevice,
  getAndroidDevices,
  getIOSDevices,
};
