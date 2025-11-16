# x402 MCP Wrapper

A wrapper around the x402 payment protocol MCP server that enables making paid API requests to x402-enabled services.

## Features

- ✅ **General-purpose**: Works with any x402-enabled endpoint
- ✅ **Multiple HTTP methods**: Supports GET, POST, PUT, DELETE, PATCH
- ✅ **Automatic payment handling**: Automatically handles x402 payment protocol
- ✅ **Flexible configuration**: Only requires a private key

## Prerequisites

1. **Install dependencies**:
   ```bash
   yarn add viem x402-axios
   ```

2. **Wallet setup**: You need an Ethereum wallet with USDC on Base Sepolia (testnet) or Base Mainnet

3. **x402-enabled server**: You need an x402-enabled API server to test against

## Quick Test

### Option 1: Use the test script

1. **Set up a test x402 server** (if you don't have one):
   ```bash
   # Clone the x402 repo
   git clone https://github.com/coinbase/x402.git
   cd x402/examples/typescript/servers/express
   npm install
   npm start
   # Server runs on http://localhost:4021
   ```

2. **Run the test**:
   ```bash
   export PRIVATE_KEY=0xYourPrivateKey
   export TEST_URL=http://localhost:4021/weather  # Optional, defaults to localhost:4021/weather
   yarn test-x402
   ```

### Option 2: Use in your agent

Add to `src/agent.ts`:

```typescript
import { createX402Tools } from './tools/x402-mcp/index.js';

// In createAgentRunnerOptions:
const x402Tools = config.X402_PRIVATE_KEY
  ? await createX402Tools({ privateKey: config.X402_PRIVATE_KEY })
  : [];

const tools = [
  // ... other tools
  ...x402Tools,
].filter(tool => tool !== undefined);
```

Then add `X402_PRIVATE_KEY` to your character's config.

## Usage

The tool exposes a single `x402-request` tool that accepts:

- `url` (required): Full URL of the x402-enabled endpoint
- `method` (optional): HTTP method - GET, POST, PUT, DELETE, or PATCH (defaults to GET)
- `body` (optional): Request body object (for POST/PUT/PATCH)
- `headers` (optional): Custom HTTP headers
- `params` (optional): URL query parameters

### Example Tool Calls

```typescript
// GET request
await tool.invoke({
  url: 'https://api.example.com/data',
  method: 'GET',
});

// POST request with body
await tool.invoke({
  url: 'https://api.example.com/data',
  method: 'POST',
  body: { key: 'value' },
  headers: { 'X-Custom-Header': 'value' },
});

// GET with query parameters
await tool.invoke({
  url: 'https://api.example.com/search',
  method: 'GET',
  params: { q: 'search term', limit: '10' },
});
```

## How It Works

1. The wrapper creates an MCP server that uses `x402-axios` to intercept HTTP requests
2. When a request is made to an x402-enabled endpoint:
   - If the endpoint requires payment (HTTP 402), the interceptor handles the payment automatically
   - Payment is made using the provided private key
   - The request is retried after payment
3. The response is returned to the caller

## Security Notes

- ⚠️ **Never commit your private key** to version control
- ⚠️ Use environment variables or secure config management
- ⚠️ For production, use a dedicated wallet with limited funds
- ⚠️ Test on Base Sepolia testnet first

