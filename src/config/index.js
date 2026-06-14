// Copyright (c) 2026 bachbnt

const os = require('os');
const path = require('path');
const { version } = require('../../package.json');

const BRAND = 'DevCmd';
const CONFIG_FILE = path.join(os.homedir(), '.devcmd', 'config.json');
const HISTORY_FILE = path.join(os.homedir(), '.devcmd', 'history.json');
const PROJECTS_FILE = path.join(os.homedir(), '.devcmd', 'projects.json');
const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'];
const DEFAULT_DEVICES = {
  android: 'Pixel_9_Pro_Fold',
  ios: 'iPhone 17 Pro',
};

const frameworkDefinitions = {
  flutter: {
    description: 'Flutter CLI',
    capabilities: { git: true, noInstall: true },
  },
  react: {
    description: 'React app from scratch, powered by Vite',
    capabilities: { language: true, packageManager: true, git: true, noInstall: true },
  },
  react_native: {
    description: 'React Native app powered by Expo (recommended)',
    capabilities: { language: true, packageManager: true, git: true, noInstall: true },
  },
  react_native_bare: {
    description: 'Bare React Native app via Community CLI',
    capabilities: { packageManager: ['npm', 'yarn', 'bun'], git: true, noInstall: true },
  },
  next: {
    description: 'Next.js create-next-app',
    capabilities: { language: true, packageManager: true, git: true, eslint: true, noInstall: true },
  },
  nuxt: {
    description: 'Nuxt full-stack Vue framework',
    capabilities: { packageManager: true, git: true, noInstall: true },
  },
  vue: {
    description: 'Official create-vue scaffolder',
    capabilities: { language: true, packageManager: true, git: true, eslint: true, noInstall: true },
  },
  express: {
    description: 'Official Express generator',
    capabilities: { git: true, noInstall: true },
  },
  nest: {
    description: 'Nest CLI',
    capabilities: { language: true, packageManager: true, git: true, noInstall: true },
  },
  django: {
    description: 'Django full-stack Python framework',
    capabilities: { git: true, python: true },
  },
  fastapi: {
    description: 'FastAPI Python API framework',
    capabilities: { git: true, python: true, noInstall: true },
  },
  flask: {
    description: 'Flask lightweight Python web framework',
    capabilities: { git: true, python: true, noInstall: true },
  },
};

module.exports = {
  BRAND,
  CONFIG_FILE,
  DEFAULT_DEVICES,
  HISTORY_FILE,
  PACKAGE_MANAGERS,
  PROJECTS_FILE,
  VERSION: version,
  frameworkDefinitions,
};
