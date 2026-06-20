// Copyright (c) 2026 bachbnt

const path = require('path');
const { buildLifecycleCommands } = require('../commands/lifecycle');
const { detectProject } = require('../projects/detect');
const { executeCommands } = require('../runtime/execute');
const { runSequence } = require('../runner/process');

function parseRepo(input) {
  if (/^https?:\/\//.test(input) || /^git@/.test(input)) {
    const name = input.split('/').pop().replace(/\.git$/, '');
    return { url: input, name };
  }
  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(input)) {
    const name = input.split('/')[1];
    return { url: `https://github.com/${input}`, name };
  }
  throw new Error(`Invalid repository: ${input}. Use owner/repo or a full URL.`);
}

async function handleClone(context) {
  const { p, pc, positionals, options, config } = context;
  if (positionals.length === 0 || positionals.length > 2) {
    throw new Error('Usage: dev clone <repo> [directory]');
  }

  const { url, name } = parseRepo(positionals[0]);
  const targetDir = path.resolve(positionals[1] || name);
  const cloneCommand = { executable: 'git', args: ['clone', url, targetDir] };

  p.log.step(`Cloning: ${pc.yellow(url)}`);
  if (options.dryRun) {
    p.log.step(`Dry run: git clone ${url} ${targetDir}`);
    p.outro('No command was executed.');
    return 0;
  }

  const cloneResult = await runSequence([cloneCommand]);
  if (!cloneResult.ok) {
    p.outro(`${pc.red('✖')} Clone failed.`);
    return cloneResult.exitCode;
  }

  let project;
  try {
    project = detectProject(targetDir, { registry: context.recipeRegistry });
  } catch (error) {
    p.log.warn(`Cloned successfully, but project detection failed: ${error.message}`);
    p.outro(`${pc.green('✔')} Cloned to ${targetDir}`);
    return 0;
  }

  p.log.step(`Detected: ${pc.cyan(project.type)}`);

  let installCommands;
  try {
    installCommands = buildLifecycleCommands('install', project, { config });
  } catch (error) {
    p.log.warn(`Cloned successfully, but install is not supported: ${error.message}`);
    p.outro(`${pc.green('✔')} Cloned to ${targetDir}`);
    return 0;
  }

  return executeCommands(p, pc, installCommands, {
    command: 'install',
    projectName: project.name,
    projectPath: project.root,
    projectType: project.type,
    config,
  }, options);
}

module.exports = { handleClone, parseRepo };
