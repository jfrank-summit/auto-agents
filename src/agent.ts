import { createOrchestratorConfig } from './config/orchestrator.js';
import { ConfigInstance } from './config/types.js';
import { createTwitterTool, createSlackTool } from './tools.js';

export const createAgentRunnerOptions = async (configInstance: ConfigInstance) => {
  // Define custom tools
  const twitterAgent = await createTwitterTool(configInstance);
  const slackAgent = await createSlackTool(configInstance);

  // Collect custom tools into an array to be passed to the orchestrator
  const tools = [twitterAgent, slackAgent].filter(tool => tool !== undefined);

  // Create orchestrator config
  const orchestratorConfig = await createOrchestratorConfig(configInstance, [...tools]);
  return orchestratorConfig;
};
