// Copyright (c) 2026 bachbnt

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseVersion, resolveVersion } = require('../scripts/release-version');

test('release version resolves automatic increments', () => {
  assert.equal(resolveVersion('2.3.0', 'patch'), '2.3.1');
  assert.equal(resolveVersion('2.3.0', 'minor'), '2.4.0');
  assert.equal(resolveVersion('2.3.0', 'major'), '3.0.0');
});

test('release version accepts current and explicit semantic versions', () => {
  assert.equal(resolveVersion('2.3.0', 'current'), '2.3.0');
  assert.equal(resolveVersion('2.3.0', 'v2.5.0'), '2.5.0');
  assert.equal(resolveVersion('2.3.0-beta.1', 'patch'), '2.3.0');
});

test('release version rejects invalid or older versions', () => {
  assert.throws(() => parseVersion('2.3'), /Invalid semantic version/);
  assert.throws(() => resolveVersion('2.3.0', '2.2.9'), /older than current/);
  assert.doesNotThrow(() => resolveVersion('2.3.0-beta.2', '2.3.0-beta.10'));
  assert.throws(
    () => resolveVersion('2.3.0-beta.10', '2.3.0-beta.2'),
    /older than current/
  );
});
