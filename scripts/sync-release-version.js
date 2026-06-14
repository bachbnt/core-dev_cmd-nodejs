#!/usr/bin/env node
// Copyright (c) 2026 bachbnt

const fs = require('node:fs');
const path = require('node:path');
const { parseVersion } = require('./release-version');

const START_MARKER = '<!-- devcmd-release-version:start -->';
const END_MARKER = '<!-- devcmd-release-version:end -->';
const TAG_PATTERN = /v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?/g;

function updateReleaseVersion(content, version) {
  const tag = `v${parseVersion(version).value}`;
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('README release version markers are missing or invalid.');
  }
  if (
    content.indexOf(START_MARKER, start + START_MARKER.length) !== -1 ||
    content.indexOf(END_MARKER, end + END_MARKER.length) !== -1
  ) {
    throw new Error('README must contain exactly one release version block.');
  }

  const blockStart = start + START_MARKER.length;
  const block = content.slice(blockStart, end);
  const currentTags = [...new Set(block.match(TAG_PATTERN) || [])];
  if (currentTags.length === 0) {
    throw new Error('README release version block does not contain a version tag.');
  }

  const updatedBlock = block.replace(TAG_PATTERN, tag);
  const updated = `${content.slice(0, blockStart)}${updatedBlock}${content.slice(end)}`;
  return {
    changed: updated !== content,
    content: updated,
    currentTags,
    tag,
  };
}

function syncReadmeVersion(version, options = {}) {
  const root = options.root || path.join(__dirname, '..');
  const file = options.file || path.join(root, 'README.md');
  const content = fs.readFileSync(file, 'utf8');
  const result = updateReleaseVersion(content, version);

  if (options.check && result.changed) {
    throw new Error(`README release version is ${result.currentTags.join(', ')}; expected ${result.tag}.`);
  }
  if (options.write && result.changed) fs.writeFileSync(file, result.content);
  return { ...result, file };
}

if (require.main === module) {
  try {
    const [version, ...flags] = process.argv.slice(2);
    if (!version || flags.some((flag) => !['--check', '--dry-run'].includes(flag))) {
      throw new Error('Usage: sync-release-version.js <version> [--check|--dry-run]');
    }
    if (flags.includes('--check') && flags.includes('--dry-run')) {
      throw new Error('--check and --dry-run cannot be used together.');
    }

    const check = flags.includes('--check');
    const dryRun = flags.includes('--dry-run');
    const result = syncReadmeVersion(version, { check, write: !check && !dryRun });
    const relativeFile = path.relative(path.join(__dirname, '..'), result.file);

    if (check) console.log(`${relativeFile} matches ${result.tag}.`);
    else if (result.changed) {
      const verb = dryRun ? 'will update' : 'updated';
      console.log(`${relativeFile} ${verb}: ${result.currentTags.join(', ')} -> ${result.tag}`);
    } else console.log(`${relativeFile} already matches ${result.tag}.`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  syncReadmeVersion,
  updateReleaseVersion,
};
