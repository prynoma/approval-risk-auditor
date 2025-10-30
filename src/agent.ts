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
    network: (process.env.NETWORK as any) ?? "base",
    defaultPrice: process.env.DEFAULT_PRICE ?? "2222222222222222",
  },
};

const { app, addEntrypoint } = createAgentApp(
  {
    name: "approval-risk-auditor",
    version: "0.0.1",
    description: "Scans a wallet for risky token approvals and generates a risk report.",
  },
  {
    config: configOverrides,
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
