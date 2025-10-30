import Moralis from "moralis";
import { encodeFunctionData, parseAbi } from "viem";

const erc20Abi = parseAbi([
    "function approve(address spender, uint256 amount) external returns (bool)",
]);

function getScanApiUrl(chainId: string) {
    if (chainId === "base") {
        return "https://api.basescan.org/api";
    } else {
        return "https://api.etherscan.io/api";
    }
}

async function isContractVerified(contractAddress: string, chainId: string) {
    const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
    if (!ETHERSCAN_API_KEY) {
        throw new Error("Etherscan API key not set.");
    }

    const apiUrl = getScanApiUrl(chainId);
    const url = `${apiUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    return data.status === "1";
}

// This function can be slow as it makes multiple API calls to Etherscan.
async function getContractCreationDate(contractAddress: string, chainId: string) {
    const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
    if (!ETHERSCAN_API_KEY) {
        throw new Error("Etherscan API key not set.");
    }

    const apiUrl = getScanApiUrl(chainId);
    const url = `${apiUrl}?module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "1") {
        const txHash = data.result[0].txHash;
        const txUrl = `${apiUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`;
        const txResponse = await fetch(txUrl);
        const txData = await txResponse.json();
        const blockNumber = txData.result.blockNumber;
        const blockUrl = `${apiUrl}?module=proxy&action=eth_getBlockByNumber&tag=${blockNumber}&boolean=false&apikey=${ETHERSCAN_API_KEY}`;
        const blockResponse = await fetch(blockUrl);
        const blockData = await blockResponse.json();
        return new Date(parseInt(blockData.result.timestamp) * 1000);
    }

    return null;
}

export async function scanWalletForRiskyApprovals(walletAddress: string, chainId: string) {
    await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
    });

    const response = await (Moralis.EvmApi.token as any).getWalletTokenAllowance({
        address: walletAddress,
        chain: chainId,
    });

    const allowances = response.result;
    const riskyApprovals = [];

    for (const allowance of allowances) {
        const isVerified = await isContractVerified(allowance.spender, chainId);
        const creationDate = await getContractCreationDate(allowance.spender, chainId);

        let riskScore = 0;
        const riskFactors = [];

        if (allowance.allowance === "115792089237316195423570985008687907853269984665640564039457584007913129639935") {
            riskScore += 40;
            riskFactors.push("Unlimited allowance");
        }

        if (!isVerified) {
            riskScore += 30;
            riskFactors.push("Non-verified contract");
        }

        if (creationDate && (new Date().getTime() - creationDate.getTime()) < 30 * 24 * 60 * 60 * 1000) {
            riskScore += 30;
            riskFactors.push("Newly created contract");
        }

        if (riskScore > 0) {
            let riskLevel = "low";
            if (riskScore >= 70) {
                riskLevel = "critical";
            } else if (riskScore >= 40) {
                riskLevel = "high";
            } else if (riskScore >= 30) {
                riskLevel = "medium";
            }

            const revokeTxData = encodeFunctionData({
                abi: erc20Abi,
                functionName: "approve",
                args: [allowance.spender, 0n],
            });

            riskyApprovals.push({
                ...allowance,
                risk_score: riskScore,
                risk_level: riskLevel,
                risk_factors: riskFactors,
                revoke_tx_data: revokeTxData,
            });
        }
    }

    return riskyApprovals;
}