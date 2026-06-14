// Copyright (c) 2026 bachbnt

const { frameworkDefinitions } = require('../config');

const SYSTEM_COMMANDS = [
  'doctor',
  'inspect',
  'install',
  'run',
  'test',
  'build',
  'clean',
  'check',
  'open',
  'devices',
  'android',
  'ios',
  'history',
  'again',
  'projects',
  'recipes',
  'config',
  'completion',
  'help',
];
const COMMANDS = [...Object.keys(frameworkDefinitions), ...SYSTEM_COMMANDS];

const OPTIONS = [
  '--dry-run', '--typescript', '--javascript', '--npm', '--pnpm', '--yarn', '--bun',
  '--git', '--no-git', '--eslint', '--no-eslint', '--no-install', '--python', '--editor',
  '--cold-boot', '--shutdown-all', '--set',
];

function commandNames(definitions = frameworkDefinitions) {
  return [...Object.keys(definitions), ...SYSTEM_COMMANDS];
}

function bashCompletion(definitions) {
  const commands = commandNames(definitions);
  return `_devcmd_completion() {
  local current
  current="\${COMP_WORDS[COMP_CWORD]}"
  if [[ \${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "${commands.join(' ')}" -- "\${current}") )
  else
    COMPREPLY=( $(compgen -W "${OPTIONS.join(' ')}" -- "\${current}") )
  fi
}
complete -F _devcmd_completion dev devcmd
`;
}

function zshCompletion(definitions) {
  const commands = commandNames(definitions);
  return `#compdef dev devcmd

_devcmd() {
  local -a commands options
  commands=(${commands.map((command) => `'${command}'`).join(' ')})
  options=(${OPTIONS.map((option) => `'${option}'`).join(' ')})

  if (( CURRENT == 2 )); then
    _describe 'command' commands
  else
    _describe 'option' options
    _files
  fi
}

compdef _devcmd dev devcmd
`;
}

function getCompletion(shell, definitions = frameworkDefinitions) {
  if (shell === 'bash') return bashCompletion(definitions);
  if (shell === 'zsh') return zshCompletion(definitions);
  throw new Error('Completion supports: bash, zsh.');
}

module.exports = {
  COMMANDS,
  OPTIONS,
  SYSTEM_COMMANDS,
  commandNames,
  getCompletion,
};
