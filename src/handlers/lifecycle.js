// Copyright (c) 2026 bachbnt

const { buildLifecycleCommands, buildOpenCommands } = require('../commands/lifecycle');
const { inspectProject } = require('../commands/inspect');
const { detectProject } = require('../projects/detect');
const { getExistingProjects } = require('../projects/recent');
const { executeCommands } = require('../runtime/execute');

const LIFECYCLE_COMMANDS = ['install', 'run', 'test', 'build', 'check', 'clean', 'open'];

function resolveLifecycleTarget(command, positionals) {
  if (command === 'open' && positionals[0] === 'recent') {
    if (positionals.length > 1) throw new Error('Usage: dev open recent');
    const recent = getExistingProjects()[0];
    if (!recent) throw new Error('No recent project is available.');
    return { projectPath: recent.path };
  }
  if (command === 'open' && ['android', 'ios'].includes(positionals[0])) {
    if (positionals.length > 2) throw new Error(`Usage: dev open ${positionals[0]} [path]`);
    return { openMode: positionals[0], projectPath: positionals[1] || process.cwd() };
  }
  if (positionals.length > 1) throw new Error(`Usage: dev ${command} [path]`);
  return { projectPath: positionals[0] || process.cwd() };
}

async function handleLifecycle(context) {
  const { p, pc, command, positionals, options, config } = context;
  const { projectPath, openMode } = resolveLifecycleTarget(command, positionals);
  const project = detectProject(projectPath);
  const commands = command === 'open'
    ? buildOpenCommands(project, openMode, { ...config, editor: options.editor || config.editor })
    : buildLifecycleCommands(command, project, { config });

  return executeCommands(p, pc, commands, {
    command,
    projectName: project.name,
    projectPath: project.root,
    projectType: project.type,
  }, options);
}

function handleInspect(context) {
  const { p, positionals, config } = context;
  if (positionals.length > 1) throw new Error('Usage: dev inspect [path]');
  const inspection = inspectProject(detectProject(positionals[0] || process.cwd()), config);
  const lines = [
    `Name: ${inspection.name}`,
    `Type: ${inspection.type}`,
    `Root: ${inspection.root}`,
  ];
  if (inspection.packageManager) lines.push(`Package manager: ${inspection.packageManager}`);
  if (inspection.xcode) lines.push(`Xcode: ${inspection.xcode.kind} ${inspection.xcode.file}`);
  lines.push('');
  for (const action of inspection.actions) {
    lines.push(
      action.available
        ? `${action.action.padEnd(8)} ${action.command}`
        : `${action.action.padEnd(8)} unavailable: ${action.reason}`
    );
  }
  p.note(lines.join('\n'), 'Detected project');
  p.outro('Inspection complete.');
  return 0;
}

module.exports = {
  LIFECYCLE_COMMANDS,
  handleInspect,
  handleLifecycle,
  resolveLifecycleTarget,
};
