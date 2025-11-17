# x402 Tool

A LangChain tool that enables making paid API requests to x402-enabled services using the x402 payment protocol.

## Features

- ✅ **General-purpose**: Works with any x402-enabled endpoint
- ✅ **Multiple HTTP methods**: Supports GET, POST, PUT, DELETE, PATCH
- ✅ **Automatic payment handling**: Automatically handles x402 payment protocol
- ✅ **Flexible configuration**: Only requires a private key
- ✅ **Direct integration**: Simple LangChain tool (no MCP server layer)

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
   # Uses PRIVATE_KEY from character's .env file (blockchainConfig.PRIVATE_KEY)
   yarn test-x402 <character_name>

   # Or set it as an environment variable
   export PRIVATE_KEY=0xYourPrivateKey
   export TEST_URL=http://localhost:4021/weather  # Optional, defaults to localhost:4021/weather
   yarn test-x402 <character_name>
   ```

### Option 2: Use in your agent

Add to `src/agent.ts`:

```typescript
import { createX402Tools } from './tools/x402-mcp/index.js';

// In createAgentRunnerOptions:
const x402Tools = config.blockchainConfig?.PRIVATE_KEY
  ? await createX402Tools({ privateKey: config.blockchainConfig.PRIVATE_KEY })
  : [];

const tools = [
  // ... other tools
  ...x402Tools,
].filter(tool => tool !== undefined);
```

The tool will use the `PRIVATE_KEY` from your character's `.env` file (from `blockchainConfig.PRIVATE_KEY`).

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

1. The tool uses `x402-axios` to create an axios client with a payment interceptor
2. When a request is made to an x402-enabled endpoint:
   - If the endpoint requires payment (HTTP 402), the interceptor handles the payment automatically
   - Payment is made using the provided private key
   - The request is retried after payment
3. The response is returned to the caller as a JSON string

## Security Notes

- ⚠️ **Never commit your private key** to version control
- ⚠️ Use environment variables or secure config management
- ⚠️ For production, use a dedicated wallet with limited funds
- ⚠️ Test on Base Sepolia testnet first
