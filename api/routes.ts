import express, { Router, Request, Response } from 'express';
import * as contractService from './contract';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get token information
router.get('/token', async (req: Request, res: Response) => {
  try {
    const tokenInfo = await contractService.getTokenInfo();
    res.json(tokenInfo);
  } catch (error: any) {
    console.error('Error fetching token info:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch token info' });
  }
});

// Get account information
router.get('/account/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    
    const accountInfo = await contractService.getAccountInfo(address);
    res.json(accountInfo);
  } catch (error: any) {
    console.error('Error fetching account info:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch account info' });
  }
});

// Transfer tokens
router.post('/transfer', async (req: Request, res: Response) => {
  try {
    const { to, amount } = req.body;
    
    if (!to || !to.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const result = await contractService.transferTokens(to, amount);
    res.json(result);
  } catch (error: any) {
    console.error('Error transferring tokens:', error);
    res.status(500).json({ error: error.message || 'Failed to transfer tokens' });
  }
});

// Mint tokens
router.post('/mint', async (req: Request, res: Response) => {
  try {
    const { to, amount } = req.body;
    
    if (!to || !to.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const result = await contractService.mintTokens(to, amount);
    res.json(result);
  } catch (error: any) {
    console.error('Error minting tokens:', error);
    res.status(500).json({ error: error.message || 'Failed to mint tokens' });
  }
});

// Burn tokens
router.post('/burn', async (req: Request, res: Response) => {
  try {
    const { from, amount } = req.body;
    
    if (!from || !from.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const result = await contractService.burnTokens(from, amount);
    res.json(result);
  } catch (error: any) {
    console.error('Error burning tokens:', error);
    res.status(500).json({ error: error.message || 'Failed to burn tokens' });
  }
});

// Pause contract
router.post('/pause', async (req: Request, res: Response) => {
  try {
    const result = await contractService.pauseContract();
    res.json(result);
  } catch (error: any) {
    console.error('Error pausing contract:', error);
    res.status(500).json({ error: error.message || 'Failed to pause contract' });
  }
});

// Unpause contract
router.post('/unpause', async (req: Request, res: Response) => {
  try {
    const result = await contractService.unpauseContract();
    res.json(result);
  } catch (error: any) {
    console.error('Error unpausing contract:', error);
    res.status(500).json({ error: error.message || 'Failed to unpause contract' });
  }
});

// Block account
router.post('/block', async (req: Request, res: Response) => {
  try {
    const { account } = req.body;
    
    if (!account || !account.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    const result = await contractService.blockAccount(account);
    res.json(result);
  } catch (error: any) {
    console.error('Error blocking account:', error);
    res.status(500).json({ error: error.message || 'Failed to block account' });
  }
});

// Unblock account
router.post('/unblock', async (req: Request, res: Response) => {
  try {
    const { account } = req.body;
    
    if (!account || !account.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    const result = await contractService.unblockAccount(account);
    res.json(result);
  } catch (error: any) {
    console.error('Error unblocking account:', error);
    res.status(500).json({ error: error.message || 'Failed to unblock account' });
  }
});

// Update reward multiplier
router.post('/reward-multiplier', async (req: Request, res: Response) => {
  try {
    const { value } = req.body;
    
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      return res.status(400).json({ error: 'Invalid value' });
    }
    
    const result = await contractService.updateRewardMultiplier(value);
    res.json(result);
  } catch (error: any) {
    console.error('Error updating reward multiplier:', error);
    res.status(500).json({ error: error.message || 'Failed to update reward multiplier' });
  }
});

// Grant role
router.post('/grant-role', async (req: Request, res: Response) => {
  try {
    const { account, role } = req.body;
    
    if (!account || !account.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    if (!role || !Object.keys(contractService.ROLES).includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role', 
        validRoles: Object.keys(contractService.ROLES) 
      });
    }
    
    const result = await contractService.grantRole(account, role);
    res.json(result);
  } catch (error: any) {
    console.error('Error granting role:', error);
    res.status(500).json({ error: error.message || 'Failed to grant role' });
  }
});

// Revoke role
router.post('/revoke-role', async (req: Request, res: Response) => {
  try {
    const { account, role } = req.body;
    
    if (!account || !account.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    if (!role || !Object.keys(contractService.ROLES).includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role', 
        validRoles: Object.keys(contractService.ROLES) 
      });
    }
    
    const result = await contractService.revokeRole(account, role);
    res.json(result);
  } catch (error: any) {
    console.error('Error revoking role:', error);
    res.status(500).json({ error: error.message || 'Failed to revoke role' });
  }
});

// Check if account has role
router.get('/has-role/:account/:role', async (req: Request, res: Response) => {
  try {
    const { account, role } = req.params;
    
    if (!account || !account.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    if (!role || !Object.keys(contractService.ROLES).includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role', 
        validRoles: Object.keys(contractService.ROLES) 
      });
    }
    
    const result = await contractService.hasRole(account, role);
    res.json(result);
  } catch (error: any) {
    console.error('Error checking role:', error);
    res.status(500).json({ error: error.message || 'Failed to check role' });
  }
});

// Get transaction details
router.get('/transaction/:txHash', async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;
    
    if (!txHash || !txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return res.status(400).json({ error: 'Invalid transaction hash' });
    }
    
    const result = await contractService.getTransaction(txHash);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transaction' });
  }
});

export default router;