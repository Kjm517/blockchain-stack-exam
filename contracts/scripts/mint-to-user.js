import hre from 'hardhat';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

async function main() {
    const rpcUrl = process.env.RPC_URL || '';
    const pk = process.env.OPERATOR_KEY || '';
    const to = process.env.TO || '';
    const contractAddress = process.env.CONTRACT || '';

    if (!rpcUrl || !pk || !to || !contractAddress) {
        throw new Error('Set RPC_URL, OPERATOR_KEY, TO, CONTRACT env vars');
    }

    const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
    const publicClient = createPublicClient({ transport: http(rpcUrl) });
    const walletClient = createWalletClient({ account, transport: http(rpcUrl) });
    const artifact = await hre.artifacts.readArtifact('MyToken');

    const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: artifact.abi,
        functionName: 'safeMint',
        args: [to],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`Minted to ${to}. Tx: ${receipt.transactionHash}`);
}

main().catch((e) => { console.error(e); process.exit(1); });


