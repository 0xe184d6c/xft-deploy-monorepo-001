import express, { Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import apiRoutes from './routes';

// Create a router instead of an app
const router = Router();

// Root endpoint showing API info
router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'USDX Token API',
    version: '1.0.0',
    description: 'API for interacting with the USDX token smart contract',
    documentation: '/docs/api-reference.html',
    endpoints: {
      health: '/api/health',
      token: '/api/token',
      account: '/api/account/:address',
      transfer: '/api/transfer',
      mint: '/api/mint',
      burn: '/api/burn',
      pause: '/api/pause',
      unpause: '/api/unpause',
      block: '/api/block',
      unblock: '/api/unblock',
      rewardMultiplier: '/api/reward-multiplier',
      grantRole: '/api/grant-role',
      revokeRole: '/api/revoke-role',
      hasRole: '/api/has-role/:account/:role',
      transaction: '/api/transaction/:txHash'
    }
  });
});

// Use the routes from routes.ts
router.use('/', apiRoutes);

// Set up error handling middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
};

export { router, errorHandler };