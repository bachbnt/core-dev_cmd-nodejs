// Copyright (c) 2026 bachbnt

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { VERSION, frameworkDefinitions } = require('../config');
const { readHistory } = require('../commands/history');
const { buildLifecycleCommands } = require('../commands/lifecycle');
const { LIFECYCLE_COMMANDS } = require('../constants');
const { detectProject } = require('../projects/detect');
const { getRecipeDefinitions, loadRecipeRegistry } = require('../recipes');
const { runProcessCaptured, runSequenceCaptured } = require('../runner/captured');

const TOOLS = [
  {
    name: 'inspect_project',
    description: 'Detect and describe the project at the given path (defaults to current directory).',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute or relative path to the project root.' },
      },
    },
  },
  {
    name: 'run_lifecycle',
    description: `Run a lifecycle command on a project. Available actions: ${LIFECYCLE_COMMANDS.join(', ')}.`,
    inputSchema: {
      type: 'object',
      required: ['action'],
      properties: {
        action: { type: 'string', enum: LIFECYCLE_COMMANDS, description: 'Lifecycle action to run.' },
        path: { type: 'string', description: 'Project path (defaults to current directory).' },
        dryRun: { type: 'boolean', description: 'If true, print commands without executing.' },
      },
    },
  },
  {
    name: 'list_frameworks',
    description: 'List all supported framework recipes that can be scaffolded with DevCmd.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_history',
    description: 'Return recent successful DevCmd command history.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Max entries to return (default 10, max 50).' },
      },
    },
  },
];

function textResult(text) {
  return { content: [{ type: 'text', text }] };
}

function jsonResult(value) {
  return textResult(JSON.stringify(value, null, 2));
}

async function callTool(name, args) {
  if (name === 'inspect_project') {
    const root = args.path ? require('path').resolve(args.path) : process.cwd();
    const recipeRegistry = loadRecipeRegistry({ includeUser: true });
    let project;
    try {
      project = detectProject(root, { registry: recipeRegistry });
    } catch (error) {
      return textResult(`Error: ${error.message}`);
    }
    return jsonResult({
      type: project.type,
      name: project.name,
      root: project.root,
      packageManager: project.packageManager,
      lifecycleCommands: LIFECYCLE_COMMANDS,
    });
  }

  if (name === 'run_lifecycle') {
    const { action, path: projectPath, dryRun = false } = args;
    if (!LIFECYCLE_COMMANDS.includes(action)) {
      return textResult(`Error: Unknown action "${action}". Valid: ${LIFECYCLE_COMMANDS.join(', ')}`);
    }
    const root = projectPath ? require('path').resolve(projectPath) : process.cwd();
    const recipeRegistry = loadRecipeRegistry({ includeUser: true });
    let project;
    try {
      project = detectProject(root, { registry: recipeRegistry });
    } catch (error) {
      return textResult(`Error detecting project: ${error.message}`);
    }
    let commands;
    try {
      commands = buildLifecycleCommands(action, project, {});
    } catch (error) {
      return textResult(`Error building commands: ${error.message}`);
    }
    const preview = commands.map((c) => [c.executable, ...c.args].join(' ')).join(' && ');
    if (dryRun) return textResult(`Dry run — would execute:\n${preview}`);
    const result = await runSequenceCaptured(commands);
    const status = result.ok ? '✔' : `✖ (exit ${result.exitCode})`;
    return textResult(`${status}\n\n${result.output || '(no output)'}`);
  }

  if (name === 'list_frameworks') {
    const recipeRegistry = loadRecipeRegistry({ includeUser: true });
    const definitions = getRecipeDefinitions(recipeRegistry);
    return jsonResult(
      Object.entries(definitions).map(([name, def]) => ({
        name,
        description: def.description,
        source: def.source || 'built-in',
      }))
    );
  }

  if (name === 'get_history') {
    const limit = Math.min(args.limit ?? 10, 50);
    const history = readHistory().slice(0, limit).map((entry) => ({
      command: entry.command,
      projectName: entry.projectName,
      projectPath: entry.projectPath,
      projectType: entry.projectType,
      commandLine: entry.commandLine,
      executedAt: entry.executedAt,
    }));
    return jsonResult(history);
  }

  return textResult(`Unknown tool: ${name}`);
}

async function startMcpServer() {
  const server = new Server(
    { name: 'devcmd', version: VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    try {
      return await callTool(name, args);
    } catch (error) {
      return textResult(`Error: ${error.message}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

module.exports = { startMcpServer };
