// Copyright (c) 2026 bachbnt

const fs = require('fs');
const path = require('path');
const { PROJECTS_FILE } = require('../config');

function readProjects(options = {}) {
  const file = options.file || PROJECTS_FILE;
  const fsImpl = options.fsImpl || fs;
  try {
    const projects = JSON.parse(fsImpl.readFileSync(file, 'utf8'));
    return Array.isArray(projects) ? projects : [];
  } catch (error) {
    return [];
  }
}

function saveProjects(projects, options = {}) {
  const file = options.file || PROJECTS_FILE;
  const fsImpl = options.fsImpl || fs;
  fsImpl.mkdirSync(path.dirname(file), { recursive: true });
  fsImpl.writeFileSync(file, `${JSON.stringify(projects.slice(0, 50), null, 2)}\n`);
}

function recordProject(project, options = {}) {
  const fsImpl = options.fsImpl || fs;
  const absolutePath = path.resolve(project.path);
  if (!fsImpl.existsSync(absolutePath)) return;

  const projects = readProjects(options).filter((entry) => entry.path !== absolutePath);
  projects.unshift({
    name: project.name || path.basename(absolutePath),
    type: project.type || 'unknown',
    path: absolutePath,
    lastUsedAt: new Date().toISOString(),
  });
  saveProjects(projects, options);
}

function getExistingProjects(options = {}) {
  const fsImpl = options.fsImpl || fs;
  return readProjects(options).filter((project) => fsImpl.existsSync(project.path));
}

module.exports = {
  getExistingProjects,
  readProjects,
  recordProject,
  saveProjects,
};
