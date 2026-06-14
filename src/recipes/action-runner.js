#!/usr/bin/env node
// Copyright (c) 2026 bachbnt

const fs = require('fs');
const path = require('path');

const [action, source, value] = process.argv.slice(2);

try {
  if (action === 'mkdir') {
    fs.mkdirSync(source, { recursive: true });
  } else if (action === 'write') {
    fs.mkdirSync(path.dirname(source), { recursive: true });
    fs.writeFileSync(source, Buffer.from(value || '', 'base64').toString('utf8'), { flag: 'wx' });
  } else if (action === 'copy') {
    fs.mkdirSync(path.dirname(value), { recursive: true });
    fs.cpSync(source, value, { recursive: true, errorOnExist: true, force: false });
  } else {
    throw new Error(`Unsupported recipe action: ${action}`);
  }
} catch (error) {
  console.error(`Unable to execute recipe action: ${error.message}`);
  process.exitCode = 1;
}
