// Copyright (c) 2026 bachbnt

const test = require('node:test');
const assert = require('node:assert/strict');
const { inspectProject } = require('../src/commands/inspect');

test('inspect reports lifecycle commands from the project adapter', () => {
  const inspection = inspectProject({
    name: 'site',
    type: 'next',
    root: '/tmp/site',
    packageManager: 'pnpm',
    packageJson: {
      scripts: {
        dev: 'next dev',
        lint: 'next lint',
        test: 'node --test',
        build: 'next build',
      },
    },
  }, { editor: 'code', python: 'python3' });

  assert.equal(inspection.packageManager, 'pnpm');
  assert.match(inspection.actions.find((action) => action.action === 'run').command, /pnpm run dev/);
  assert.match(inspection.actions.find((action) => action.action === 'check').command, /pnpm run lint/);
});

test('inspect marks unsupported actions without failing the whole inspection', () => {
  const inspection = inspectProject({
    name: 'ios-app',
    type: 'ios',
    root: '/tmp/ios',
    xcode: { kind: 'project', file: 'App.xcodeproj' },
  }, { editor: 'code' });
  const run = inspection.actions.find((action) => action.action === 'run');
  assert.equal(run.available, false);
  assert.match(run.reason, /scheme and destination/);
});
