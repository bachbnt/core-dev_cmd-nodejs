// Copyright (c) 2026 bachbnt

const { frameworkDefinitions } = require('../config');

const COMMANDS = [
  ...Object.keys(frameworkDefinitions),
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
  'config',
  'completion',
  'help',
];

const OPTIONS = [
  '--dry-run', '--typescript', '--javascript', '--npm', '--pnpm', '--yarn', '--bun',
  '--git', '--no-git', '--eslint', '--no-eslint', '--no-install', '--python', '--editor',
  '--cold-boot', '--shutdown-all',
];

function bashCompletion() {
  return `_devcmd_completion() {
  local current
  current="\${COMP_WORDS[COMP_CWORD]}"
  if [[ \${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "${COMMANDS.join(' ')}" -- "\${current}") )
  else
    COMPREPLY=( $(compgen -W "${OPTIONS.join(' ')}" -- "\${current}") )
  fi
}
complete -F _devcmd_completion dev
`;
}

function zshCompletion() {
  return `#compdef dev

_devcmd() {
  local -a commands options
  commands=(${COMMANDS.map((command) => `'${command}'`).join(' ')})
  options=(${OPTIONS.map((option) => `'${option}'`).join(' ')})

  if (( CURRENT == 2 )); then
    _describe 'command' commands
  else
    _describe 'option' options
    _files
  fi
}

compdef _devcmd dev
`;
}

function getCompletion(shell) {
  if (shell === 'bash') return bashCompletion();
  if (shell === 'zsh') return zshCompletion();
  throw new Error('Completion supports: bash, zsh.');
}

module.exports = {
  COMMANDS,
  OPTIONS,
  getCompletion,
};
