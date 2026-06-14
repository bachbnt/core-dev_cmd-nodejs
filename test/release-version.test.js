// Copyright (c) 2026 bachbnt

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseVersion, resolveVersion } = require('../scripts/release-version');

test('release version resolves automatic increments', () => {
  assert.equal(resolveVersion('1.2.3', 'patch'), '1.2.4');
  assert.equal(resolveVersion('1.2.3', 'minor'), '1.3.0');
  assert.equal(resolveVersion('1.2.3', 'major'), '2.0.0');
});

test('release version accepts current and explicit semantic versions', () => {
  assert.equal(resolveVersion('1.2.3', 'current'), '1.2.3');
  assert.equal(resolveVersion('1.2.3', 'v1.4.0'), '1.4.0');
  assert.equal(resolveVersion('1.2.3-beta.1', 'patch'), '1.2.3');
});

test('release version rejects invalid or older versions', () => {
  assert.throws(() => parseVersion('1.2'), /Invalid semantic version/);
  assert.throws(() => resolveVersion('1.2.3', '1.2.2'), /older than current/);
  assert.doesNotThrow(() => resolveVersion('1.2.3-beta.2', '1.2.3-beta.10'));
  assert.throws(
    () => resolveVersion('1.2.3-beta.10', '1.2.3-beta.2'),
    /older than current/
  );
});
