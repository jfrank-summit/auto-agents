import { createWebSearchTool } from '@autonomys/agent-core';

import { createOrchestratorConfig } from './config/orchestrator.js';
import { ConfigInstance } from './config/types.js';
import { createSlackTool, createTwitterTool } from './tools.js';

export const createAgentRunnerOptions = async (configInstance: ConfigInstance) => {
  const { config } = configInstance;
  // Define custom tools
  const twitterAgent = await createTwitterTool(configInstance);
  const slackAgent = await createSlackTool(configInstance);
  const webSearchTool = config.SERPAPI_API_KEY ? [createWebSearchTool(config.SERPAPI_API_KEY)] : [];

  // Collect custom tools into an array to be passed to the orchestrator
  const tools = [twitterAgent, slackAgent, ...webSearchTool].filter(tool => tool !== undefined);

  // Create orchestrator config
  const orchestratorConfig = await createOrchestratorConfig(configInstance, [...tools]);
  return orchestratorConfig;
};
