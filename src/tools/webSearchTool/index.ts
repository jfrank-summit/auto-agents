/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamicStructuredTool } from '@langchain/core/tools';
import axios from 'axios';
import { load } from 'cheerio';
import { z } from 'zod';

const DEFAULT_ENGINES = ['google'] as const;

export const createWebSearchTool = (apiKey: string, engines: readonly string[] = DEFAULT_ENGINES) =>
  new DynamicStructuredTool({
    name: 'web_search',
    description: 'Perform a web search for up-to-date information or to do research on a topic.',
    schema: z.object({
      query: z.string().describe('The search query string.'),
      num: z.string().default('10'),
      engine: z
        .string()
        .default('google')
        .describe(
          `Search engine to use - supported: ${engines.join(', ')}, or custom engine string`,
        ),
      timeout: z.number().default(10000),
    }),
    func: async ({
      query,
      num,
      engine,
      timeout,
    }: {
      query: string;
      num: string;
      engine: string;
      timeout: number;
    }) => {
      if (!apiKey) {
        return 'Error: SERPAPI_API_KEY is not set.';
      }
      const params = new URLSearchParams({
        api_key: apiKey,
        engine,
        q: query,
        num,
      });

      const url = `https://serpapi.com/search?${params.toString()}`;

      try {
        const response = await axios.get(url, {
          timeout,
        });
        const data = response.data;
        const results = data.organic_results || [];

        if (!results.length) {
          return 'No results found.';
        }

        const detailedResults = await Promise.all(
          results.map(async (result: any, index: number) => {
            console.info(`Processing result ${index + 1} of ${results.length}`);
            try {
              const pageResponse = await axios.get(result.link, { timeout: 10000 });
              const $ = load(pageResponse.data);
              $('script, style').remove();
              const fullContent = $('body').text().replace(/\s+/g, ' ').trim();
              return {
                title: result.title,
                snippet: result.snippet,
                link: result.link,
                fullContent: fullContent.substring(0, 1000), // Limiting to first 1000 characters
              };
            } catch {
              return {
                title: result.title,
                snippet: result.snippet,
                link: result.link,
                fullContent: 'Error fetching content',
              };
            }
          }),
        );

        return JSON.stringify(detailedResults, null, 2);
      } catch {
        return 'Error performing web search.';
      }
    },
  });
