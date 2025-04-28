import { OrchestratorConfig, OrchestratorRunnerOptions } from '@autonomys/agent-core';
import { Toolset } from '../../tools/github-mcp/index.js';

/**
 * GitHub-specific options that extend the base orchestrator options
 */
export type GithubAgentOptions = OrchestratorRunnerOptions & {
  /**
   * GitHub token for authentication with GitHub API
   */
  githubToken?: string;
  /**
   * GitHub toolsets to use
   */
  toolsets?: Toolset[];
};

/**
 * GitHub agent config that extends the base orchestrator config
 */
export type GithubAgentConfig = OrchestratorConfig & {
  /**
   * GitHub token for authentication with GitHub API
   */
  githubToken: string;
  /**
   * GitHub toolsets to use
   */
  toolsets?: Toolset[];
};
