// Copyright (c) 2026 bachbnt

const path = require('path');
const { createCommand } = require('../runner/command');
const { interpolate: _interpolate } = require('../utils/interpolate');

const ACTION_RUNNER = path.join(__dirname, 'action-runner.js');
const PYTHON_GENERATOR = path.join(__dirname, '..', 'generators', 'python-project.js');
const FORBIDDEN_SHELLS = new Set(['sh', 'bash', 'zsh', 'fish', 'cmd', 'cmd.exe', 'powershell', 'pwsh']);

function conditionMatches(condition, context) {
  return !condition || context[condition.option] === condition.equals;
}

function interpolate(value, context) {
  return _interpolate(value, context, 'recipe placeholder');
}

function resolveValue(spec, context) {
  if (typeof spec === 'string') return interpolate(spec, context);
  if (Array.isArray(spec)) return spec.flatMap((item) => resolveValue(item, context));
  if (Object.hasOwn(spec, 'value')) {
    return conditionMatches(spec.when, context) ? resolveValue(spec.value, context) : [];
  }
  const key = String(context[spec.option]);
  if (!Object.hasOwn(spec.map, key)) {
    throw new Error(`Recipe has no ${spec.option} mapping for: ${key}`);
  }
  return resolveValue(spec.map[key], context);
}

function scalarValue(spec, context, label) {
  const values = resolveValue(spec, context);
  const list = Array.isArray(values) ? values : [values];
  if (list.length !== 1) throw new Error(`${label} must resolve to one value.`);
  return list[0];
}

function resolveInputs(recipe, target, options = {}) {
  const supplied = options.values || {};
  const definitions = recipe.inputs || {};
  const unknown = Object.keys(supplied).filter((name) => !Object.hasOwn(definitions, name));
  if (unknown.length > 0) throw new Error(`${recipe.name} does not define input: ${unknown.join(', ')}`);
  const values = {};
  const base = { target };
  for (const [name, definition] of Object.entries(definitions)) {
    if (supplied[name] !== undefined) values[name] = supplied[name];
    else if (definition.default !== undefined) values[name] = interpolate(definition.default, { ...base, ...values });
    else if (definition.required && !options.skipRequiredInputs) {
      throw new Error(`Missing required recipe input: ${name}. Pass --set ${name}=value.`);
    }
  }
  return values;
}

function createContext(recipe, target, options = {}, extra = {}) {
  const packageManager = options.packageManager || 'npm';
  const python = options.python || (process.platform === 'win32' ? 'python' : 'python3');
  const projectPython = process.platform === 'win32'
    ? path.join(target, '.venv', 'Scripts', 'python.exe')
    : path.join(target, '.venv', 'bin', 'python');
  const typescript = options.typescript !== false;
  const eslint = options.eslint !== false;
  return {
    target,
    packageManager,
    typescript,
    git: options.git !== false,
    eslint,
    vueDefault: !typescript && !eslint,
    noInstall: Boolean(options.noInstall),
    python,
    venvDirectory: path.join(target, '.venv'),
    projectPython,
    pythonGenerator: PYTHON_GENERATOR,
    ...resolveInputs(recipe, target, options),
    ...extra,
  };
}

function ensureInside(root, candidate, label) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, candidate);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`${label} must stay inside the target directory.`);
  }
  return resolved;
}

function buildFileAction(action, recipe, context) {
  const targetRoot = path.resolve(context.target);
  if (action.type === 'mkdir') {
    const destination = ensureInside(targetRoot, scalarValue(action.path, context, 'mkdir path'), 'mkdir path');
    return createCommand(process.execPath, [ACTION_RUNNER, 'mkdir', destination]);
  }
  if (action.type === 'write') {
    const destination = ensureInside(targetRoot, scalarValue(action.path, context, 'write path'), 'write path');
    const content = scalarValue(action.content, context, 'write content');
    return createCommand(process.execPath, [ACTION_RUNNER, 'write', destination, Buffer.from(content).toString('base64')]);
  }
  const source = path.resolve(recipe.baseDir, scalarValue(action.source, context, 'copy source'));
  if (source !== path.resolve(recipe.baseDir) && !source.startsWith(`${path.resolve(recipe.baseDir)}${path.sep}`)) {
    throw new Error('copy source must stay inside the recipe directory.');
  }
  const destination = ensureInside(
    targetRoot,
    scalarValue(action.destination, context, 'copy destination'),
    'copy destination'
  );
  return createCommand(process.execPath, [ACTION_RUNNER, 'copy', source, destination]);
}

function buildRecipeActions(recipe, actions, target, options = {}, extra = {}) {
  const context = createContext(recipe, target, options, extra);
  return actions
    .filter((action) => conditionMatches(action.when, context))
    .map((action) => {
      if (action.type !== 'run') return buildFileAction(action, recipe, context);
      const executable = scalarValue(action.executable, context, 'run executable');
      if (FORBIDDEN_SHELLS.has(path.basename(executable).toLowerCase())) {
        throw new Error(`Recipe shell executables are not allowed: ${executable}`);
      }
      const args = action.args.flatMap((arg) => resolveValue(arg, context));
      const cwd = action.cwd === undefined ? undefined : scalarValue(action.cwd, context, 'run cwd');
      return createCommand(executable, args, { cwd });
    });
}

function buildRecipeCommands(recipe, target, options = {}) {
  return buildRecipeActions(recipe, recipe.actions, target, options);
}

function buildRecipeLifecycleCommands(recipe, action, project, options = {}) {
  const actions = recipe.lifecycle?.[action];
  if (!actions) throw new Error(`dev ${action} is not supported for detected project type: ${project.type}.`);
  return buildRecipeActions(recipe, actions, project.root, {
    packageManager: project.packageManager,
    python: options.config?.python,
    values: {},
    skipRequiredInputs: true,
  }, { root: project.root });
}

function getRecipeRequirements(recipe, target, options = {}) {
  const context = createContext(recipe, target, options);
  return recipe.requirements.flatMap((requirement) => resolveValue(requirement, context));
}

module.exports = {
  buildRecipeCommands,
  buildRecipeActions,
  buildRecipeLifecycleCommands,
  conditionMatches,
  createContext,
  getRecipeRequirements,
  interpolate,
  resolveInputs,
  resolveValue,
};
