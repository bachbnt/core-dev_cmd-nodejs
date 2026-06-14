// Copyright (c) 2026 bachbnt

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function findExecutable(executable, options = {}) {
  const env = options.env || process.env;
  const fsImpl = options.fsImpl || fs;
  if (executable.includes(path.sep)) {
    const candidate = path.resolve(options.cwd || process.cwd(), executable);
    return fsImpl.existsSync(candidate) ? candidate : undefined;
  }

  const extensions = process.platform === 'win32'
    ? (env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';')
    : [''];
  for (const directory of (env.PATH || '').split(path.delimiter).filter(Boolean)) {
    for (const extension of extensions) {
      const candidate = path.join(directory, `${executable}${extension}`);
      try {
        fsImpl.accessSync(candidate, fs.constants.X_OK);
        return candidate;
      } catch (error) {
        // Continue searching PATH.
      }
    }
  }
  return undefined;
}

function getVersion(executable, args = ['--version'], options = {}) {
  const spawnSyncImpl = options.spawnSyncImpl || spawnSync;
  const result = spawnSyncImpl(executable, args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) return undefined;
  const output = `${result.stdout || result.stderr || ''}`.trim();
  try {
    const data = JSON.parse(output);
    return data.frameworkVersion || data.version || 'available';
  } catch (error) {
    return output
      .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '')
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) || 'available';
  }
}

function checkTools(config, options = {}) {
  const tools = [
    { name: 'Node.js', executable: 'node', args: ['--version'], required: true },
    { name: 'npm', executable: 'npm', args: ['--version'], required: true },
    { name: 'Git', executable: 'git', args: ['--version'], required: true },
    { name: 'pnpm', executable: 'pnpm', args: ['--version'] },
    { name: 'Yarn', executable: 'yarn', args: ['--version'] },
    { name: 'Bun', executable: 'bun', args: ['--version'] },
    { name: 'Python', executable: config.python, args: ['--version'] },
    { name: 'Flutter', executable: 'flutter', args: ['--version', '--machine'] },
    { name: 'Android adb', executable: 'adb', args: ['version'] },
    { name: 'Android emulator', executable: 'emulator', args: ['-version'] },
  ];
  if (process.platform === 'darwin') {
    tools.push({ name: 'Xcode', executable: 'xcodebuild', args: ['-version'] });
  }

  return tools.map((tool) => {
    const found = findExecutable(tool.executable, options);
    return {
      ...tool,
      found: Boolean(found),
      path: found,
      version: found ? getVersion(tool.executable, tool.args, options) : undefined,
    };
  });
}

function assertExecutables(requirements, options = {}) {
  const missing = [...new Set(requirements)].filter(
    (executable) => !findExecutable(executable, options)
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing required executable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Run dev doctor for setup details.`
    );
  }
}

module.exports = {
  assertExecutables,
  checkTools,
  findExecutable,
  getVersion,
};
