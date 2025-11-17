import { DynamicStructuredTool } from '@langchain/core/tools';
import { StructuredToolInterface } from '@langchain/core/tools';
import axios, { AxiosRequestConfig } from 'axios';
import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { withPaymentInterceptor } from 'x402-axios';
import { z } from 'zod';

export interface X402Config {
  privateKey: string;
}

// Create a client factory that creates axios clients with payment interceptor
const createClientFactory = (privateKey: Hex) => {
  const account = privateKeyToAccount(privateKey);
  return (baseURL: string) => withPaymentInterceptor(axios.create({ baseURL }), account);
};

export const createX402Tools = async (config: X402Config): Promise<StructuredToolInterface[]> => {
  const { privateKey } = config;

  if (!privateKey) {
    throw new Error('Missing required x402 configuration: privateKey is required');
  }

  const createClient = createClientFactory(privateKey as Hex);

  const tool = new DynamicStructuredTool({
    name: 'x402-request',
    description:
      'Make a paid API request to an x402-enabled service. Automatically handles payment via x402 protocol.',
    schema: z.object({
      url: z
        .string()
        .describe('Full URL of the x402-enabled API endpoint (e.g., https://api.example.com/data)'),
      method: z
        .enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
        .default('GET')
        .describe('HTTP method to use for the request'),
      body: z
        .record(z.unknown())
        .optional()
        .describe('Request body (for POST, PUT, PATCH requests). Will be JSON stringified.'),
      headers: z
        .record(z.string())
        .optional()
        .describe('Additional HTTP headers to include in the request'),
      params: z.record(z.string()).optional().describe('URL query parameters'),
    }),
    func: async ({ url, method = 'GET', body, headers = {}, params: queryParams }) => {
      try {
        // Extract base URL from the full URL
        const urlObj = new URL(url);
        const baseURL = `${urlObj.protocol}//${urlObj.host}`;
        const path = urlObj.pathname;

        // Merge URL search params with provided params
        const urlParams = Object.fromEntries(urlObj.searchParams.entries());
        const mergedParams = { ...urlParams, ...queryParams };

        // Create a client for this base URL
        const client = createClient(baseURL);

        // Build axios request config
        const config: AxiosRequestConfig = {
          method: method.toLowerCase() as Lowercase<typeof method>,
          url: path,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          params: mergedParams,
        };

        // Add body for methods that support it
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
          config.data = body;
        }

        const res = await client.request(config);

        return JSON.stringify(
          {
            status: res.status,
            statusText: res.statusText,
            data: res.data,
            headers: res.headers,
          },
          null,
          2,
        );
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return JSON.stringify(
            {
              error: 'Request failed',
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              message: error.message,
            },
            null,
            2,
          );
        }
        throw error;
      }
    },
  });

  return [tool];
};
