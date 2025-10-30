# Approval Risk Auditor Agent

Your vigilant guardian against risky token approvals. 🛡️

The Approval Risk Auditor is a powerful tool that helps you to identify and manage risky token approvals for any given wallet address on EVM-compatible chains. It scans all ERC-20 token approvals for a wallet and provides a detailed risk report, including a risk score, a risk level, and actionable `revoke_tx_data`.

## Why use the Approval Risk Auditor?

*   **Protect your assets:** Identify and revoke approvals to potentially malicious or compromised contracts.
*   **Enhance security:** Gain visibility into your wallet's exposure to third-party contracts.
*   **Peace of mind:** Understand the risks associated with your token approvals.

## How it works

The agent analyzes token approvals based on a set of intelligent rules:

1.  **Unlimited Allowance:** Flags approvals that grant unlimited spending power to a contract.
2.  **Non-Verified Contract:** Identifies approvals given to contracts whose source code is not verified on block explorers (e.g., Etherscan, Basescan).
3.  **Newly Created Contract:** Highlights approvals to contracts that have been deployed very recently, which can sometimes indicate higher risk.

For each risky approval, the agent provides a comprehensive report including a risk score, a categorized risk level (low, medium, high, critical), and the specific factors contributing to the risk. Crucially, it also generates the raw transaction data needed to safely revoke these approvals.

## API Reference

The agent exposes a single entrypoint: `check`.

- **Endpoint:** `POST /entrypoints/check/invoke`
- **Description:** Scan a wallet for risky ERC-20 token approvals.

### Input

| Parameter | Type | Description |
|---|---|---|
| `wallet_address` | `string` | The wallet address to scan. |
| `chain_id` | `string` | The chain ID (e.g., 'base', 'mainnet'). |

### Output

| Parameter | Type | Description |
|---|---|---|
| `risky_approvals[]` | `array` | A list of identified risky approvals. |
| `risky_approvals[].token_address` | `string` | The address of the approved token. |
| `risky_approvals[].spender` | `string` | The address of the contract approved to spend the token. |
| `risky_approvals[].allowance` | `string` | The approved amount. |
| `risky_approvals[].risk_score` | `number` | A numerical score indicating the severity of the risk. |
| `risky_approvals[].risk_level` | `string` | Categorized risk level: 'low', 'medium', 'high', 'critical'. |
| `risky_approvals[].risk_factors` | `array` | A list of reasons contributing to the risk. |
| `risky_approvals[].revoke_tx_data` | `string` | Raw transaction data to revoke the approval (for ERC-20 tokens). |

## Getting Started (Local Deployment)

To run the Approval Risk Auditor agent locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/wlplease/approval-risk-auditor.git
    cd approval-risk-auditor
    ```
2.  **Install dependencies:**
    ```bash
    bun install
    ```
3.  **Configure Environment Variables:** Create a `.env` file in the root directory based on `.env.example`. You will need to provide:
    *   `MORALIS_API_KEY`
    *   `ETHERSCAN_API_KEY`
    *   `RPC_URL` (for Base)
    *   `ETH_MAINNET_RPC_URL` (for Ethereum Mainnet)
    *   `PRIVATE_KEY` (for agent payments)
    *   `PAY_TO` (address for agent payments)
    *   `DEFAULT_PRICE` (price per invocation)

4.  **Start the agent:**
    ```bash
    bun run agent
    ```
    The agent will be accessible at `http://localhost:8787`.

## Community & Support

*   **GitHub:** https://github.com/wlplease/approval-risk-auditor
*   **Twitter:** https://x.com/honeypotagent (Note: This is a placeholder. Please update with the correct Twitter for this agent if available.)
