import { Router, Request, Response } from 'express';
import * as contractService from './contract';

const router = Router();

// Basic health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthcheck = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now()
    };
    res.status(200).json(healthcheck);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed health check with component status
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    // Check token info as a proxy for contract connectivity
    let contractStatus = 'error';
    let contractName = '';
    let blockchainStatus = 'error';
    let blockNumber = 0;
    
    try {
      // Use getTokenInfo to check contract connectivity
      const tokenInfo = await contractService.getTokenInfo();
      if (tokenInfo) {
        contractStatus = 'ok';
        contractName = tokenInfo.name || '';
        blockchainStatus = 'ok';
        
        // Try to get a transaction to check blockchain connectivity
        try {
          // This is a workaround since we don't have direct access to provider
          const tx = await contractService.getTransaction('0x0000000000000000000000000000000000000000000000000000000000000000');
          if (tx && tx.blockNumber) {
            blockNumber = tx.blockNumber;
          }
        } catch (err) {
          // If we can't get a transaction, just continue
          console.log('Health check could not retrieve block number:', err);
        }
      }
    } catch (err) {
      contractStatus = 'error';
      blockchainStatus = 'error';
      console.log('Health check failed to connect to blockchain:', err);
    }

    // Memory usage
    const memoryUsage = process.memoryUsage();

    const healthcheck = {
      status: blockchainStatus === 'ok' && contractStatus === 'ok' ? 'ok' : 'degraded',
      uptime: process.uptime(),
      timestamp: Date.now(),
      components: {
        blockchain: {
          status: blockchainStatus,
          blockNumber
        },
        contract: {
          status: contractStatus,
          name: contractName
        },
        server: {
          status: 'ok'
        }
      },
      system: {
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
        }
      }
    };

    res.status(200).json(healthcheck);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;