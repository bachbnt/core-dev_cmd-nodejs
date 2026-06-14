// Copyright (c) 2026 bachbnt

const { createHistoryEntry, saveHistory } = require('../commands/history');
const { recordProject } = require('../projects/recent');
const { assertExecutables } = require('../runner/check');
const { formatSequence } = require('../runner/command');
const { runSequence } = require('../runner/process');

function describeFailure(result) {
  if (result.signal === 'SIGINT') return 'Command cancelled by user.';
  if (result.signal) return `Command stopped by ${result.signal}.`;
  if (result.error?.code === 'ENOENT') {
    return `Executable "${result.failedCommand.executable}" was not found in PATH.`;
  }
  if (result.error) return `Unable to start command: ${result.error.message}`;
  return `Command exited with code ${result.exitCode}.`;
}

async function executeCommands(p, pc, commands, metadata, options = {}) {
  const commandLine = formatSequence(commands);
  p.log.step(`${options.dryRun ? 'Dry run' : 'Executing'}: ${pc.yellow(commandLine)}`);

  if (options.dryRun) {
    p.outro('No command was executed.');
    return 0;
  }

  try {
    if (options.requirements) assertExecutables(options.requirements);
  } catch (error) {
    p.outro(`${pc.red('✖')} ${error.message}`);
    return 127;
  }

  const result = await runSequence(commands);
  if (!result.ok) {
    p.outro(`${pc.red('✖')} ${describeFailure(result)}`);
    return result.exitCode;
  }

  try {
    saveHistory(createHistoryEntry(metadata, commands));
  } catch (error) {
    p.log.warn(`Command succeeded, but history could not be saved: ${error.message}`);
  }
  if (metadata.projectPath) {
    recordProject({
      name: metadata.projectName,
      type: metadata.projectType || metadata.command,
      path: metadata.projectPath,
    });
  }
  p.outro(`${pc.green('✔')} Command completed successfully.`);
  return 0;
}

module.exports = {
  describeFailure,
  executeCommands,
};
