// Copyright (c) 2026 bachbnt

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Claude Code and Codex discover the canonical AI skills', {
  skip: process.platform === 'win32' ? 'Git symlink behavior depends on Windows configuration.' : false,
}, () => {
  const root = path.join(__dirname, '..');
  for (const directory of ['.agents', '.claude']) {
    const link = path.join(root, directory, 'skills');
    assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
    assert.equal(fs.readlinkSync(link), '../.ai/skills');
  }

  const skills = fs.readdirSync(path.join(root, '.ai', 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('devcmd-'));
  assert.equal(skills.length, 7);
  for (const skill of skills) {
    assert.equal(fs.existsSync(path.join(root, '.ai', 'skills', skill.name, 'SKILL.md')), true);
  }
});
