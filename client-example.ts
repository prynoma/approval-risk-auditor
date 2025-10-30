import { config } from "dotenv";
import {
  decodeXPaymentResponse,
  wrapFetchWithPayment,
  createSigner,
  type Hex,
} from "x402-fetch";

config();

const privateKey = process.env.PRIVATE_KEY as Hex | string;
const baseURL = process.env.RESOURCE_SERVER_URL as string; // e.g. https://example.com
const endpointPath = process.env.ENDPOINT_PATH as string; // e.g. /entrypoints/check/invoke
const url = `${baseURL}${endpointPath}`;

if (!baseURL || !privateKey || !endpointPath) {
  console.error("Missing required environment variables");
  process.exit(1);
}

/**
 * Demonstrates paying for a protected resource using x402-fetch.
 *
 * Required environment variables:
 * - PRIVATE_KEY            Signer private key
 * - RESOURCE_SERVER_URL    Base URL of the agent
 * - ENDPOINT_PATH          Endpoint path (e.g. /entrypoints/echo/invoke)
 */
async function main(): Promise<void> {
  // const signer = await createSigner("solana-devnet", privateKey); // uncomment for Solana
  const signer = await createSigner("base", privateKey);
  const fetchWithPayment = wrapFetchWithPayment(fetch, signer);

  const response = await fetchWithPayment(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        wallet_address: "0x1234567890123456789012345678901234567890", // Replace with a sample wallet address
        chain_id: "base",
      },
    }),
  });
  const body = await response.json();
  console.log(body);

  const paymentResponse = decodeXPaymentResponse(
    response.headers.get("x-payment-response")!
  );
  console.log(paymentResponse);
}

main().catch((error) => {
  console.error(error?.response?.data?.error ?? error);
  process.exit(1);
});