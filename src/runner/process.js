// Copyright (c) 2026 bachbnt

const { spawn } = require('child_process');

const SIGNAL_EXIT_CODES = {
  SIGINT: 130,
  SIGTERM: 143,
};

function runProcess(command, options = {}) {
  const spawnImpl = options.spawnImpl || spawn;
  const signalSource = options.signalSource || process;
  const stdio = options.stdio || 'inherit';

  return new Promise((resolve) => {
    let settled = false;
    let forwardedSignal;
    let child;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      signalSource.removeListener('SIGINT', onSigint);
      signalSource.removeListener('SIGTERM', onSigterm);
      resolve(result);
    };

    const forwardSignal = (signal) => {
      forwardedSignal = signal;
      if (child && !child.killed) child.kill(signal);
    };
    const onSigint = () => forwardSignal('SIGINT');
    const onSigterm = () => forwardSignal('SIGTERM');

    try {
      child = spawnImpl(command.executable, command.args, {
        shell: false,
        stdio,
      });
    } catch (error) {
      finish({ ok: false, exitCode: error.code === 'ENOENT' ? 127 : 1, error });
      return;
    }

    signalSource.once('SIGINT', onSigint);
    signalSource.once('SIGTERM', onSigterm);

    child.once('error', (error) => {
      finish({ ok: false, exitCode: error.code === 'ENOENT' ? 127 : 1, error });
    });
    child.once('exit', (code, signal) => {
      const finalSignal = signal || forwardedSignal;
      if (finalSignal) {
        finish({
          ok: false,
          exitCode: SIGNAL_EXIT_CODES[finalSignal] || 1,
          signal: finalSignal,
        });
        return;
      }
      finish({ ok: code === 0, exitCode: code ?? 1 });
    });
  });
}

async function runSequence(commands, options = {}) {
  for (let index = 0; index < commands.length; index += 1) {
    const result = await runProcess(commands[index], options);
    if (!result.ok) return { ...result, failedCommand: commands[index], failedIndex: index };
  }
  return { ok: true, exitCode: 0 };
}

module.exports = {
  SIGNAL_EXIT_CODES,
  runProcess,
  runSequence,
};
