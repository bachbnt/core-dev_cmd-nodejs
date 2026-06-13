// Copyright (c) 2026 bachbnt

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseArgs,
  validateCommandFlags,
  validateFrameworkOptions,
  validateProjectName,
} = require('../src/utils/args');

test('parseArgs reads target and project presets', () => {
  const result = parseArgs(['next', 'my-app', '--typescript', '--pnpm', '--no-git', '--eslint']);
  assert.equal(result.command, 'next');
  assert.deepEqual(result.options, {
    dryRun: false,
    coldBoot: false,
    shutdownAll: false,
    target: 'my-app',
    typescript: true,
    packageManager: 'pnpm',
    git: false,
    eslint: true,
  });
});

test('parseArgs supports long package manager option', () => {
  const result = parseArgs(['react', 'app', '--package-manager', 'bun', '--dry-run']);
  assert.equal(result.options.packageManager, 'bun');
  assert.equal(result.options.dryRun, true);
});

test('parseArgs rejects unsupported and incomplete options', () => {
  assert.throws(() => parseArgs(['react', 'app', '--unknown']), /Unsupported option/);
  assert.throws(() => parseArgs(['react', 'app', '--pm']), /Package manager must be one of/);
  assert.throws(() => parseArgs(['react', 'app', 'extra']), /Unsupported option/);
});

test('command flag validation limits device flags', () => {
  const base = parseArgs(['react', 'app']).options;
  assert.throws(
    () => validateCommandFlags('react', { ...base, coldBoot: true }),
    /only supported by the android command/
  );
  assert.throws(
    () => validateCommandFlags('android', { ...base, shutdownAll: true }),
    /only supported by the ios command/
  );
});

test('framework validation enforces capabilities', () => {
  assert.throws(
    () => validateFrameworkOptions('flutter', { typescript: true }),
    /does not support selecting TypeScript/
  );
  assert.throws(
    () => validateFrameworkOptions('react_native_bare', { packageManager: 'pnpm' }),
    /supports package managers: npm, yarn, bun/
  );
  assert.doesNotThrow(() =>
    validateFrameworkOptions('next', {
      typescript: true,
      packageManager: 'npm',
      git: true,
      eslint: true,
    })
  );
});

test('project name validation rejects shell metacharacters', () => {
  assert.doesNotThrow(() => validateProjectName('safe-app_1.0'));
  assert.throws(() => validateProjectName('app;rm -rf'), /Invalid project name/);
  assert.throws(() => validateProjectName(''), /required/);
});
