# Honeypot Sentinel Agent Submission

## Agent Description

The Honeypot Sentinel is a powerful tool for anyone interacting with new and unvetted tokens on EVM-compatible chains. It acts as an insurance policy against "honeypot" scams, where a token's smart contract allows buys but prevents sells, leading to a complete loss of funds.

This agent provides a rapid and high-fidelity risk report by simulating a full trade cycle (buy, approve, sell) on a forked mainnet. It gives you a clear `is_honeypot` signal, along with other useful data like buy/sell taxes and liquidity, allowing you to make informed and low-risk trading decisions.

## Live Deployment Link

*   **Agent URL:** [YOUR_AGENT_URL]

## Acceptance Criteria Checklist

-   [x] Must be deployed on a domain and reachable via x402.
-   [x] The entire simulation and response must be returned in < 15 seconds to be viable for autonomous agents.
-   [x] Successfully identifies a known safe token (e.g., WETH) as is_honeypot: false.
-   [x] Successfully identifies a known honeypot token as is_honeypot: true and sell_tax: > 0.9.
-   [x] Returns accurate (or near-accurate) buy/sell taxes and pool liquidity.
-   [x] Must support at least Base and Ethereum mainnets.

## Solana Wallet Address

NjwKujMk7kaKMamW4PTDWqZ29yGMAaCGyo7FNfCrFDR

## Additional Resources

*   **GitHub Repository:** https://github.com/wlplease/honeypotagent
*   **Twitter:** https://x.com/honeypotagent
*   **Agent Documentation:** [Link to honey.md]
