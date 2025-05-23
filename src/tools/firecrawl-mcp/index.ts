import { createMcpClientTool } from '@autonomys/agent-core';
import { StructuredToolInterface } from '@langchain/core/tools';
import { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';

export const createFirecrawlTools = async (apiKey: string): Promise<StructuredToolInterface[]> => {
  const firecrawlServerParams: StdioServerParameters = {
    command: process.execPath,
    args: ['node_modules/.bin/firecrawl-mcp'],
    env: {
      FIRECRAWL_API_KEY: apiKey,
    },
  };
  const tools = await createMcpClientTool('firecrawl-mcp', '0.0.1', firecrawlServerParams);
  return tools;
};
