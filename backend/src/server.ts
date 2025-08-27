import express, {Request, Response, NextFunction, application } from 'express';
import { ethers } from 'ethers';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

interface GasPriceData {
  gasPrice: string | null;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
}

interface AccountDetails {
  address: string;
  balanceWei: string;
  balanceEth: string;
}

interface EthereumResponse {
  timestamp: string;
  gasPrice: GasPriceData;
  currentBlockNumber: number;
  account: AccountDetails;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const provider = new ethers.JsonRpcProvider(
  process.env.ETHEREUM_RPC_URL
);

class EthereumService {
  static validateAddress(address: string): boolean {
    return !!address && ethers.isAddress(address);
  }

  static async getGasPrice() {
    const feeData = await provider.getFeeData();
    return {
      gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0',
      maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : '0',
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : '0'
    };
  }

  static async getCurrentBlockNumber(): Promise<number> {
    try {
      return await provider.getBlockNumber();
    } catch (error) {
      throw new Error(`Failed to get block number: ${(error as Error).message}`);
    }
  }

  static async getAccountBalance(address: string): Promise<AccountDetails> {
    try {
      const balance = await provider.getBalance(address);

      return {
        address: address.toLowerCase(),
        balanceWei: balance.toString(),
        balanceEth: ethers.formatEther(balance)
      };
    } catch (error) {
      throw new Error(`Failed to get account balance: ${(error as Error).message}`);
    }
  }

  static async getAccountData(address: string): Promise<EthereumResponse> {
    const [gasPrice, blockNumber, accountBalance] = await Promise.all([
      this.getGasPrice(),
      this.getCurrentBlockNumber(),
      this.getAccountBalance(address)
    ]);

    return {
      timestamp: new Date().toISOString(),
      gasPrice,
      currentBlockNumber: blockNumber,
      account: accountBalance
    };
  }
}

app.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; timestamp: string }> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  };
  res.json(response);
});

app.get('/api/eth/account/:address', async(req: Request, res: Response) => {
   try {
    const { address } = req.params;

     if(!address || !EthereumService.validateAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Ethereum Address',
          code: 'INVALID_ADDRESS'
        });
     }

     const ethereumData = await EthereumService.getAccountData(address);
     res.json({
        success: true,
        data: ethereumData
     });
   } catch (error) {
      console.log('API ERROR: ', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Ethereum data',
        code: 'ETHEREUM_ERROR'
      });
   }
});

app.use((err: Error, req: Request, res:Response, next: NextFunction) => {
    console.error('Server Error', err);

    const errorResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL ERROR'
    };

    res.status(500).json(errorResponse);
});

app.use('*', (req: Request, res: Response) => {
   const errorResponse: ApiResponse<never> = {
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
   };
   res.status(404).json(errorResponse);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api/eth/account/:address`);
});

export default app;
