import { z } from "zod";
import { createAgentApp, AgentKitConfig } from "@lucid-dreams/agent-kit";

const configOverrides: AgentKitConfig = {
  payments: {
    facilitatorUrl:
      (process.env.FACILITATOR_URL as any) ??
      "https://facilitator.daydreams.systems",
    payTo:
      (process.env.PAY_TO as `0x${string}`) ??
      "0x002627cf49A8D42ca59Cbef11f00EB42DA027D34",
    network: "base",
    defaultPrice: process.env.DEFAULT_PRICE ?? "2222222222222222",
  },
};

const { app, addEntrypoint } = createAgentApp(
  {
    name: "approval-risk-auditor",
    version: "0.0.1",
    network: "base",
  },
  {
    config: configOverrides,
    payments: {
      network: "base",
    },
  }
);

import { scanWalletForRiskyApprovals } from "./scanner";

addEntrypoint({
  key: "check",
  description: "Scan a wallet for risky token approvals.",
  input: z.object({
    wallet_address: z.string().describe("The wallet address to scan."),
    chain_id: z.string().describe("The chain ID (e.g., 'base', 'mainnet')."),
  }),
  output: z.object({
    risky_approvals: z.array(z.object({
      token_address: z.string(),
      spender: z.string(),
      allowance: z.string(),
      risk_score: z.number(),
      risk_level: z.string(),
      risk_factors: z.array(z.string()),
      revoke_tx_data: z.string(),
    })),
  }),
  async handler({ input }) {
    const riskyApprovals = await scanWalletForRiskyApprovals(input.wallet_address, input.chain_id);

    return {
      output: {
        risky_approvals: riskyApprovals,
      },
    };
  },
});

export default app;
