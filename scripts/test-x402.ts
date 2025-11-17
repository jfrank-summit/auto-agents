#!/usr/bin/env tsx
/**
 * Test script for x402 tool
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
 *
 * Usage:
 *   yarn test-x402 <character_name>
 */

import { getConfig } from '@autonomys/agent-core';

import { createX402Tools } from '../src/tools/x402-mcp/index.js';

const characterName = process.argv[2];
const TEST_URL = process.env.TEST_URL || 'http://localhost:4021/weather';

if (!characterName) {
  console.error('❌ Error: Character name is required');
  console.error('   Usage: yarn test-x402 <character_name>');
  process.exit(1);
}

// Load config for the character
const configInstance = await getConfig();
if (!configInstance) {
  console.error('❌ Error: Failed to load config');
  process.exit(1);
}

// Try to get PRIVATE_KEY from blockchainConfig (for x402 payments)
const PRIVATE_KEY =
  (configInstance.config.blockchainConfig?.PRIVATE_KEY as string) ||
  (process.env.PRIVATE_KEY as string) ||
  '';

if (!PRIVATE_KEY) {
  console.error('❌ Error: PRIVATE_KEY not found');
  console.error("   Set it in your character's .env file as PRIVATE_KEY=0xYourPrivateKey");
  console.error('   Or set it as an environment variable: export PRIVATE_KEY=0xYourPrivateKey');
  process.exit(1);
}

async function testX402Tool() {
  console.info('🚀 Testing x402 tool...\n');

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
