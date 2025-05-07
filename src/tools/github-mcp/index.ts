import { createLogger, createMcpClientTool } from '@autonomys/agent-core';
import { StructuredToolInterface } from '@langchain/core/tools';
import { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';


export type Toolset =
  | 'repos'
  | 'issues'
  | 'users'
  | 'pull_requests'
  | 'code_security'
  | 'experiments'
  | 'all';

export const createGitHubTools = async (
  githubToken: string,
  toolsets: Toolset[] = ['all'],
): Promise<StructuredToolInterface[]> => {
  // Common Docker install locations
  const extraPaths = [
    '/usr/local/bin',           // macOS, Linux (Homebrew, standard)
    '/opt/homebrew/bin',        // macOS (Apple Silicon Homebrew)
    'C:\\Program Files\\Docker\\Docker\\resources\\bin', // Windows default
    'C:\\ProgramData\\DockerDesktop\\version-bin',       // Windows (newer Docker Desktop)
  ];

  // Build a platform-appropriate PATH string
  const separator = process.platform === 'win32' ? ';' : ':';
  const currentPath = process.env.PATH || '';
  const newPath = extraPaths
    .filter(p => !currentPath.includes(p))
    .concat([currentPath])
    .join(separator);

  const githubServerParams: StdioServerParameters = {
    command: 'docker',
    args: [
      'run',
      '-i',
      '--rm',
      '-e',
      `GITHUB_PERSONAL_ACCESS_TOKEN=${githubToken}`,
      '-e',
      `TOOLSETS=${toolsets.join(',')}`,
      'ghcr.io/github/github-mcp-server',
    ],
    env: { ...process.env, PATH: newPath },
  };
  const logger = createLogger('github-mcp');
  const tools = await createMcpClientTool('github-mcp', '0.0.1', githubServerParams);
  logger.debug('Created GitHub MCP tools', { tools });
  return tools;
};
