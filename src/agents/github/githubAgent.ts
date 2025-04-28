import {
  type Character,
  createLogger,
  createOrchestratorConfig,
  createOrchestratorRunner,
  registerOrchestratorRunner,
  withApiLogger,
} from '@autonomys/agent-core';
import { HumanMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

import { createGitHubTools, type Toolset } from '../../tools/github-mcp/index.js';
import { createGithubPrompts } from './prompts.js';
import { GithubAgentConfig, GithubAgentOptions } from './types.js';

// GitHub-specific default configuration values
const defaultGithubOptions = {
  namespace: 'github',
  toolsets: ['all'] as Toolset[],
  logger: () => createLogger('github-workflow'),
};

/**
 * Creates a complete GitHub agent configuration by extending the orchestrator configuration
 */
const createGithubAgentConfig = async (
  character: Character,
  options?: GithubAgentOptions,
): Promise<GithubAgentConfig> => {
  const githubToken = options?.githubToken
    ? options.githubToken
    : (() => {
        throw new Error('Github token is required');
      })();

  // Create a base config with GitHub-specific fields
  const baseConfig = {
    namespace: options?.namespace ?? defaultGithubOptions.namespace,
    toolsets: options?.toolsets ?? defaultGithubOptions.toolsets,
    recursionLimit: options?.recursionLimit ?? 100,
    githubToken,
    logger: options?.logger ?? defaultGithubOptions.logger(),
  };

  const {
    modelConfigurations,
    experienceConfig,
    pruningParameters,
    monitoringConfig,
    characterDataPathConfig,
    apiConfig,
    llmConfig,
  } = await createOrchestratorConfig(character, options);

  // Get GitHub-specific tools and prompts
  const githubTools = await createGitHubTools(githubToken);
  const prompts = await createGithubPrompts(character);

  // Combine all tools
  const tools = [...githubTools, ...(options?.tools || [])];

  // Return the complete configuration
  return {
    characterName: character.name,
    ...baseConfig,
    modelConfigurations,
    tools,
    prompts,
    pruningParameters,
    experienceConfig,
    monitoringConfig,
    characterDataPathConfig,
    apiConfig,
    llmConfig,
  };
};

/**
 * Creates a GitHub agent tool that can be used by other agents
 */
export const createGithubAgent = (character: Character, options?: GithubAgentOptions) =>
  new DynamicStructuredTool({
    name: 'github_agent',
    description: `
    With this tool you can perform all necessary actions you would like to do on github.
    It is an agentic workflow that will execute many actions to meet your needs.
    Be specific about what you want to do.
    `,
    schema: z.object({ instructions: z.string().describe('Instructions for the workflow') }),
    func: async ({ instructions }: { instructions: string }) => {
      try {
        const githubAgentConfig = await createGithubAgentConfig(character, {
          ...options,
        });
        const messages = [new HumanMessage(instructions)];
        const { namespace } = githubAgentConfig;

        const runner = createOrchestratorRunner(character, {
          ...githubAgentConfig,
          ...withApiLogger(namespace, githubAgentConfig.apiConfig ? true : false),
        });

        const runnerPromise = await runner;
        registerOrchestratorRunner(namespace, runnerPromise);
        const result = await runnerPromise.runWorkflow(
          { messages },
          { threadId: 'github_workflow_state' },
        );
        options?.logger?.info('Github workflow result:', { result });
        return result;
      } catch (error) {
        options?.logger?.error('Github workflow error:', error);
        throw error;
      }
    },
  });
