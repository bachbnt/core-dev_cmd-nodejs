// Copyright (c) 2026 bachbnt

function createCommand(executable, args = [], options = {}) {
  const command = { executable, args: args.map(String) };
  if (options.cwd) command.cwd = options.cwd;
  return command;
}

function formatArgument(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, `'\\''`)}'`;
}

function formatCommand(command) {
  const formatted = [command.executable, ...command.args].map(formatArgument).join(' ');
  return command.cwd ? `(cd ${formatArgument(command.cwd)} && ${formatted})` : formatted;
}

function formatSequence(commands) {
  return commands.map(formatCommand).join(' && ');
}

function isCommand(value) {
  return Boolean(
    value &&
      typeof value.executable === 'string' &&
      Array.isArray(value.args) &&
      value.args.every((arg) => typeof arg === 'string') &&
      (value.cwd === undefined || typeof value.cwd === 'string')
  );
}

function isCommandSequence(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isCommand);
}

module.exports = {
  createCommand,
  formatCommand,
  formatSequence,
  isCommandSequence,
};
