import { createFirecrawlTools, createWebSearchTool } from '@autonomys/agent-core';

import { createOrchestratorConfig } from './config/orchestrator.js';
import { ConfigInstance } from './config/types.js';
import { createSlackTool, createTwitterTool } from './tools.js';
import { createGithubTools } from './tools/github-mcp/index.js';

export const createAgentRunnerOptions = async (configInstance: ConfigInstance) => {
  const { config } = configInstance;
  // Define custom tools
  const twitterAgent = await createTwitterTool(configInstance);
  const slackAgent = await createSlackTool(configInstance);
  const firecrawlTools = config.FIRECRAWL_API_KEY
    ? await createFirecrawlTools(config.FIRECRAWL_API_KEY)
    : [];
  const webSearchTool = config.SERPAPI_API_KEY ? [createWebSearchTool(config.SERPAPI_API_KEY)] : [];
  const githubTools = process.env.GITHUB_TOKEN
    ? await createGithubTools(process.env.GITHUB_TOKEN)
    : [];

  // Collect custom tools into an array to be passed to the orchestrator
  const tools = [
    twitterAgent,
    slackAgent,
    ...webSearchTool,
    ...githubTools,
    ...firecrawlTools,
  ].filter(tool => tool !== undefined);

  // Create orchestrator config
  const orchestratorConfig = await createOrchestratorConfig(configInstance, [...tools]);
  return orchestratorConfig;
};
