// src/server.ts - Highly optimized backend using existing dependencies only
import express, { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const CONFIG = {
  CACHE_TTL: {
    GAS_PRICE: 10_000,        
    ACCOUNT_DATA: 30_000,     
    BLOCK_NUMBER: 5_000,     
  },
  MAX_CACHE_SIZE: 1000,
  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
  IS_DEV: process.env.NODE_ENV === 'development',
} as const;

interface GasPriceData {
  readonly gasPrice: string | null;
  readonly maxFeePerGas: string | null;
  readonly maxPriorityFeePerGas: string | null;
}

interface AccountBalance {
  readonly address: string;
  readonly balanceWei: string;
  readonly balanceEth: string;
  readonly blockNumber: number;
}

interface CachedItem<T> {
  readonly data: T;
  readonly expiresAt: number;
}

interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly code?: string;
  readonly responseTime?: number;
}

interface AccountHistoryData {
  readonly address: string;
  readonly balance: string;
  readonly lastUpdated: string;
  readonly blockNumber: number;
  readonly accessCount: number;
}

class SmartCache<T> {
  private cache = new Map<string, CachedItem<T>>();
  
  set(key: string, data: T, ttlMs: number): void {
    if (this.cache.size >= CONFIG.MAX_CACHE_SIZE) {
      const first = this.cache.keys().next();
      if (!first.done) this.cache.delete(first.value);
    }
    
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

const gasCache = new SmartCache<GasPriceData>();
const accountCache = new SmartCache<AccountBalance>();
const blockCache = new SmartCache<number>();
const historyStore = new Map<string, AccountHistoryData>();

app.use(cors({
  origin: CONFIG.IS_DEV ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : true,
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).startTime = Date.now();
  if (CONFIG.IS_DEV) console.log(`📝 ${req.method} ${req.path}`);
  next();
});

const provider = new ethers.JsonRpcProvider(CONFIG.ETHEREUM_RPC_URL, undefined, {
  staticNetwork: true, // Skip network detection for speed
});

class APIError extends Error {
  constructor(
    message: string, 
    public code: string, 
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class EthereumService {
  private static validateAddress(address: string): string {
    if (!address?.trim()) {
      throw new APIError('Ethereum address is required', 'MISSING_ADDRESS', 400);
    }
    
    const cleanAddress = address.trim().toLowerCase();
    if (!ethers.isAddress(cleanAddress)) {
      throw new APIError('Invalid Ethereum address format', 'INVALID_ADDRESS', 400);
    }
    
    return cleanAddress;
  }

  static async getGasPrice(): Promise<GasPriceData> {
    const cached = gasCache.get('current');
    if (cached) {
      if (CONFIG.IS_DEV) console.log('📦 Gas price from cache');
      return cached;
    }

    if (CONFIG.IS_DEV) console.log('🔗 Fetching fresh gas price');
    
    try {
      const feeData = await provider.getFeeData();
      
      const result: GasPriceData = {
        gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
        maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : null
      };
      
      gasCache.set('current', result, CONFIG.CACHE_TTL.GAS_PRICE);
      return result;
    } catch (error) {
      throw new APIError(`Gas price fetch failed: ${(error as Error).message}`, 'GAS_PRICE_ERROR');
    }
  }

  static async getCurrentBlockNumber(): Promise<number> {
    const cached = blockCache.get('current');
    if (cached) return cached;

    try {
      const blockNumber = await provider.getBlockNumber();
      blockCache.set('current', blockNumber, CONFIG.CACHE_TTL.BLOCK_NUMBER);
      return blockNumber;
    } catch (error) {
      throw new APIError(`Block number fetch failed: ${(error as Error).message}`, 'BLOCK_NUMBER_ERROR');
    }
  }

  static async getAccountBalance(address: string): Promise<AccountBalance> {
    const validAddress = this.validateAddress(address);
    
    const cached = accountCache.get(validAddress);
    if (cached) {
      if (CONFIG.IS_DEV) console.log('📦 Account balance from cache');
      return cached;
    }

    if (CONFIG.IS_DEV) console.log('🔗 Fetching fresh balance for', validAddress);
    
    try {
      const [balance, currentBlock] = await Promise.all([
        provider.getBalance(validAddress),
        this.getCurrentBlockNumber()
      ]);
      
      const result: AccountBalance = {
        address: validAddress,
        balanceWei: balance.toString(),
        balanceEth: ethers.formatEther(balance),
        blockNumber: currentBlock
      };
      
      accountCache.set(validAddress, result, CONFIG.CACHE_TTL.ACCOUNT_DATA);
      return result;
    } catch (error) {
      throw new APIError(`Account balance fetch failed: ${(error as Error).message}`, 'BALANCE_ERROR');
    }
  }

  static async getFullAccountDetails(address: string) {
    const validAddress = this.validateAddress(address);
    
    const [gasPrice, balanceData] = await Promise.all([
      this.getGasPrice(),
      this.getAccountBalance(validAddress)
    ]);

    const result = {
      timestamp: new Date().toISOString(),
      gasPrice,
      currentBlockNumber: balanceData.blockNumber,
      account: {
        address: balanceData.address,
        balance: {
          wei: balanceData.balanceWei,
          eth: balanceData.balanceEth
        }
      }
    };

    const existing = historyStore.get(validAddress);
    historyStore.set(validAddress, {
      address: validAddress,
      balance: balanceData.balanceWei,
      lastUpdated: new Date().toISOString(),
      blockNumber: balanceData.blockNumber,
      accessCount: (existing?.accessCount || 0) + 1
    });

    return result;
  }
}

const sendSuccess = <T>(res: Response, data: T, statusCode = 200): void => {
  const responseTime = Date.now() - (res.req as any).startTime;
  
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(CONFIG.IS_DEV && { responseTime })
  };
  
  res.status(statusCode).json(response);
};

const sendError = (res: Response, error: Error | APIError): void => {
  const responseTime = Date.now() - (res.req as any).startTime;
  
  const isAPIError = error instanceof APIError;
  const statusCode = isAPIError ? error.statusCode : 500;
  const code = isAPIError ? error.code : 'INTERNAL_ERROR';
  
  const response: ApiResponse<never> = {
    success: false,
    error: error.message,
    code,
    ...(CONFIG.IS_DEV && { responseTime })
  };
  
  res.status(statusCode).json(response);
  
  if (!isAPIError) console.error('Unexpected error:', error);
};

// cache cleanup every 2 minutes
setInterval(() => {
  gasCache.cleanup();
  accountCache.cleanup();
  blockCache.cleanup();
  if (CONFIG.IS_DEV) console.log('🧹 Cache cleanup completed');
}, 2 * 60 * 1000);


// health check
app.get('/health', (req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    cache: {
      gasPrice: gasCache.size(),
      accounts: accountCache.size(),
      blockNumber: blockCache.size(),
      history: historyStore.size
    },
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  });
});

// Main endpoint
app.get('/api/ethereum/account/:address', async (req: Request, res: Response) => {
  try {
    const accountDetails = await EthereumService.getFullAccountDetails(req.params.address);
    sendSuccess(res, accountDetails);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Gas price endpoint
app.get('/api/ethereum/gas-price', async (req: Request, res: Response) => {
  try {
    const gasPrice = await EthereumService.getGasPrice();
    sendSuccess(res, {
      timestamp: new Date().toISOString(),
      gasPrice
    });
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Block number endpoint
app.get('/api/ethereum/block-number', async (req: Request, res: Response) => {
  try {
    const blockNumber = await EthereumService.getCurrentBlockNumber();
    sendSuccess(res, {
      blockNumber,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Account history
app.get('/api/ethereum/account/:address/history', (req: Request, res: Response) => {
  try {
    const address = req.params.address?.trim()?.toLowerCase();
    
    if (!address || !ethers.isAddress(address)) {
      throw new APIError('Invalid Ethereum address format', 'INVALID_ADDRESS', 400);
    }

    const historyData = historyStore.get(address);
    if (!historyData) {
      throw new APIError('No historical data found. Call the main endpoint first.', 'NOT_FOUND', 404);
    }

    sendSuccess(res, {
      address: historyData.address,
      balance: {
        wei: historyData.balance,
        eth: ethers.formatEther(historyData.balance)
      },
      lastUpdated: historyData.lastUpdated,
      blockNumber: historyData.blockNumber,
      accessCount: historyData.accessCount
    });

  } catch (error) {
    sendError(res, error as Error);
  }
});

// All accounts
app.get('/api/ethereum/accounts', (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const offset = (page - 1) * limit;

  // Sort by access count (most popular first) then slice for pagination
  const allAccounts = Array.from(historyStore.values())
    .sort((a, b) => b.accessCount - a.accessCount)
    .slice(offset, offset + limit)
    .map(account => ({
      address: account.address,
      balance: {
        wei: account.balance,
        eth: ethers.formatEther(account.balance)
      },
      lastUpdated: account.lastUpdated,
      blockNumber: account.blockNumber,
      accessCount: account.accessCount
    }));

  sendSuccess(res, {
    accounts: allAccounts,
    pagination: {
      page,
      limit,
      total: historyStore.size,
      totalPages: Math.ceil(historyStore.size / limit),
      hasNext: offset + limit < historyStore.size,
      hasPrev: page > 1
    }
  });
});

// API documentation
app.get('/api/docs', (req: Request, res: Response) => {
  sendSuccess(res, {
    title: 'Optimized Ethereum API',
    version: '1.0.0',
    description: 'High-performance TypeScript API for Ethereum blockchain data',
    endpoints: {
      'GET /health': 'System health and statistics',
      'GET /api/ethereum/account/:address': 'Complete account details with gas price and block info',
      'GET /api/ethereum/gas-price': 'Current gas prices (cached for 10s)',
      'GET /api/ethereum/block-number': 'Current block number (cached for 5s)',
      'GET /api/ethereum/account/:address/history': 'Account history from memory',
      'GET /api/ethereum/accounts?page=1&limit=10': 'All queried accounts (paginated)',
      'GET /api/docs': 'This API documentation'
    },
    optimizations: [
      'Smart caching with automatic cleanup',
      'Parallel blockchain API calls',
      'LRU cache with size limits',
      'Response time tracking',
      'Memory usage monitoring',
      'Access count tracking',
      'Automatic expired data cleanup'
    ]
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  sendError(res, err);
});

app.use('*', (req: Request, res: Response) => {
  sendError(res, new APIError('Endpoint not found', 'NOT_FOUND', 404));
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  gasCache.clear();
  accountCache.clear();
  blockCache.clear();
  historyStore.clear();
  console.log('✅ Cleanup completed');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Ethereum API running on port ${PORT}`);
  console.log(`📝 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Main: http://localhost:${PORT}/api/ethereum/account/:address`);
  console.log(`📊 Gas: http://localhost:${PORT}/api/ethereum/gas-price`);
  console.log(`📚 History: http://localhost:${PORT}/api/ethereum/account/:address/history`);
  console.log(`📖 Docs: http://localhost:${PORT}/api/docs`);
  console.log(`⚡ Features: Smart caching, parallel calls, response timing`);
  console.log(`🔧 Mode: ${CONFIG.IS_DEV ? 'Development' : 'Production'}`);
});

export default app;