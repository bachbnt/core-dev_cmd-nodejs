// Copyright (c) 2026 bachbnt

const fs = require('fs');
const path = require('path');

function exists(root, name, fsImpl = fs) {
  return fsImpl.existsSync(path.join(root, name));
}

function readJson(file, fsImpl = fs) {
  return JSON.parse(fsImpl.readFileSync(file, 'utf8'));
}

function detectPackageManager(root, packageJson = {}, fsImpl = fs) {
  if (exists(root, 'pnpm-lock.yaml', fsImpl)) return 'pnpm';
  if (exists(root, 'yarn.lock', fsImpl)) return 'yarn';
  if (exists(root, 'bun.lock', fsImpl) || exists(root, 'bun.lockb', fsImpl)) return 'bun';
  if (exists(root, 'package-lock.json', fsImpl)) return 'npm';
  const declared = packageJson.packageManager?.split('@')[0];
  return ['npm', 'pnpm', 'yarn', 'bun'].includes(declared) ? declared : 'npm';
}

function detectNodeType(packageJson) {
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  if (dependencies.next) return 'next';
  if (dependencies.nuxt) return 'nuxt';
  if (dependencies['@nestjs/core']) return 'nest';
  if (dependencies.expo) return 'react_native';
  if (dependencies['react-native']) return 'react_native_bare';
  if (dependencies.vue) return 'vue';
  if (dependencies.react) return 'react';
  if (dependencies.express) return 'express';
  return 'node';
}

function readPyproject(root, fsImpl = fs) {
  try {
    return fsImpl.readFileSync(path.join(root, 'pyproject.toml'), 'utf8').toLowerCase();
  } catch (error) {
    return '';
  }
}

function findXcodeContainer(root, fsImpl = fs) {
  try {
    const entries = fsImpl.readdirSync(root);
    const workspace = entries.find((entry) => entry.endsWith('.xcworkspace'));
    if (workspace) return { kind: 'workspace', file: workspace };
    const project = entries.find((entry) => entry.endsWith('.xcodeproj'));
    if (project) return { kind: 'project', file: project };
  } catch (error) {
    return undefined;
  }
  return undefined;
}

function detectAtRoot(root, fsImpl = fs) {
  if (exists(root, 'package.json', fsImpl)) {
    const packageJson = readJson(path.join(root, 'package.json'), fsImpl);
    return {
      type: detectNodeType(packageJson),
      name: packageJson.name || path.basename(root),
      root,
      packageJson,
      packageManager: detectPackageManager(root, packageJson, fsImpl),
    };
  }

  if (exists(root, 'pubspec.yaml', fsImpl)) {
    return { type: 'flutter', name: path.basename(root), root };
  }

  if (exists(root, 'gradlew', fsImpl) || exists(root, 'gradlew.bat', fsImpl)) {
    return { type: 'android', name: path.basename(root), root };
  }

  const xcode = findXcodeContainer(root, fsImpl);
  if (xcode) return { type: 'ios', name: path.basename(root), root, xcode };

  if (exists(root, 'manage.py', fsImpl)) {
    return { type: 'django', name: path.basename(root), root };
  }

  if (exists(root, 'pyproject.toml', fsImpl)) {
    const pyproject = readPyproject(root, fsImpl);
    let type = 'python';
    if (/\bfastapi(?:\[|[<>=\s"])/.test(pyproject)) type = 'fastapi';
    else if (/\bflask(?:[<>=\s"])/.test(pyproject)) type = 'flask';
    else if (/\bdjango(?:[<>=\s"])/.test(pyproject)) type = 'django';
    return { type, name: path.basename(root), root };
  }

  return undefined;
}

function detectProject(start = process.cwd(), options = {}) {
  const fsImpl = options.fsImpl || fs;
  let current = path.resolve(start);
  try {
    if (!fsImpl.statSync(current).isDirectory()) current = path.dirname(current);
  } catch (error) {
    throw new Error(`Project path does not exist: ${current}`);
  }

  while (true) {
    const project = detectAtRoot(current, fsImpl);
    if (project) return project;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error(`No supported project was detected from: ${path.resolve(start)}`);
}

module.exports = {
  detectAtRoot,
  detectNodeType,
  detectPackageManager,
  detectProject,
  findXcodeContainer,
};
