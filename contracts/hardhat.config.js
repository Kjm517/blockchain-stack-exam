import 'dotenv/config';
import '@nomicfoundation/hardhat-viem';

const { RPC_URL: ENV_RPC_URL, OPERATOR_KEY: ENV_OPERATOR_KEY } = process.env;
const RPC_URL = ENV_RPC_URL;
const OPERATOR_KEY = ENV_OPERATOR_KEY;
const isValidPrivateKey = (key) => typeof key === 'string' && /^0x[0-9a-fA-F]{64}$/.test(key);
const ACCOUNTS = isValidPrivateKey(OPERATOR_KEY) ? [OPERATOR_KEY] : [];

if (!RPC_URL || !/^https?:\/\//i.test(RPC_URL)) {
    throw new Error('RPC_URL is missing or invalid. Please set a valid HTTP(S) URL in your environment.');
}

export default {
    solidity: {
        compilers: [
            {
                version: '0.8.27',
                settings: {
                    optimizer: { enabled: true, runs: 500 },
                },
            },
            {
                version: '0.8.22',
                settings: {
                    optimizer: { enabled: true, runs: 500 },
                },
            },
        ],
    },

    networks: {
        testnet: {
          type: 'http',
          url: RPC_URL,
          accounts: ACCOUNTS,
        },
    },
    defaultNetwork: 'testnet',
};