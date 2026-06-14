#!/usr/bin/env node
// Copyright (c) 2026 bachbnt

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

function parseVersion(value) {
  const normalized = String(value).replace(/^v/, '');
  const match = normalized.match(SEMVER_PATTERN);
  if (!match) throw new Error(`Invalid semantic version: ${value}`);
  return {
    value: normalized,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  };
}

function compareVersions(left, right) {
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] - right[key];
  }
  if (left.prerelease && !right.prerelease) return -1;
  if (!left.prerelease && right.prerelease) return 1;
  if (!left.prerelease && !right.prerelease) return 0;

  const leftParts = left.prerelease.split('.');
  const rightParts = right.prerelease.split('.');
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    if (leftParts[index] === undefined) return -1;
    if (rightParts[index] === undefined) return 1;
    if (leftParts[index] === rightParts[index]) continue;

    const leftNumeric = /^\d+$/.test(leftParts[index]);
    const rightNumeric = /^\d+$/.test(rightParts[index]);
    if (leftNumeric && rightNumeric) return Number(leftParts[index]) - Number(rightParts[index]);
    if (leftNumeric) return -1;
    if (rightNumeric) return 1;
    return leftParts[index].localeCompare(rightParts[index]);
  }
  return 0;
}

function resolveVersion(currentValue, selection) {
  const current = parseVersion(currentValue);
  let nextValue;

  if (selection === 'current') nextValue = current.value;
  else if (selection === 'major') nextValue = `${current.major + 1}.0.0`;
  else if (selection === 'minor') nextValue = `${current.major}.${current.minor + 1}.0`;
  else if (selection === 'patch') {
    nextValue = current.prerelease
      ? `${current.major}.${current.minor}.${current.patch}`
      : `${current.major}.${current.minor}.${current.patch + 1}`;
  } else nextValue = parseVersion(selection).value;

  const next = parseVersion(nextValue);
  if (compareVersions(next, current) < 0) {
    throw new Error(`Release version ${next.value} is older than current version ${current.value}.`);
  }
  return next.value;
}

if (require.main === module) {
  try {
    const [current, selection] = process.argv.slice(2);
    if (!current || !selection) throw new Error('Usage: release-version.js <current> <selection>');
    process.stdout.write(`${resolveVersion(current, selection)}\n`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  compareVersions,
  parseVersion,
  resolveVersion,
};
