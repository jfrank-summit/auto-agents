import { createLogger, createMcpClientTool } from '@autonomys/agent-core';
import { StructuredToolInterface } from '@langchain/core/tools';
import { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ChildProcess, spawn } from 'child_process';

// Start the GitHub MCP server via Docker and return the process
export const startGithubMcpServer = (githubToken: string): ChildProcess => {
  const dockerArgs = [
    'run',
    '-i',
    '--rm',
    '-e',
    `GITHUB_PERSONAL_ACCESS_TOKEN=${githubToken}`,
    'ghcr.io/github/github-mcp-server',
  ];
  return spawn('docker', dockerArgs, {
    stdio: ['pipe', 'pipe', 'inherit'],
  });
};

export const createGithubTools = async (
  githubToken: string,
): Promise<StructuredToolInterface[]> => {
  const githubServerParams: StdioServerParameters = {
    command: 'docker',
    args: [
      'run',
      '-i',
      '--rm',
      '-e',
      `GITHUB_PERSONAL_ACCESS_TOKEN=${githubToken}`,
      'ghcr.io/github/github-mcp-server',
    ],
    env: {},
  };
  const logger = createLogger('github-mcp');
  const tools = await createMcpClientTool('github-mcp', '0.0.1', githubServerParams);
  logger.debug('Created GitHub MCP tools', { tools });
  return tools;
};
