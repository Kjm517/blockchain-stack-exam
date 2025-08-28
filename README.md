# Web3 Ethereum Project

A full-stack Web3 application with wallet integration, blockchain data display, and custom token contracts.

## Overview

This project demonstrates core Ethereum blockchain interactions through three main components:

* **Frontend** - Web interface for connecting Ethereum wallets, viewing ETH balance, and transaction history
* **Backend API** - REST API providing gas prices, block numbers, and account details  
* **Smart Contracts** - ERC-20/ERC-721 token contracts for minting and transferring tokens

## Features

* Connect Ethereum wallets (MetaMask/WalletConnect)
* Display ETH balance and transaction history
* Get current network information and gas prices
* Mint and transfer custom tokens
* Error handling and responsive design

## Tech Stack

* **Frontend:** TypeScript, Vite, ethers.js, HTML/CSS
* **Backend:** Node.js, TypeScript, Express.js, CORS, ethers.js
* **Contracts:** Solidity, OpenZeppelin, Hardhat

## Prerequisites

* Node.js (v18.0.0 or higher)
* npm (v9.0.0 or higher)
* Git
* MetaMask browser extension
* Alchemy or Infura account

## Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd web3-ethereum-project
```

### 2. Frontend Setup
```bash
cd frontend
npm install ethers@6.7.1
npm install -g typescript
npm install
```

### 3. Backend Setup
```bash
cd backend
npm install express ethers cors dotenv
npm install -D typescript @types/node @types/express @types/cors ts-node-dev
npm install
```

**Create `.env` file:**
```env
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
PORT=3001
NODE_ENV=development
```

### 4. Smart Contracts Setup
```bash
cd contracts
npm install --save-dev hardhat@^2.22.0
npm install --save-dev @nomicfoundation/hardhat-toolbox@^5.0.0
npm install --save-dev typescript@^5.0.0 ts-node@^10.9.0 @types/node@^20.0.0
npm install --save-dev ethers@^6.0.0
npm install @openzeppelin/contracts@^5.0.0
npm install --save-dev dotenv@^16.0.0
npm install
npx hardhat compile
```

**Create `.env` file:**
```env
OPERATOR_ID=your-account-id
OPERATOR_KEY=your-private-key
RPC_URL=your-testnet-url
FROM=your-from-contract-address
TO=your-to-contract-address
TOKEN_ID=1
CONTRACT=deployed-contract-address
```

## Running the Application

### Development Mode

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Access at **http://localhost:5173**



## Smart Contract Deployment

### ***Local Development:***
```bash
cd contracts
npx hardhat run scripts/deploy.js
npx hardhat run scripts/mint.js
npx hardhat run scripts/transfer-nft.js
npx hardhat run scripts/mint-to-user.js
```

### ***Testnet Deployment:***
```bash
npx hardhat run scripts/deploy.js --network testnet
npx hardhat run scripts/mint.js --network testnet
npx hardhat run scripts/transfer-nft.js --network testnet
npx hardhat run scripts/mint-to-user.js --network testnet
```

## Environment Variables

### Backend (.env)
```env
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
PORT=3001
NODE_ENV=development
```

### Contracts (.env)
```env
OPERATOR_ID=your-account-id
OPERATOR_KEY=your-private-key
RPC_URL=your-testnet-url
FROM=your-from-contract-address
TO=your-to-contract-address
TOKEN_ID=1
CONTRACT=deployed-contract-address
```

## Assumptions & Design Decisions

* **Monorepo structure** for easier development
* **TypeScript** used throughout for type safety
* **ethers.js v6** for modern async/await syntax
* **Vite** chosen for faster development builds
* **MetaMask** as primary wallet provider
* **OpenZeppelin contracts** for security standards

## Known Issues & Limitations

* **Transaction history** limited to last 10 transactions
* **Network support** currently Ethereum mainnet only
* **Wallet compatibility** primarily tested with MetaMask
* **RPC rate limits** with free tier accounts
* **Gas fees** can be high during network congestion

### **Security Notes:**
* Never commit private keys to version control
* Keep API keys secure and rotate regularly
* This is a demonstration project - not production ready

## Testing

```bash
# Frontend
cd frontend && npm run dev

# Backend  
cd backend && npm run dev

# Smart Contracts
cd contracts && npx hardhat test
```

## Demo Configuration

**For Static Transaction History:**
Uncomment all ***this.loadStaticTransactions()*** calls

**For Dynamic Transaction History:**
Uncomment all ***this.loadDynamicTransactions()*** calls