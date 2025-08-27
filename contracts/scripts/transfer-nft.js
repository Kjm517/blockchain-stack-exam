import hre from 'hardhat';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

async function main() {
    const rpcUrl = process.env.RPC_URL || '';
    const pk = process.env.OPERATOR_KEY || '';
    const from = process.env.FROM || '';
    const to = process.env.TO || '';
    const tokenIdStr = process.env.TOKEN_ID || '';
    const contractAddress = process.env.CONTRACT || '';

    if (!rpcUrl || !pk || !from || !to || !tokenIdStr || !contractAddress) {
        throw new Error('Set RPC_URL, OPERATOR_KEY, FROM, TO, TOKEN_ID, CONTRACT env vars');
    }

    const tokenId = BigInt(tokenIdStr);
    const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
    const publicClient = createPublicClient({ transport: http(rpcUrl) });
    const walletClient = createWalletClient({ account, transport: http(rpcUrl) });
    const artifact = await hre.artifacts.readArtifact('MyToken');

    const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: artifact.abi,
        functionName: 'safeTransferFrom',
        args: [from, to, tokenId],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`Transferred token ${tokenId} from ${from} to ${to}. Tx: ${receipt.transactionHash}`);
}

main().catch((e) => { console.error(e); process.exit(1); });


