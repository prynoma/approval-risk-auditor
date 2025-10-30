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
const endpointPath = process.env.ENDPOINT_PATH as string; // e.g. /weather
const url = `${baseURL}${endpointPath}`; // e.g. https://example.com/weather

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
  const signer = await createSigner("base-sepolia", privateKey);
  const fetchWithPayment = wrapFetchWithPayment(fetch, signer);

  const response = await fetchWithPayment(url, { method: "GET" });
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
