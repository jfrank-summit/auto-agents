import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios, { AxiosRequestConfig } from 'axios';
import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { withPaymentInterceptor } from 'x402-axios';
import { z } from 'zod';

const privateKey = (process.env.PRIVATE_KEY as Hex) || '';

if (!privateKey) {
  throw new Error('Missing required environment variable: PRIVATE_KEY');
}

// Create a wallet client to handle payments
const account = privateKeyToAccount(privateKey);

// Create an axios client with payment interceptor using x402-axios
// We'll create clients per request based on the baseURL provided
const createClient = (baseURL: string) =>
  withPaymentInterceptor(axios.create({ baseURL }), account);

// Create an MCP server
const server = new McpServer({
  name: 'x402-mcp',
  version: '1.0.0',
});

// Add a tool to make paid API requests to x402-enabled services
server.tool(
  'x402-request',
  'Make a paid API request to an x402-enabled service. Automatically handles payment via x402 protocol.',
  {
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
  },
  async ({ url, method = 'GET', body, headers = {}, params: queryParams }) => {
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

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: res.status,
                statusText: res.statusText,
                data: res.data,
                headers: res.headers,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'Request failed',
                  status: error.response?.status,
                  statusText: error.response?.statusText,
                  data: error.response?.data,
                  message: error.message,
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
