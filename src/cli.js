// Copyright (c) 2026 bachbnt

const { BRAND, PACKAGE_MANAGERS, VERSION, frameworkDefinitions } = require('./config');
const { loadConfig } = require('./config/user');
const { getCompletion } = require('./commands/completion');
const { handleDeviceCommand, handleDeviceList } = require('./handlers/devices');
const { handleAgain, handleHistory, rebuildHistoryCommands } = require('./handlers/history');
const { LIFECYCLE_COMMANDS, handleInspect, handleLifecycle } = require('./handlers/lifecycle');
const { applyConfigDefaults, handleScaffold } = require('./handlers/scaffold');
const {
  handleConfig,
  handleDoctor,
  handleInfo,
  handleOpeners,
  handleProjects,
  handleRecipes,
} = require('./handlers/system');
const { describeFailure, executeCommands } = require('./runtime/execute');
const { parseArgs, validateCommandFlags } = require('./utils/args');
const { getRecipeDefinitions, loadRecipeRegistry } = require('./recipes');
const { loadOpenerRegistry } = require('./openers');

function printHelp(pc, definitions = frameworkDefinitions, openerRegistry) {
  console.log(
    `\n${pc.bgCyan(pc.black(` ${BRAND} v${VERSION} `))} ${pc.bold('Development toolkit by bachbnt')}\n`
  );
  console.log(pc.bold('Usage:'));
  console.log('  dev <command> [target] [options]\n');
  console.log(pc.bold('Frameworks:'));
  for (const [name, definition] of Object.entries(definitions)) {
    console.log(`  ${pc.green(name.padEnd(20))} ${pc.dim(definition.description)}`);
  }
  console.log(`\n${pc.bold('Project Lifecycle:')}`);
  console.log(`  ${pc.magenta('doctor'.padEnd(16))} ${pc.dim('Check development tools')}`);
  console.log(`  ${pc.magenta('inspect'.padEnd(16))} ${pc.dim('Show detected project and lifecycle commands')}`);
  for (const action of LIFECYCLE_COMMANDS) {
    console.log(`  ${pc.magenta(action.padEnd(16))} ${pc.dim(`${action} the detected project`)}`);
  }
  console.log(`  ${pc.magenta('projects'.padEnd(16))} ${pc.dim('Show recently used projects')}`);
  console.log(`  ${pc.magenta('recipes'.padEnd(16))} ${pc.dim('List or validate framework recipes')}`);
  console.log(`  ${pc.magenta('openers'.padEnd(16))} ${pc.dim('List or validate project openers')}`);
  console.log(`  ${pc.magenta('config'.padEnd(16))} ${pc.dim('Show or update DevCmd defaults')}`);
  console.log(`  ${pc.magenta('completion'.padEnd(16))} ${pc.dim('Generate bash or zsh completion')}`);
  console.log(`\n${pc.bold('Openers:')}`);
  for (const opener of openerRegistry?.values() || []) {
    const aliases = opener.aliases?.length ? ` (${opener.aliases.join(', ')})` : '';
    const source = opener.source === 'user' ? ' [user]' : '';
    console.log(
      `  ${pc.cyan(opener.name.padEnd(20))} ${pc.dim(`${opener.description}${aliases}${source}`)}`
    );
  }
  console.log(`\n${pc.bold('Devices:')}`);
  console.log(`  ${pc.blue('devices'.padEnd(16))} ${pc.dim('List Android and iOS devices')}`);
  console.log(`  ${pc.blue('android'.padEnd(16))} ${pc.dim('Boot Android emulator')}`);
  console.log(`  ${pc.blue('ios'.padEnd(16))} ${pc.dim('Boot or manage iOS simulators')}`);
  console.log(`\n${pc.bold('History:')}`);
  console.log(`  ${pc.cyan('history'.padEnd(16))} ${pc.dim('Show recent successful commands')}`);
  console.log(`  ${pc.cyan('again'.padEnd(16))} ${pc.dim('Run the latest successful command again')}`);
  console.log(`\n${pc.bold('Options:')}`);
  const printOption = (flags, description) => {
    console.log(`  ${flags.padEnd(31)} ${pc.dim(description)}`);
  };
  printOption('--dry-run', 'Print without executing');
  printOption('--typescript, --javascript', 'Select project language');
  printOption(
    PACKAGE_MANAGERS.map((manager) => `--${manager}`).join(', '),
    'Select package manager'
  );
  printOption('--git, --no-git', 'Toggle Git initialization');
  printOption('--eslint, --no-eslint', 'Toggle ESLint where supported');
  printOption('--no-install', 'Scaffold without installing dependencies');
  printOption('--python <executable>', 'Select Python executable');
  printOption('--set <name=value>', 'Set a custom recipe input');
  printOption('--editor <executable>', 'Override editor for dev open');
  printOption('--with <opener>', 'Select an opener for dev open');
  printOption('--list', 'List available openers');
  printOption('--cold-boot', 'Cold boot Android emulator');
  printOption('--shutdown-all', 'Shutdown all iOS simulators');
  console.log('');
}

async function dispatch(context) {
  const { command } = context;
  const definitions = context.frameworkDefinitions || frameworkDefinitions;
  if (command === 'config') return handleConfig(context);
  if (command === 'doctor') return handleDoctor(context);
  if (command === 'projects') return handleProjects(context);
  if (command === 'recipes') return handleRecipes(context);
  if (command === 'openers') return handleOpeners(context);
  if (command === 'inspect') return handleInspect(context);
  if (LIFECYCLE_COMMANDS.includes(command)) return handleLifecycle(context);
  if (command === 'info') return handleInfo(context);
  if (command === 'history') return handleHistory(context);
  if (command === 'again') return handleAgain(context);
  if (command === 'devices') return handleDeviceList(context);
  if (command === 'android' || command === 'ios') return handleDeviceCommand(context);
  if (definitions[command]) return handleScaffold(context);
  throw new Error(`Unsupported command: ${command}. Run dev help to see available commands.`);
}

async function main(argv) {
  const p = await import('@clack/prompts');
  const pc = (await import('picocolors')).default;
  let parsed;
  let recipeRegistry;
  let definitions;
  let openerRegistry;

  try {
    parsed = parseArgs(argv);
  } catch (error) {
    p.log.error(error.message);
    return 1;
  }

  const { command, options, positionals } = parsed;
  try {
    const validatingRecipe = command === 'recipes' && positionals[0] === 'validate';
    recipeRegistry = loadRecipeRegistry({ includeUser: !validatingRecipe });
    definitions = getRecipeDefinitions(recipeRegistry);
    const validatingOpener = command === 'openers' && positionals[0] === 'validate';
    openerRegistry = loadOpenerRegistry({ includeUser: !validatingOpener });
  } catch (error) {
    p.log.error(error.message);
    return 1;
  }
  if (!command || ['help', '-h', '--help'].includes(command)) {
    printHelp(pc, definitions, openerRegistry);
    return command ? 0 : 1;
  }

  if (command === 'completion') {
    try {
      process.stdout.write(getCompletion(
        positionals[0] || process.env.SHELL?.split('/').pop() || 'zsh',
        definitions,
        openerRegistry
      ));
      return 0;
    } catch (error) {
      p.log.error(error.message);
      return 1;
    }
  }

  try {
    validateCommandFlags(command, options, definitions);
    const config = loadConfig();
    p.intro(`${pc.bgCyan(pc.black(` ${BRAND} `))} ${pc.bold(command)}`);
    return await dispatch({
      p,
      pc,
      command,
      options,
      positionals,
      config,
      frameworkDefinitions: definitions,
      recipeRegistry,
      openerRegistry,
    });
  } catch (error) {
    p.log.error(error.message);
    return 1;
  }
}

module.exports = {
  applyConfigDefaults,
  describeFailure,
  dispatch,
  executeCommands,
  handleLifecycle,
  main,
  printHelp,
  rebuildHistoryCommands,
};
