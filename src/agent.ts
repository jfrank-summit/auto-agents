import { createWebSearchTool } from '@autonomys/agent-core';

import { createOrchestratorConfig } from './config/orchestrator.js';
import { ConfigInstance } from './config/types.js';
import { createGithubTool, createSlackTool, createTwitterTool } from './tools.js';
import { createFirecrawlTools } from './tools/firecrawl-mcp/index.js';

export const createAgentRunnerOptions = async (configInstance: ConfigInstance) => {
  const { config } = configInstance;
  // Define custom agents
  const twitterAgent = await createTwitterTool(configInstance);
  const slackAgent = await createSlackTool(configInstance);
  const githubAgent = await createGithubTool(configInstance, ['all']);

  // Define custom tools
  const firecrawlTools = config.FIRECRAWL_API_KEY
    ? await createFirecrawlTools(config.FIRECRAWL_API_KEY)
    : [];
  const webSearchTool = config.SERPAPI_API_KEY ? [createWebSearchTool(config.SERPAPI_API_KEY)] : [];

  const tools = [twitterAgent, slackAgent, githubAgent, ...webSearchTool, ...firecrawlTools].filter(
    tool => tool !== undefined,
  );

  // Create orchestrator config
  const orchestratorConfig = await createOrchestratorConfig(configInstance, [...tools]);
  return orchestratorConfig;
};
