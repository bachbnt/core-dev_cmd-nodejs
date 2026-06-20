// Copyright (c) 2026 bachbnt

const { spawn } = require('child_process');
const { SIGNAL_EXIT_CODES } = require('./process');

function runProcessCaptured(command, options = {}) {
  const spawnImpl = options.spawnImpl || spawn;
  return new Promise((resolve) => {
    let settled = false;
    let stdout = '';
    let stderr = '';
    let child;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve({ ...result, stdout, stderr });
    };

    try {
      const spawnOptions = { shell: false, stdio: 'pipe' };
      if (command.cwd) spawnOptions.cwd = command.cwd;
      child = spawnImpl(command.executable, command.args, spawnOptions);
    } catch (error) {
      finish({ ok: false, exitCode: error.code === 'ENOENT' ? 127 : 1, error });
      return;
    }

    child.stdout?.on('data', (data) => { stdout += data.toString(); });
    child.stderr?.on('data', (data) => { stderr += data.toString(); });

    child.once('error', (error) => {
      finish({ ok: false, exitCode: error.code === 'ENOENT' ? 127 : 1, error });
    });
    child.once('exit', (code, signal) => {
      if (signal) {
        finish({ ok: false, exitCode: SIGNAL_EXIT_CODES[signal] || 1, signal });
        return;
      }
      finish({ ok: code === 0, exitCode: code ?? 1 });
    });
  });
}

async function runSequenceCaptured(commands, options = {}) {
  let output = '';
  for (let index = 0; index < commands.length; index += 1) {
    const result = await runProcessCaptured(commands[index], options);
    output += result.stdout + result.stderr;
    if (!result.ok) {
      return { ...result, output, failedCommand: commands[index], failedIndex: index };
    }
  }
  return { ok: true, exitCode: 0, output };
}

module.exports = { runProcessCaptured, runSequenceCaptured };
