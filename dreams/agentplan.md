Honeypot Sentinel
Labels: $1000, bounty, security, risk-management, defi, trading, evm

💰 Bounty
$1,000

🎯 Goal
An x402-gated API that simulates a buy/approve/sell transaction on a mainnet fork to determine if a token is a "honeypot" (i.e., cannot be sold).

📖 Description
Autonomous trading agents (like one using Fresh Markets Watch) are a primary consumer for new, unvetted tokens. Their biggest risk is buying a "honeypot" token where the smart contract code allows buys but blocks sells, resulting in a 100% loss.

This service acts as an "insurance policy" for agents. Before committing real funds, an agent can pay this API (via x402) to get a rapid, high-fidelity risk report. The service must fork the mainnet, impersonate a wallet, and execute a realistic simulation to provide a simple, machine-readable answer.

💻 Technical Specifications
Job: For a given token, fork the mainnet and simulate a full trade (buy, approve, sell) to check for honeypot code, high taxes, or low liquidity.

Inputs:

token_address - (string) The token contract address to check.

chain_id - (string) The chain to check (e.g., 'base', 'ethereum').

buy_amount_usd - (number, optional, default: 50) The USD-equivalent amount of native ETH to use for the simulation, to ensure realistic price impact.

dex_router - (string, optional) A specific DEX router to test against. If null, the service must find the largest liquidity pool (e.g., via Uniswap v3/v2).

Returns:

is_honeypot - (boolean) The primary signal. true if the sell simulation failed, false otherwise.

buy_tax - (number) The simulated buy tax as a decimal (e.g., 0.05 for 5%).

sell_tax - (number) The simulated sell tax as a decimal (e.g., 0.99 for 99%).

pool_liquidity_usd - (number) The total USD value of liquidity in the pool used for the simulation.

simulation_error - (string | null) The EVM revert reason if the sell failed (e.g., "VM Error: REVERTED. Contract logic blocked sell.")

🏆 Acceptance Criteria
✅ Must be deployed on a domain and reachable via x402. ✅ The entire simulation and response must be returned in < 15 seconds to be viable for autonomous agents. ✅ Successfully identifies a known safe token (e.g., WETH) as is_honeypot: false. ✅ Successfully identifies a known honeypot token as is_honeypot: true and sell_tax: > 0.9. ✅ Returns accurate (or near-accurate) buy/sell taxes and pool liquidity. ✅ Must support at least Base and Ethereum mainnets.

Done When
An agent can programmatically send a token address and receive a definitive boolean is_honeypot status, plus tax and liquidity data, allowing it to make an automated, low-risk trading decision.



import { z } from "zod";
import { createAgentApp } from "@lucid-dreams/agent-kit";
// You will create this file to hold your complex simulation logic
import { runHoneypotSimulation } from "./simulationService"; 

const { app, addEntrypoint } = createAgentApp({
  name: "honeypot-sentinel",
  version: "0.1.0",
  description: "Check if a token is a honeypot by simulating a buy/sell.",
});

addEntrypoint({
  key: "check",
  description: "Run a honeypot simulation for a token.",
  input: z.object({
    token_address: z.string().describe("The token contract address"),
    chain_id: z.string().describe("The chain ID (e.g., 'base')"),
    buy_amount_usd: z.number().optional().default(50), // Added from your spec
  }),
  async handler({ input }) {
    
    // --- THIS IS THE REAL HANDLER ---
    // It calls your complex simulation logic, which is kept in a separate file.
    
    try {
      const simulationResult = await runHoneypotSimulation({
        tokenAddress: input.token_address,
        chainId: input.chain_id,
        buyAmountUSD: input.buy_amount_usd,
      });

      // The simulation service returns the exact output format.
      return {
        output: simulationResult,
        usage: { total_tokens: 100 }, // You can base this on simulation complexity
      };

    } catch (error) {
      console.error("Simulation failed:", error);
      // Return a structured error if the simulation itself breaks
      return {
        output: {
          is_honeypot: true, // Fail-safe: if simulation breaks, assume it's a honeypot
          buy_tax: 0,
          sell_tax: 0,
          simulation_error: "Service Error: " + error.message,
        },
        usage: { total_tokens: 10 },
      };
    }
  },
});

export default app;
