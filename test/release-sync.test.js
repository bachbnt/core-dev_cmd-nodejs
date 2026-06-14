// Copyright (c) 2026 bachbnt

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { version } = require('../package.json');
const { updateReleaseVersion } = require('../scripts/sync-release-version');

test('release version synchronization updates only the marked README block', () => {
  const input = [
    'Keep v1.0.0 unchanged.',
    '<!-- devcmd-release-version:start -->',
    'Install `v1.2.3` from refs/tags/v1.2.3.tar.gz.',
    '<!-- devcmd-release-version:end -->',
    '',
  ].join('\n');
  const result = updateReleaseVersion(input, '1.3.0');

  assert.equal(result.changed, true);
  assert.match(result.content, /Keep v1\.0\.0 unchanged/);
  assert.match(result.content, /Install `v1\.3\.0` from refs\/tags\/v1\.3\.0\.tar\.gz/);
});

test('release version synchronization requires one marked version block', () => {
  assert.throws(() => updateReleaseVersion('Install v1.2.3.', '1.3.0'), /markers/);
});

test('README tagged install matches package.json version', () => {
  const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  assert.equal(updateReleaseVersion(readme, version).changed, false);
});
