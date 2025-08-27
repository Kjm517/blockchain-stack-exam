import hre from 'hardhat';
import { createPublicClient, createWalletClient, http, formatEther } from 'viem';
import { privateKeyToAccount, mnemonicToAccount } from 'viem/accounts';


async function main() {
    try {
        console.log("Starting deployment with Viem...");
        
        const rpcUrl = (process.env.RPC_URL || '').trim();
        const rawKey = (process.env.OPERATOR_KEY || '').trim();
        const mnemonic = (process.env.OPERATOR_MNEMONIC || '').trim();

        if (!/^https?:\/\//i.test(rpcUrl)) {
            throw new Error('RPC_URL is missing or invalid (must start with http/https)');
        }

        const publicClient = createPublicClient({ transport: http(rpcUrl) });

        let account;
        if (rawKey) {
            const normalizedKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;
            if (/^0x[0-9a-fA-F]{64}$/.test(normalizedKey)) {
                account = privateKeyToAccount(normalizedKey);
            } else {
                console.warn('OPERATOR_KEY is not a valid 32-byte hex. Falling back to OPERATOR_MNEMONIC if provided.');
            }
        }

        if (!account && mnemonic) {
            account = mnemonicToAccount(mnemonic);
        }

        if (!account) {
            throw new Error('No valid operator credentials. Provide OPERATOR_KEY (0x + 64 hex) or OPERATOR_MNEMONIC.');
        }

        const walletClient = createWalletClient({ account, transport: http(rpcUrl) });
        
        const deployer = walletClient.account.address;
        console.log("Deploying contracts with the account:", deployer);
        
        // Check balance
        const balance = await publicClient.getBalance({ address: deployer });
        console.log("Account balance:", formatEther(balance), "ETH");
        
        // Deploy contract using viem + Hardhat artifacts
        console.log("Deploying MyToken contract...");
        const artifact = await hre.artifacts.readArtifact("MyToken");
        const txHash = await walletClient.deployContract({
            abi: artifact.abi,
            bytecode: artifact.bytecode,
            args: [deployer],
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        const contractAddress = receipt.contractAddress;
        console.log("Contract deployed at:", contractAddress);
        
        // Test the contract
        console.log("\nTesting deployed contract...");
        const name = await publicClient.readContract({
            address: contractAddress,
            abi: artifact.abi,
            functionName: 'name',
        });
        const symbol = await publicClient.readContract({
            address: contractAddress,
            abi: artifact.abi,
            functionName: 'symbol',
        });
        const totalSupply = await publicClient.readContract({
            address: contractAddress,
            abi: artifact.abi,
            functionName: 'totalSupply',
        });
        
        console.log("Token Name:", name);
        console.log("Token Symbol:", symbol);
        console.log("Total Supply:", totalSupply.toString());
        
        console.log("\nDeployment successful!");
        console.log("Save this contract address:", contractAddress);
        
        return contractAddress;
        
    } catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});