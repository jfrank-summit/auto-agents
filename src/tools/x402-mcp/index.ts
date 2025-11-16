import { createLogger, createMcpClientTool } from '@autonomys/agent-core';
import { StructuredToolInterface } from '@langchain/core/tools';
import { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

export interface X402Config {
  privateKey: string;
}

export const createX402Tools = async (config: X402Config): Promise<StructuredToolInterface[]> => {
  const { privateKey } = config;

  if (!privateKey) {
    throw new Error('Missing required x402 configuration: privateKey is required');
  }

  // Use npx tsx to run the TypeScript server file directly
  const serverPath = join(__dirname, 'server.ts');

  const x402ServerParams: StdioServerParameters = {
    command: 'npx',
    args: ['--yes', 'tsx', serverPath],
    env: {
      ...process.env,
      PRIVATE_KEY: privateKey,
    },
  };

  const logger = createLogger('x402-mcp');
  const tools = await createMcpClientTool('x402-mcp', '1.0.0', x402ServerParams);
  logger.debug('Created x402 MCP tools', { tools });
  return tools;
};
