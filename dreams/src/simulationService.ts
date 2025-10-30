import { parseAbi, encodeFunctionData, createPublicClient, http } from "viem";
import { base, mainnet } from "viem/chains";
import Moralis from "moralis";

// ABIs
const uniswapV2RouterAbi = parseAbi([
  "function factory() external pure returns (address)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
]);
const uniswapV2FactoryAbi = parseAbi([
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
]);
const uniswapV2PairAbi = parseAbi([
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
]);
const erc20Abi = parseAbi([
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
]);
const chainlinkPriceFeedAbi = parseAbi([
    "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
]);

// Contract addresses
const contractAddresses: any = {
    "base": {
        "WETH_ADDRESS": "0x4200000000000000000000000000000000000006",
        "ETH_USD_PRICE_FEED": "0x71041dddad3595F9CEd3DcCFBe3D127Bba988782",
    },
    "mainnet": {
        "WETH_ADDRESS": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "ETH_USD_PRICE_FEED": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    }
}

// Tenderly API function
async function createTenderlyFork(chainId: string) {
    const TENDERLY_ACCOUNT_NAME = process.env.TENDERLY_USERNAME;
    const TENDERLY_PROJECT_NAME = process.env.TENDERLY_PROJECT_NAME;
    const TENDERLY_ACCESS_KEY = process.env.TENDERLY_API_KEY;

    if (!TENDERLY_ACCOUNT_NAME || !TENDERLY_PROJECT_NAME || !TENDERLY_ACCESS_KEY) {
        throw new Error("Tenderly environment variables not set.");
    }

    const network_id = chainId === "base" ? "8453" : "1";

    const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT_NAME}/project/${TENDERLY_PROJECT_NAME}/fork`;
    const headers = {
        'X-Access-Key': TENDERLY_ACCESS_KEY,
        'Content-Type': 'application/json',
    };
    const data = {
        network_id: network_id,
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error creating Tenderly Fork: ${errorData.message}`);
    }

    return await response.json();
}

// Moralis API function
async function getLargestLiquidityPool(tokenAddress: string, chainId: string) {
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
    if (!MORALIS_API_KEY) {
        throw new Error("Moralis API key not set.");
    }

    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/pairs?chain=${chainId}`;
    const headers = {
        'X-API-Key': MORALIS_API_KEY,
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error getting token pairs from Moralis: ${errorData.message}`);
    }

    const data = await response.json();
    const pairs = data.pairs;

    if (pairs.length === 0) {
        throw new Error("No liquidity pools found for this token.");
    }

    let largestPool = pairs[0];
    for (let i = 1; i < pairs.length; i++) {
        if (Number(pairs[i].liquidity_usd) > Number(largestPool.liquidity_usd)) {
            largestPool = pairs[i];
        }
    }

    return largestPool.exchange_address;
}

async function getFactoryAddress(routerAddress: `0x${string}`, forkClient: any) {
    return await forkClient.readContract({
        address: routerAddress,
        abi: uniswapV2RouterAbi,
        functionName: "factory",
    });
}

export async function runHoneypotSimulation(args: {
  tokenAddress: `0x${string}`;
  chainId: string;
  buyAmountUSD: number;
}): Promise<any> {
  console.log("Running honeypot simulation with Tenderly for:", args);

  const dexRouterAddress = await getLargestLiquidityPool(args.tokenAddress, args.chainId) as `0x${string}`;

  const WETH_ADDRESS = contractAddresses[args.chainId].WETH_ADDRESS;
  const ETH_USD_PRICE_FEED = contractAddresses[args.chainId].ETH_USD_PRICE_FEED;
  const impersonatedAccount = "0x4675C7e5BaAFB509941273635dF8eF3eda0B0b99"; // A random address to impersonate

  let fork;
  try {
    fork = await createTenderlyFork(args.chainId);
    const forkClient = createPublicClient({
        chain: args.chainId === "base" ? base : mainnet,
        transport: http(fork.simulation_fork.rpc_url),
    });

    const factoryAddress = await getFactoryAddress(dexRouterAddress, forkClient);

    // 1. Get the latest ETH price from Chainlink
    const roundData = await forkClient.readContract({
        address: ETH_USD_PRICE_FEED,
        abi: chainlinkPriceFeedAbi,
        functionName: "latestRoundData",
    });
    const ethPrice = Number(roundData[1]) / 1e8;

    // 2. Find the liquidity pool
    const pairAddress = await forkClient.readContract({
      address: factoryAddress,
      abi: uniswapV2FactoryAbi,
      functionName: "getPair",
      args: [args.tokenAddress, WETH_ADDRESS],
    });

    if (pairAddress === "0x0000000000000000000000000000000000000000") {
      return {
        is_honeypot: true,
        simulation_error: "No liquidity pool found with WETH.",
      };
    }

    // 3. Get pool liquidity
    const reserves = await forkClient.readContract({
      address: pairAddress,
      abi: uniswapV2PairAbi,
      functionName: "getReserves",
    });

    const pool_liquidity_usd = (Number(reserves[0] * 2n) / 1e18) * ethPrice;

    const buyAmountInWei = BigInt(Math.floor((args.buyAmountUSD / ethPrice) * 1e18));

    // Fund the impersonated account
    await (forkClient as any).request({
        method: 'tenderly_setBalance',
        params: [impersonatedAccount, `0x${buyAmountInWei.toString(16)}`]
    });

    // Simulate buy
    await (forkClient as any).request({
        method: 'tenderly_simulateTransaction',
        params: [{
            from: impersonatedAccount,
            to: dexRouterAddress,
            data: encodeFunctionData({
                abi: uniswapV2RouterAbi,
                functionName: "swapExactETHForTokens",
                args: [0n, [WETH_ADDRESS, args.tokenAddress], impersonatedAccount, BigInt(Math.floor(Date.now() / 1000)) + 60n],
            }),
            value: `0x${buyAmountInWei.toString(16)}`,
        }]
    });

    const boughtAmount = await forkClient.readContract({
        address: args.tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [impersonatedAccount],
    });

    // Simulate approve
    await (forkClient as any).request({
        method: 'tenderly_simulateTransaction',
        params: [{
            from: impersonatedAccount,
            to: args.tokenAddress,
            data: encodeFunctionData({
                abi: erc20Abi,
                functionName: "approve",
                args: [dexRouterAddress, boughtAmount],
            }),
        }]
    });

    // Simulate sell
    const ethBalanceBeforeSell = await forkClient.getBalance({ address: impersonatedAccount });
    await (forkClient as any).request({
        method: 'tenderly_simulateTransaction',
        params: [{
            from: impersonatedAccount,
            to: dexRouterAddress,
            data: encodeFunctionData({
                abi: uniswapV2RouterAbi,
                functionName: "swapExactTokensForETH",
                args: [boughtAmount, 0n, [args.tokenAddress, WETH_ADDRESS], impersonatedAccount, BigInt(Math.floor(Date.now() / 1000)) + 60n],
            }),
        }]
    });
    const ethBalanceAfterSell = await forkClient.getBalance({ address: impersonatedAccount });

    const buyTax = (1 - Number(boughtAmount) / Number(buyAmountInWei)) * 100;
    const sellTax = (1 - (Number(ethBalanceAfterSell - ethBalanceBeforeSell)) / Number(buyAmountInWei)) * 100;

    return {
      is_honeypot: sellTax > 50,
      buy_tax: buyTax,
      sell_tax: sellTax,
      pool_liquidity_usd: pool_liquidity_usd,
      simulation_error: null,
    };

  } catch (error) {
    console.error("Tenderly simulation failed:", error);
    return {
      is_honeypot: true,
      simulation_error: "Tenderly Service Error: " + (error as Error).message,
    };
  } finally {
      if (fork) {
        // No need to delete the fork, Tenderly handles this
      }
  }
}