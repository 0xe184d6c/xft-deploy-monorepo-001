// Network configuration
export interface NetworkConfig {
  network: string;
  chainId: number;
  token: {
    name: string;
    symbol: string;
    owner: string;
  };
  addresses: {
    proxy: string;
    implementation: string;
  };
  rpcUrl?: string;
  userAddress?: string;
}

// Transaction details
export interface Transaction {
  hash: string;
  type: 'Transfer' | 'Mint' | 'Burn' | 'Approval' | 'Unknown';
  from: string;
  to: string;
  amount: string;
  blockNumber?: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

// Contract Event from blockchain
export interface ContractEvent {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  logIndex: number;
  address: string;
  timestamp: number;
  name: string;
  signature: string;
  topic: string;
  args: Record<string, any>;
  data: string;
  status: string;
  gasUsed: string;
}

// Role information
export interface RoleInfo {
  roleName: string;
  roleHash: string;
  address: string;
  granted: boolean;
}

// Blocklist information
export interface BlocklistInfo {
  address: string;
  isBlocked: boolean;
}

// Transaction modal state
export interface TransactionModalState {
  isOpen: boolean;
  status: 'pending' | 'success' | 'error';
  errorMessage: string;
  transactionHash: string;
}

// Form types
export interface TransferFormData {
  recipient: string;
  amount: string;
}

export interface MintFormData {
  recipient: string;
  amount: string;
}

export interface BurnFormData {
  from: string;
  amount: string;
}

export interface BlocklistFormData {
  account: string;
  action: 'block' | 'unblock';
}

export interface RoleFormData {
  account: string;
  role: string;
  action: 'grant' | 'revoke';
}

export interface RewardMultiplierFormData {
  value: string;
}
