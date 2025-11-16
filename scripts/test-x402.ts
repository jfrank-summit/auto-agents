#!/usr/bin/env tsx
/**
 * Test script for x402 MCP wrapper
 *
 * Prerequisites:
 * 1. Install dependencies: yarn add viem x402-axios
 * 2. Set up a test x402 server (see instructions below)
 * 3. Have a wallet with USDC on Base Sepolia or Base Mainnet
 *
 * To set up a test x402 server:
 * - Clone: https://github.com/coinbase/x402
 * - Navigate to: examples/typescript/servers/express
 * - Run: npm install && npm start
 * - Server will run on http://localhost:4021
 */

import { createX402Tools } from '../src/tools/x402-mcp/index.js';

const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const TEST_URL = process.env.TEST_URL || 'http://localhost:4021/weather';

if (!PRIVATE_KEY) {
  console.error('❌ Error: PRIVATE_KEY environment variable is required');
  console.error('   Set it with: export PRIVATE_KEY=0xYourPrivateKey');
  process.exit(1);
}

async function testX402Tool() {
  console.info('🚀 Testing x402 MCP wrapper...\n');

  try {
    // Create the x402 tools
    console.info('📦 Creating x402 tools...');
    const tools = await createX402Tools({
      privateKey: PRIVATE_KEY,
    });

    if (tools.length === 0) {
      console.error('❌ No tools were created');
      process.exit(1);
    }

    console.info(`✅ Created ${tools.length} tool(s)`);
    console.info(`   Tool name: ${tools[0].name}`);
    console.info(`   Description: ${tools[0].description}\n`);

    // Test the tool with a GET request
    console.info(`🌐 Testing GET request to: ${TEST_URL}`);
    const result = await tools[0].invoke({
      url: TEST_URL,
      method: 'GET',
    });

    console.info('\n✅ Success! Response:');
    const response = JSON.parse(result);
    console.info(JSON.stringify(response, null, 2));

    // Check if payment was made (x402 protocol)
    if (response.headers?.['x-payment-response']) {
      const paymentInfo = JSON.parse(
        Buffer.from(response.headers['x-payment-response'], 'base64').toString(),
      );
      console.info('\n💰 Payment Info:');
      console.info(`   Transaction: ${paymentInfo.transaction}`);
      console.info(`   Network: ${paymentInfo.network}`);
      console.info(`   Payer: ${paymentInfo.payer}`);
      console.info(`   Success: ${paymentInfo.success}`);
    }
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

testX402Tool().then(() => {
  process.exit(0);
});
