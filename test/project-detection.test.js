// Copyright (c) 2026 bachbnt

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { detectProject } = require('../src/projects/detect');

function fixture() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'devcmd-detect-'));
}

test('detectProject detects Node framework and package manager from a child directory', () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name: 'web-app',
    dependencies: { next: '^16.0.0' },
    scripts: { dev: 'next dev', build: 'next build', test: 'node --test' },
  }));
  fs.writeFileSync(path.join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
  fs.mkdirSync(path.join(root, 'src'));

  const project = detectProject(path.join(root, 'src'));
  assert.equal(project.type, 'next');
  assert.equal(project.packageManager, 'pnpm');
  assert.equal(project.root, root);
});

test('detectProject detects Python frameworks', () => {
  const fastapi = fixture();
  fs.writeFileSync(path.join(fastapi, 'pyproject.toml'), 'dependencies = ["fastapi>=0.115"]');
  assert.equal(detectProject(fastapi).type, 'fastapi');

  const django = fixture();
  fs.writeFileSync(path.join(django, 'manage.py'), '');
  assert.equal(detectProject(django).type, 'django');
});

test('detectProject prefers Flutter over nested Android files', () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, 'pubspec.yaml'), 'name: app');
  fs.writeFileSync(path.join(root, 'gradlew'), '');
  assert.equal(detectProject(root).type, 'flutter');
});

test('detectProject reports unsupported directories', () => {
  assert.throws(() => detectProject(fixture()), /No supported project/);
});
