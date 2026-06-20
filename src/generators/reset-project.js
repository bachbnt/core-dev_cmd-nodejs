#!/usr/bin/env node
// Copyright (c) 2026 bachbnt

const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '.');
const type = process.argv[3] || 'unknown';

const PYTHON_TYPES = new Set(['python', 'django', 'fastapi', 'flask']);

const target = PYTHON_TYPES.has(type)
  ? path.join(root, '.venv')
  : path.join(root, 'node_modules');

fs.rmSync(target, { recursive: true, force: true });
