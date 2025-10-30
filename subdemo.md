Purpose
Flag unlimited or stale ERC-20 / NFT approvals and build revoke calls.

Specification
Job: Detect risky approvals and output safe revocation data.

Inputs:

wallet - Wallet address to audit
chains - Chains to scan
Returns:

approvals[] - List of all approvals found
risk_flags - Risk indicators for each approval
revoke_tx_data[] - Transaction data to revoke approvals
Acceptance Criteria
✅ Matches Etherscan approval data for top tokens
✅ Identifies unlimited and stale approvals
✅ Provides valid revocation transaction data
✅ Must be deployed on a domain and reachable via x402

Done When
Agent accurately audits wallet approvals and generates working revocation transactions.

Basic Example
import { z } from "zod";
import { createAgentApp } from "@lucid-dreams/agent-kit";

const { app, addEntrypoint } = createAgentApp({
  name: "approval-risk-auditor",
  version: "0.1.0",
  description: "Flag unlimited or stale ERC-20 / NFT approvals",
});

addEntrypoint({
  key: "echo",
  description: "Echo a message",
  input: z.object({ text: z.string() }),
  async handler({ input }) {
    return {
      output: { text: String(input.text ?? "") },
      usage: { total_tokens: String(input.text ?? "").length },
    };
  },
});

export default app;
Resources
@lucid-dreams/agent-kit
Submission
Submission is a PR into this repo linking the issue - first in first served if the bounty has been completed