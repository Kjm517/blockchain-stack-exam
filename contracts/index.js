const ethers = require('ethers');
const dotenv = require('dotenv');
dotenv.config();

const rpcUrlHederatestnet = process.env.RPC_URL;
if(!rpcUrlHederatestnet || !rpcUrlHederatestnet.startsWith('http')) {
    throw new Error('Missing or invalid value in RPC_URL env var');
}

const web3Provider = (ethers.providers && ethers.providers.JsonRpcProvider)
    ? new ethers.providers.JsonRpcProvider(rpcUrlHederatestnet)
    : new ethers.JsonRpcProvider(rpcUrlHederatestnet);

async function main() {
    try {
        const blockNumber = await web3Provider.getBlockNumber()
        console.log('block number: ', blockNumber);
    } catch (error) {
        console.log('Error getting block number: ', error);
    }

    try {
        const balance = await web3Provider.getBalance('0x223090B981185d1A4Ab2f59E10cdf7F9B9e63f1a');
        const formatEther = (ethers.utils && ethers.utils.formatEther) ? ethers.utils.formatEther : ethers.formatEther;
        console.log('balance', formatEther(balance));
    } catch (error) {
        console.log('Error getting balance: ', error);
    }
}

main();