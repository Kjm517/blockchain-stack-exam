import hre from 'hardhat';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

async function main() {
    try {
        console.log("Starting minting process...");

        const rpcUrl = process.env.RPC_URL || '';
        const pk = process.env.OPERATOR_KEY || '';
        const contractAddress = process.env.CONTRACT || '';
        const to = process.env.TO || '';

        if (!rpcUrl || !pk || !contractAddress) {
            throw new Error('Set RPC_URL, OPERATOR_KEY, CONTRACT (and optional TO)');
        }

        const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
        const publicClient = createPublicClient({ transport: http(rpcUrl) });
        const walletClient = createWalletClient({ account, transport: http(rpcUrl) });
        const artifact = await hre.artifacts.readArtifact('MyToken');

        const recipient = to || account.address;
        console.log("Minting to:", recipient);

        const txHash = await walletClient.writeContract({
            address: contractAddress,
            abi: artifact.abi,
            functionName: 'safeMint',
            args: [recipient],
        });
        console.log("Mint transaction hash:", txHash);

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log("Confirmed in block:", receipt.blockNumber);

        console.log("Mint successful");
    } catch (error) {
        console.error("Minting failed:", error.message || error);
        process.exit(1);
    }
}

main().catch((e) => {
    console.error("Script failed:", e);
    process.exit(1);
});