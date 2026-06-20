// Copyright (c) 2026 bachbnt

const { startMcpServer } = require('../mcp/server');

async function handleMcp() {
  await startMcpServer();
  return 0;
}

module.exports = { handleMcp };
