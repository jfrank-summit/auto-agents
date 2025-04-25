import {
  createAllSchedulerTools,
  createSlackAgent,
  createTwitterAgent,
  createTwitterApi,
  LLMConfiguration,
  ModelConfigurations,
} from '@autonomys/agent-core';

import { createExperienceConfig } from './config/experiences.js';
import { ConfigInstance } from './config/types.js';

const schedulerTools = createAllSchedulerTools();
export const bigModel: LLMConfiguration = {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-latest',
  temperature: 0.6,
};
export const smallModel: LLMConfiguration = {
  provider: 'anthropic',
  model: 'claude-3-5-haiku-latest',
  temperature: 0.6,
};
export const modelConfigurations: ModelConfigurations = {
  inputModelConfig: bigModel,
  messageSummaryModelConfig: smallModel,
  finishWorkflowModelConfig: smallModel,
};

// Define custom tool creators
export const createTwitterTool = async (configInstance: ConfigInstance) => {
  const { twitterConfig, characterConfig } = configInstance.config;
  if (!twitterConfig || !twitterConfig.USERNAME || !twitterConfig.PASSWORD) {
    return undefined;
  }

  const twitterApi = await createTwitterApi(
    twitterConfig.USERNAME,
    twitterConfig.PASSWORD,
    twitterConfig.COOKIES_PATH,
  );

  const { experienceConfig, monitoringConfig } = await createExperienceConfig(configInstance);
  const twitterAgent = createTwitterAgent(twitterApi, characterConfig, {
    tools: [...schedulerTools],
    postTweets: twitterConfig.POST_TWEETS,
    experienceConfig,
    monitoringConfig,
    modelConfigurations: twitterConfig.model_configurations,
  });
  return twitterAgent;
};

export const createSlackTool = async (configInstance: ConfigInstance) => {
  const { slackConfig, characterConfig } = configInstance.config;
  if (!slackConfig || !slackConfig.SLACK_APP_TOKEN) {
    return undefined;
  }

  const { experienceConfig, monitoringConfig } = await createExperienceConfig(configInstance);
  const slackAgent = createSlackAgent(slackConfig.SLACK_APP_TOKEN, characterConfig, {
    tools: [...schedulerTools],
    experienceConfig,
    monitoringConfig,
  });
  return slackAgent;
};
