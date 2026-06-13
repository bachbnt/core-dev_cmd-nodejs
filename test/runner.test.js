// Copyright (c) 2026 bachbnt

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { runProcess, runSequence } = require('../src/runner/process');

function createChild() {
  const child = new EventEmitter();
  child.killed = false;
  child.kill = (signal) => {
    child.killed = true;
    child.emit('exit', null, signal);
    return true;
  };
  return child;
}

test('runner invokes executable and args with shell disabled', async () => {
  let invocation;
  const result = await runProcess(
    { executable: 'npm', args: ['create', 'vite@latest', 'app'] },
    {
      signalSource: new EventEmitter(),
      spawnImpl(executable, args, options) {
        invocation = { executable, args, options };
        const child = createChild();
        process.nextTick(() => child.emit('exit', 0, null));
        return child;
      },
    }
  );
  assert.equal(result.exitCode, 0);
  assert.deepEqual(invocation, {
    executable: 'npm',
    args: ['create', 'vite@latest', 'app'],
    options: { shell: false, stdio: 'inherit' },
  });
});

test('runner maps executable-not-found to exit code 127', async () => {
  const result = await runProcess(
    { executable: 'missing-command', args: [] },
    {
      signalSource: new EventEmitter(),
      spawnImpl() {
        const child = createChild();
        process.nextTick(() => {
          const error = new Error('spawn missing-command ENOENT');
          error.code = 'ENOENT';
          child.emit('error', error);
        });
        return child;
      },
    }
  );
  assert.equal(result.ok, false);
  assert.equal(result.exitCode, 127);
});

test('runner forwards SIGINT and returns conventional exit code 130', async () => {
  const signalSource = new EventEmitter();
  const child = createChild();
  const promise = runProcess(
    { executable: 'long-task', args: [] },
    { signalSource, spawnImpl: () => child }
  );
  signalSource.emit('SIGINT');
  const result = await promise;
  assert.equal(child.killed, true);
  assert.equal(result.signal, 'SIGINT');
  assert.equal(result.exitCode, 130);
});

test('sequence stops at the first failed process and preserves exit code', async () => {
  const invoked = [];
  const result = await runSequence(
    [
      { executable: 'first', args: [] },
      { executable: 'second', args: [] },
      { executable: 'third', args: [] },
    ],
    {
      signalSource: new EventEmitter(),
      spawnImpl(executable) {
        invoked.push(executable);
        const child = createChild();
        process.nextTick(() => child.emit('exit', executable === 'second' ? 7 : 0, null));
        return child;
      },
    }
  );
  assert.deepEqual(invoked, ['first', 'second']);
  assert.equal(result.exitCode, 7);
  assert.equal(result.failedIndex, 1);
});
