// Copyright (c) 2026 bachbnt

const {
  BRAND,
  DEFAULT_DEVICES,
  HISTORY_FILE,
  PACKAGE_MANAGERS,
  VERSION,
  frameworkDefinitions,
} = require('./config');
const {
  buildAndroidCommands,
  buildIOSBootCommands,
  buildIOSShutdownCommands,
} = require('./commands/devices');
const { buildFrameworkCommands } = require('./commands/frameworks');
const {
  createHistoryEntry,
  getHistoryDisplay,
  readHistory,
  saveHistory,
} = require('./commands/history');
const { formatDevice, getAndroidDevices, getIOSDevices } = require('./devices');
const { formatSequence, isCommandSequence } = require('./runner/command');
const { runSequence } = require('./runner/process');
const {
  parseArgs,
  validateCommandFlags,
  validateFrameworkOptions,
  validateProjectName,
} = require('./utils/args');

function printHelp(pc) {
  console.log(
    `\n${pc.bgCyan(pc.black(` ${BRAND} v${VERSION} `))} ${pc.bold('Development toolkit by bachbnt')}\n`
  );
  console.log(pc.bold('Usage:'));
  console.log('  dev <command> [target] [options]\n');
  console.log(pc.bold('Frameworks:'));
  for (const [name, definition] of Object.entries(frameworkDefinitions)) {
    console.log(`  ${pc.green(name.padEnd(20))} ${pc.dim(definition.description)}`);
  }
  console.log(`\n${pc.bold('Devices:')}`);
  console.log(`  ${pc.blue('devices'.padEnd(16))} ${pc.dim('List Android and iOS devices')}`);
  console.log(`  ${pc.blue('android'.padEnd(16))} ${pc.dim('Boot Android emulator')}`);
  console.log(`  ${pc.blue('ios'.padEnd(16))} ${pc.dim('Boot or manage iOS simulators')}`);
  console.log(`\n${pc.bold('History:')}`);
  console.log(`  ${pc.cyan('history'.padEnd(16))} ${pc.dim('Show recent successful commands')}`);
  console.log(`  ${pc.cyan('again'.padEnd(16))} ${pc.dim('Run the latest successful command again')}`);
  console.log(`\n${pc.bold('Options:')}`);
  console.log('  --dry-run                  Print without executing');
  console.log('  --typescript, --javascript Select project language');
  console.log('  --npm, --pnpm, --yarn, --bun');
  console.log('  --git, --no-git            Toggle Git initialization');
  console.log('  --eslint, --no-eslint      Toggle ESLint where supported');
  console.log('  --cold-boot                Cold boot Android emulator');
  console.log('  --shutdown-all             Shutdown all iOS simulators\n');
}

async function promptFrameworkOptions(p, command, options) {
  const capabilities = frameworkDefinitions[command].capabilities;
  const unwrap = (value) => {
    if (p.isCancel(value)) return undefined;
    return value;
  };

  if (capabilities.language && options.typescript === undefined) {
    options.typescript = unwrap(await p.confirm({ message: 'Use TypeScript?', initialValue: true }));
    if (options.typescript === undefined) return false;
  }

  if (capabilities.packageManager && !options.packageManager) {
    const supported = Array.isArray(capabilities.packageManager)
      ? capabilities.packageManager
      : PACKAGE_MANAGERS;
    options.packageManager = unwrap(
      await p.select({
        message: 'Select a package manager:',
        options: supported.map((value) => ({ value, label: value })),
        initialValue: 'npm',
      })
    );
    if (!options.packageManager) return false;
  }

  if (capabilities.git && options.git === undefined) {
    options.git = unwrap(
      await p.confirm({ message: 'Initialize a Git repository?', initialValue: true })
    );
    if (options.git === undefined) return false;
  }

  if (capabilities.eslint && options.eslint === undefined) {
    options.eslint = unwrap(await p.confirm({ message: 'Include ESLint?', initialValue: true }));
    if (options.eslint === undefined) return false;
  }

  return true;
}

function rebuildHistoryCommands(entry) {
  if (isCommandSequence(entry.commands)) return entry.commands;
  if (frameworkDefinitions[entry.command] && entry.target) {
    return buildFrameworkCommands(entry.command, entry.target, entry.options || {});
  }
  if (entry.command === 'android' && entry.target) {
    return buildAndroidCommands(entry.target, entry.options || {});
  }
  if (entry.command === 'ios' && entry.action === 'shutdown-all') {
    return buildIOSShutdownCommands();
  }
  if (entry.command === 'ios' && entry.target) return buildIOSBootCommands(entry.target);
  throw new Error('This legacy history entry cannot be replayed safely. Run the command again directly.');
}

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
  p.outro(`${pc.green('✔')} Command completed successfully.`);
  return 0;
}

async function main(argv) {
  const p = await import('@clack/prompts');
  const pc = (await import('picocolors')).default;
  let parsed;

  try {
    parsed = parseArgs(argv);
  } catch (error) {
    p.log.error(error.message);
    return 1;
  }

  const { command, options } = parsed;
  if (!command || ['help', '-h', '--help'].includes(command)) {
    printHelp(pc);
    return command ? 0 : 1;
  }

  try {
    validateCommandFlags(command, options);
  } catch (error) {
    p.log.error(error.message);
    return 1;
  }

  p.intro(`${pc.bgCyan(pc.black(` ${BRAND} `))} ${pc.bold(command)}`);

  if (command === 'info') {
    p.note(
      Object.entries(frameworkDefinitions)
        .map(([name, definition]) => `${pc.bold(name)}: ${definition.description}`)
        .join('\n'),
      'Supported frameworks'
    );
    p.outro('Run dev help for usage and options.');
    return 0;
  }

  if (command === 'history') {
    const history = readHistory().slice(0, 10);
    if (history.length === 0) {
      p.outro('No successful commands in history yet.');
      return 0;
    }
    p.note(
      history
        .map((entry, index) => `${index + 1}. ${getHistoryDisplay(entry)}\n   ${entry.executedAt}`)
        .join('\n'),
      'Recent commands'
    );
    p.outro(`History file: ${HISTORY_FILE}`);
    return 0;
  }

  if (command === 'again') {
    const latest = readHistory()[0];
    if (!latest) {
      p.log.error('No command is available to run again.');
      return 1;
    }
    try {
      const commands = rebuildHistoryCommands(latest);
      return executeCommands(
        p,
        pc,
        commands,
        { command: 'again', source: latest.command },
        options
      );
    } catch (error) {
      p.log.error(error.message);
      return 1;
    }
  }

  if (command === 'devices') {
    const android = getAndroidDevices();
    const ios = getIOSDevices();
    const lines = [
      pc.bold('Android'),
      ...(android.length ? android.map((device) => `  ${formatDevice(device)}`) : ['  No devices found']),
      '',
      pc.bold('iOS'),
      ...(ios.length ? ios.map((device) => `  ${formatDevice(device)}`) : ['  No devices found']),
    ];
    p.note(lines.join('\n'), 'Available devices');
    p.outro(`${android.length + ios.length} device(s) found.`);
    return 0;
  }

  if (command === 'ios' && options.shutdownAll) {
    return executeCommands(
      p,
      pc,
      buildIOSShutdownCommands(),
      { command: 'ios', action: 'shutdown-all' },
      options
    );
  }

  if (command === 'android' || command === 'ios') {
    const availableDevices = command === 'android' ? getAndroidDevices() : getIOSDevices();
    let target = options.target;

    if (!target && availableDevices.length > 0) {
      const preferred = availableDevices.find((device) => device.name === DEFAULT_DEVICES[command]);
      const selected = await p.select({
        message: 'Select a device:',
        options: availableDevices.map((device) => ({
          value: device.id,
          label: formatDevice(device),
          hint: preferred?.id === device.id ? 'default' : '',
        })),
        initialValue: preferred?.id || availableDevices[0].id,
      });
      if (p.isCancel(selected)) {
        p.cancel('Operation cancelled.');
        return 130;
      }
      target = selected;
    }

    if (!target) {
      const result = await p.text({
        message: 'No device was detected. Enter a device name or identifier:',
        placeholder: DEFAULT_DEVICES[command],
        defaultValue: DEFAULT_DEVICES[command],
        validate: (value) => (!value ? 'Device name is required.' : undefined),
      });
      if (p.isCancel(result)) {
        p.cancel('Operation cancelled.');
        return 130;
      }
      target = result;
    }

    if (command === 'ios') {
      const match = availableDevices.find((device) => device.id === target || device.name === target);
      target = match?.id || target;
    }

    const commands = command === 'android'
      ? buildAndroidCommands(target, options)
      : buildIOSBootCommands(target);
    return executeCommands(p, pc, commands, { command, target, options }, options);
  }

  if (!frameworkDefinitions[command]) {
    p.log.error(`Unsupported command: ${pc.bold(command)}`);
    p.outro(`Run ${pc.cyan('dev help')} to see available commands.`);
    return 1;
  }

  const interactive = !options.target;
  let target = options.target;
  if (!target) {
    const result = await p.text({
      message: 'What is your project name?',
      placeholder: 'my-awesome-app',
      validate(value) {
        try {
          validateProjectName(value);
        } catch (error) {
          return error.message;
        }
      },
    });
    if (p.isCancel(result)) {
      p.cancel('Operation cancelled.');
      return 130;
    }
    target = result;
  }

  try {
    validateProjectName(target);
    if (interactive && !(await promptFrameworkOptions(p, command, options))) {
      p.cancel('Operation cancelled.');
      return 130;
    }
    validateFrameworkOptions(command, options);
  } catch (error) {
    p.log.error(error.message);
    return 1;
  }

  const commands = buildFrameworkCommands(command, target, options);
  return executeCommands(p, pc, commands, { command, target, options }, options);
}

module.exports = {
  describeFailure,
  executeCommands,
  main,
  printHelp,
  rebuildHistoryCommands,
};
