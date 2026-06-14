// Copyright (c) 2026 bachbnt

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { assertExecutables, findExecutable } = require('../src/runner/check');

test('findExecutable searches PATH without a shell', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'devcmd-path-'));
  const executable = path.join(directory, 'my-tool');
  fs.writeFileSync(executable, '#!/bin/sh\n');
  fs.chmodSync(executable, 0o755);
  assert.equal(findExecutable('my-tool', { env: { PATH: directory } }), executable);
  assert.equal(findExecutable('missing', { env: { PATH: directory } }), undefined);
});

test('assertExecutables reports all missing dependencies', () => {
  assert.throws(
    () => assertExecutables(['missing-a', 'missing-b'], { env: { PATH: '' } }),
    /missing-a, missing-b/
  );
});
