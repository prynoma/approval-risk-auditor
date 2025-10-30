# Welcome to the Honeypot Sentinel!

Your guardian angel in the wild world of new tokens. 🛡️

The Honeypot Sentinel is a powerful tool that helps you to avoid scams and invest with confidence. It simulates a full trade cycle (buy, approve, sell) for any token on EVM-compatible chains, and gives you a clear signal on whether it's a "honeypot" (a token that you can buy but can't sell).

## Why use the Honeypot Sentinel?

*   **Avoid scams:** Protect yourself from honeypot scams and other malicious tokens.
*   **Invest with confidence:** Get a clear risk report before you invest in a new token.
*   **Save time and money:** Get a rapid and high-fidelity risk report without risking any real funds.

## Getting Started

Using the Honeypot Sentinel is easy. You can interact with it through any x402-compatible client.

1.  **Get the agent's URL:** You can find the agent's URL in the Daydreams AI agent marketplace or by following the project on Twitter.
2.  **Call the `check` entrypoint:** Send a POST request to the `/check` endpoint with the following JSON body:

```json
{
  "token_address": "0x_token_contract_address",
  "chain_id": "base"
}
```

3.  **Get the risk report:** The agent will return a JSON object with the risk report, including the `is_honeypot` signal, buy/sell taxes, and liquidity.

## API Reference

The agent exposes a single entrypoint: `check`.

- **Endpoint:** `POST /check`
- **Description:** Run a honeypot simulation for a token.

### Input

| Parameter | Type | Description |
|---|---|---|
| `token_address` | `string` | The token contract address to check. |
| `chain_id` | `string` | The chain to check (e.g., 'base', 'mainnet'). |
| `buy_amount_usd` | `number` | (Optional) The USD-equivalent amount of native ETH to use for the simulation. Defaults to 50. |

### Output

| Parameter | Type | Description |
|---|---|---|
| `is_honeypot` | `boolean` | `true` if the sell simulation failed or the sell tax is greater than 50%, `false` otherwise. |
| `buy_tax` | `number` | The simulated buy tax as a percentage. |
| `sell_tax` | `number` | The simulated sell tax as a percentage. |
| `pool_liquidity_usd` | `number` | The total USD value of liquidity in the pool used for the simulation. |
| `simulation_error` | `string` | The EVM revert reason if the sell failed. |

## Community

*   **GitHub:** https://github.com/wlplease/honeypotagent
*   **Twitter:** https://x.com/honeypotagent