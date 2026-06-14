// Copyright (c) 2026 bachbnt

const { HISTORY_FILE, frameworkDefinitions } = require('../config');
const { buildAndroidCommands, buildIOSBootCommands, buildIOSShutdownCommands } = require('../commands/devices');
const { buildFrameworkCommands } = require('../commands/frameworks');
const { getHistoryDisplay, readHistory } = require('../commands/history');
const { isCommandSequence } = require('../runner/command');
const { executeCommands } = require('../runtime/execute');

function rebuildHistoryCommands(entry) {
  if (isCommandSequence(entry.commands)) return entry.commands;
  if (frameworkDefinitions[entry.command] && entry.target) {
    return buildFrameworkCommands(entry.command, entry.target, entry.options || {});
  }
  if (entry.command === 'android' && entry.target) return buildAndroidCommands(entry.target, entry.options || {});
  if (entry.command === 'ios' && entry.action === 'shutdown-all') return buildIOSShutdownCommands();
  if (entry.command === 'ios' && entry.target) return buildIOSBootCommands(entry.target);
  throw new Error('This legacy history entry cannot be replayed safely. Run the command again directly.');
}

function handleHistory(context) {
  const { p } = context;
  const history = readHistory().slice(0, 10);
  if (history.length === 0) {
    p.outro('No successful commands in history yet.');
    return 0;
  }
  p.note(
    history.map((entry, index) => `${index + 1}. ${getHistoryDisplay(entry)}\n   ${entry.executedAt}`).join('\n'),
    'Recent commands'
  );
  p.outro(`History file: ${HISTORY_FILE}`);
  return 0;
}

function handleAgain(context) {
  const { p, pc, options } = context;
  const latest = readHistory()[0];
  if (!latest) throw new Error('No command is available to run again.');
  return executeCommands(
    p,
    pc,
    rebuildHistoryCommands(latest),
    { command: 'again', source: latest.command },
    options
  );
}

module.exports = {
  handleAgain,
  handleHistory,
  rebuildHistoryCommands,
};
