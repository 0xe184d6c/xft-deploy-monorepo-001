import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import { useWallet } from "./wallet";
import { NetworkConfig, Transaction, RoleInfo, BlocklistInfo, TransactionModalState } from "./types";

// ABI for the USDX contract
const USDX_ABI = [
  // View functions
  "function name() external view returns (string memory)",
  "function symbol() external view returns (string memory)",
  "function decimals() external pure returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function totalShares() external view returns (uint256)",
  "function sharesOf(address account) public view returns (uint256)",
  "function convertToShares(uint256 amount) public view returns (uint256)",
  "function convertToTokens(uint256 shares) public view returns (uint256)",
  "function rewardMultiplier() public view returns (uint256)",
  "function paused() external view returns (bool)",
  "function isBlocked(address account) external view returns (bool)",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function getRoleAdmin(bytes32 role) external view returns (bytes32)",
  
  // State-changing functions
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function increaseAllowance(address spender, uint256 addedValue) external returns (bool)",
  "function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool)",
  "function mint(address to, uint256 amount) external",
  "function burn(address from, uint256 amount) external",
  "function pause() external",
  "function unpause() external",
  "function blockAccount(address account) external",
  "function unblockAccount(address account) external",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
  "function setRewardMultiplier(uint256 newRewardMultiplier) external",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
  "event AccountBlocked(address indexed addr)",
  "event AccountUnblocked(address indexed addr)",
  "event RewardMultiplier(uint256 indexed value)",
  "event Paused(address account)",
  "event Unpaused(address account)"
];

// Role definitions
const ROLES = {
  DEFAULT_ADMIN_ROLE: ethers.zeroPadValue("0x00", 32),
  MINTER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")),
  BURNER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE")),
  BLOCKLIST_ROLE: ethers.keccak256(ethers.toUtf8Bytes("BLOCKLIST_ROLE")),
  ORACLE_ROLE: ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE")),
  UPGRADE_ROLE: ethers.keccak256(ethers.toUtf8Bytes("UPGRADE_ROLE")),
  PAUSE_ROLE: ethers.keccak256(ethers.toUtf8Bytes("PAUSE_ROLE"))
};

// Default network configuration
const DEFAULT_CONFIG: NetworkConfig = {
  network: "sepolia",
  chainId: 11155111,
  token: {
    name: "XFT Digital Dollar",
    symbol: "USDX",
    owner: "0x2f572059DbC598C8acfeA4AF06FE4f7669D1b3b1"
  },
  addresses: {
    proxy: "0x421C76cd7C1550c4fcc974F4d74c870150c45995",
    implementation: "0xf6080682dFCa67A25F294343a03C8cd8675cc41E"
  },
  rpcUrl: "",
  userAddress: ""
};

interface ContractContextType {
  contract: ethers.Contract | null;
  networkConfig: NetworkConfig;
  userBalance: string;
  userShares: string;
  totalSupply: string;
  totalShares: string;
  rewardMultiplier: string;
  isPaused: boolean;
  transactionModalState: TransactionModalState;
  loadContractData: () => Promise<void>;
  loadUserBalance: () => Promise<void>;
  loadTotalSupply: () => Promise<void>;
  loadRewardMultiplier: () => Promise<void>;
  loadPauseState: () => Promise<void>;
  transfer: (to: string, amount: number) => Promise<void>;
  mint: (to: string, amount: number) => Promise<void>;
  burn: (from: string, amount: number) => Promise<void>;
  blockAccount: (account: string) => Promise<void>;
  unblockAccount: (account: string) => Promise<void>;
  pauseContract: () => Promise<void>;
  unpauseContract: () => Promise<void>;
  updateRewardMultiplier: (newValue: string) => Promise<void>;
  grantRole: (account: string, role: string) => Promise<void>;
  revokeRole: (account: string, role: string) => Promise<void>;
  hasRole: (account: string, role: string) => Promise<boolean>;
  hasAdminRole: (account?: string) => Promise<boolean>;
  hasMinterRole: (account?: string) => Promise<boolean>;
  hasBurnerRole: (account?: string) => Promise<boolean>;
  hasBlocklistRole: (account?: string) => Promise<boolean>;
  hasOracleRole: (account?: string) => Promise<boolean>;
  hasPauseRole: (account?: string) => Promise<boolean>;
  getTransactionHistory: (limit?: number) => Promise<Transaction[]>;
  getRoleInfo: () => Promise<RoleInfo[]>;
  getBlocklistInfo: () => Promise<BlocklistInfo[]>;
  showTransactionModal: (status: "pending" | "success" | "error", errorMessage?: string) => void;
  hideTransactionModal: () => void;
}

const ContractContext = createContext<ContractContextType>({
  contract: null,
  networkConfig: DEFAULT_CONFIG,
  userBalance: "0.00",
  userShares: "0",
  totalSupply: "0.00",
  totalShares: "0",
  rewardMultiplier: "1000000000000000000", // 1.0 * 10^18
  isPaused: false,
  transactionModalState: {
    isOpen: false,
    status: "pending",
    errorMessage: "",
    transactionHash: ""
  },
  loadContractData: async () => {},
  loadUserBalance: async () => {},
  loadTotalSupply: async () => {},
  loadRewardMultiplier: async () => {},
  loadPauseState: async () => {},
  transfer: async () => {},
  mint: async () => {},
  burn: async () => {},
  blockAccount: async () => {},
  unblockAccount: async () => {},
  pauseContract: async () => {},
  unpauseContract: async () => {},
  updateRewardMultiplier: async () => {},
  grantRole: async () => {},
  revokeRole: async () => {},
  hasRole: async () => false,
  hasAdminRole: async () => false,
  hasMinterRole: async () => false,
  hasBurnerRole: async () => false,
  hasBlocklistRole: async () => false,
  hasOracleRole: async () => false,
  hasPauseRole: async () => false,
  getTransactionHistory: async () => [],
  getRoleInfo: async () => [],
  getBlocklistInfo: async () => [],
  showTransactionModal: () => {},
  hideTransactionModal: () => {}
});

export const useContract = () => useContext(ContractContext);

interface ContractProviderProps {
  children: ReactNode;
}

export const ContractProvider = ({ children }: ContractProviderProps) => {
  const { provider, signer, connected, address } = useWallet();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>(DEFAULT_CONFIG);
  const [userBalance, setUserBalance] = useState<string>("0.00");
  const [userShares, setUserShares] = useState<string>("0");
  const [totalSupply, setTotalSupply] = useState<string>("0.00");
  const [totalShares, setTotalShares] = useState<string>("0");
  const [rewardMultiplier, setRewardMultiplier] = useState<string>("1000000000000000000"); // 1.0 * 10^18
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [transactionModalState, setTransactionModalState] = useState<TransactionModalState>({
    isOpen: false,
    status: "pending",
    errorMessage: "",
    transactionHash: ""
  });

  // Initialize contract when provider and signer are available
  useEffect(() => {
    const initContract = async () => {
      if (!provider || !signer || !connected) {
        setContract(null);
        return;
      }

      try {
        // Get custom RPC URL if set
        const customRpc = localStorage.getItem("usdx-custom-rpc");
        
        // Create contract instance
        const contractInstance = new ethers.Contract(
          DEFAULT_CONFIG.addresses.proxy,
          USDX_ABI,
          signer
        );

        setContract(contractInstance);
        
        // Update network config with user address and RPC URL
        setNetworkConfig(prev => ({
          ...prev,
          userAddress: address,
          rpcUrl: customRpc || ""
        }));
        
        // Load initial data
        await Promise.all([
          loadUserBalanceInternal(contractInstance),
          loadTotalSupplyInternal(contractInstance),
          loadRewardMultiplierInternal(contractInstance),
          loadPauseStateInternal(contractInstance)
        ]);
      } catch (error) {
        console.error("Failed to initialize contract:", error);
        setContract(null);
      }
    };

    initContract();
  }, [provider, signer, connected, address]);

  // Internal function to load user balance
  const loadUserBalanceInternal = async (contractInstance: ethers.Contract) => {
    if (!contractInstance || !address) return;
    
    try {
      const balance = await contractInstance.balanceOf(address);
      const shares = await contractInstance.sharesOf(address);
      
      setUserBalance(ethers.formatUnits(balance, 18));
      setUserShares(shares.toString());
    } catch (error) {
      console.error("Failed to load user balance:", error);
    }
  };

  // Internal function to load total supply
  const loadTotalSupplyInternal = async (contractInstance: ethers.Contract) => {
    if (!contractInstance) return;
    
    try {
      const supply = await contractInstance.totalSupply();
      const shares = await contractInstance.totalShares();
      
      setTotalSupply(ethers.formatUnits(supply, 18));
      setTotalShares(shares.toString());
    } catch (error) {
      console.error("Failed to load total supply:", error);
    }
  };

  // Internal function to load reward multiplier
  const loadRewardMultiplierInternal = async (contractInstance: ethers.Contract) => {
    if (!contractInstance) return;
    
    try {
      const multiplier = await contractInstance.rewardMultiplier();
      setRewardMultiplier(multiplier.toString());
    } catch (error) {
      console.error("Failed to load reward multiplier:", error);
    }
  };

  // Internal function to load pause state
  const loadPauseStateInternal = async (contractInstance: ethers.Contract) => {
    if (!contractInstance) return;
    
    try {
      const paused = await contractInstance.paused();
      setIsPaused(paused);
    } catch (error) {
      console.error("Failed to load pause state:", error);
    }
  };

  // Public function to load all contract data
  const loadContractData = async () => {
    if (!contract) throw new Error("Contract not initialized");
    
    await Promise.all([
      loadUserBalanceInternal(contract),
      loadTotalSupplyInternal(contract),
      loadRewardMultiplierInternal(contract),
      loadPauseStateInternal(contract)
    ]);
  };

  // Public function to load user balance
  const loadUserBalance = async () => {
    if (!contract) throw new Error("Contract not initialized");
    await loadUserBalanceInternal(contract);
  };

  // Public function to load total supply
  const loadTotalSupply = async () => {
    if (!contract) throw new Error("Contract not initialized");
    await loadTotalSupplyInternal(contract);
  };

  // Public function to load reward multiplier
  const loadRewardMultiplier = async () => {
    if (!contract) throw new Error("Contract not initialized");
    await loadRewardMultiplierInternal(contract);
  };

  // Public function to load pause state
  const loadPauseState = async () => {
    if (!contract) throw new Error("Contract not initialized");
    await loadPauseStateInternal(contract);
  };

  // Transfer tokens
  const transfer = async (to: string, amount: number) => {
    if (!contract || !signer) throw new Error("Contract not initialized");
    
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    const tx = await contract.transfer(to, amountWei);
    
    const receipt = await tx.wait();
    await loadUserBalance();
    
    // Add to transaction history
    const newTx: Transaction = {
      hash: tx.hash,
      type: "Transfer",
      from: address,
      to: to,
      amount: amount.toString(),
      blockNumber: receipt.blockNumber,
      timestamp: Date.now(),
      status: "confirmed"
    };
    
    setTransactionHistory(prev => [newTx, ...prev]);
    setTransactionModalState(prev => ({
      ...prev,
      transactionHash: tx.hash
    }));
    
    return receipt;
  };

  // Mint tokens (requires MINTER_ROLE)
  const mint = async (to: string, amount: number) => {
    if (!contract || !signer) throw new Error("Contract not initialized");
    
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    const tx = await contract.mint(to, amountWei);
    
    const receipt = await tx.wait();
    await Promise.all([loadUserBalance(), loadTotalSupply()]);
    
    // Add to transaction history
    const newTx: Transaction = {
      hash: tx.hash,
      type: "Mint",
      from: ethers.ZeroAddress,
      to: to,
      amount: amount.toString(),
      blockNumber: receipt.blockNumber,
      timestamp: Date.now(),
      status: "confirmed"
    };
    
    setTransactionHistory(prev => [newTx, ...prev]);
    setTransactionModalState(prev => ({
      ...prev,
      transactionHash: tx.hash
    }));
    
    return receipt;
  };

  // Burn tokens (requires BURNER_ROLE)
  const burn = async (from: string, amount: number) => {
    if (!contract || !signer) throw new Error("Contract not initialized");
    
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    const tx = await contract.burn(from, amountWei);
    
    const receipt = await tx.wait();
    await Promise.all([loadUserBalance(), loadTotalSupply()]);
    
    // Add to transaction history
    const newTx: Transaction = {
      hash: tx.hash,
      type: "Burn",
      from: from,
      to: ethers.ZeroAddress,
      amount: amount.toString(),
      blockNumber: receipt.blockNumber,
      timestamp: Date.now(),
      status: "confirmed"
    };
    
    setTransactionHistory(prev => [newTx, ...prev]);
    setTransactionModalState(prev => ({
      ...prev,
      transactionHash: tx.hash
    }));
    
    return receipt;
  };

  // Block an account (requires BLOCKLIST_ROLE)
  const blockAccount = async (account: string) => {
    if (!contract || !signer) throw new Error("Contract not initialized");
    
    const tx = await contract.blockAccount(account);
    const receipt = await tx.wait();
    
    setTransactionModalState(prev => ({
      ...prev,
      transactionHash: tx.hash
    }));
    
    return receipt;
  };

  // Unblock an account (requires BLOCKLIST_ROLE)
  const unblockAccount = async (account: string) => {
    if (!contract || !signer) throw new Error("Contract not initialized");
    
    const tx = await contract.unblockAccount(account);
    const receipt = await tx.wait();
    
    setTransactionModalState(prev => ({
      ...prev,
      transactionHash: tx.hash
    }));
    
    return receipt;
  };

  // Pause the contract (requires PAUSE_ROLE)
  const pauseContract = async () => {
    if (!contract || !signer) throw new Error("Contract not initialized");
    
    const tx = await contract.pause();
    const receipt = await tx.wait();
    await loadPauseState();
    
    setTransactionModalState(prev => ({
      ...prev,
      transactionHash: tx.hash
    }));
    
    return receipt;
  };

  // Unpause the contract (requires PAUSE_ROLE)
  const unpauseContract = async () => {
    if (!contract || !signer) throw new Error("Contract not initialized");
    
    const tx = await contract.unpause();
    const receipt = await tx.wait();
    await loadPauseState();
    
    setTransactionModalState(prev => ({
      ...prev,
      transactionHash: tx.hash
    }));
    
    return receipt;
  };

  // Update reward multiplier (requires ORACLE_ROLE)
  const updateRewardMultiplier = async (newValue: string) => {
    if (!contract || !signer) throw new Error("Contract not initialized");
    
    const tx = await contract.setRewardMultiplier(newValue);
    const receipt = await tx.wait();
    await Promise.all([
      loadRewardMultiplier(),
      loadUserBalance(),
      loadTotalSupply()
    ]);
    
    setTransactionModalState(prev => ({
      ...prev,
      transactionHash: tx.hash
    }));
    
    return receipt;
  };

  // Grant a role to an account (requires DEFAULT_ADMIN_ROLE)
  const grantRole = async (account: string, roleName: string) => {
    if (!contract || !signer) throw new Error("Contract not initialized");
    
    const roleHash = ROLES[roleName as keyof typeof ROLES];
    if (!roleHash) throw new Error(`Invalid role: ${roleName}`);
    
    const tx = await contract.grantRole(roleHash, account);
    const receipt = await tx.wait();
    
    setTransactionModalState(prev => ({
      ...prev,
      transactionHash: tx.hash
    }));
    
    return receipt;
  };

  // Revoke a role from an account (requires DEFAULT_ADMIN_ROLE)
  const revokeRole = async (account: string, roleName: string) => {
    if (!contract || !signer) throw new Error("Contract not initialized");
    
    const roleHash = ROLES[roleName as keyof typeof ROLES];
    if (!roleHash) throw new Error(`Invalid role: ${roleName}`);
    
    const tx = await contract.revokeRole(roleHash, account);
    const receipt = await tx.wait();
    
    setTransactionModalState(prev => ({
      ...prev,
      transactionHash: tx.hash
    }));
    
    return receipt;
  };

  // Check if an account has a specific role
  const hasRole = async (account: string, roleName: string) => {
    if (!contract) throw new Error("Contract not initialized");
    
    const roleHash = ROLES[roleName as keyof typeof ROLES];
    if (!roleHash) throw new Error(`Invalid role: ${roleName}`);
    
    return await contract.hasRole(roleHash, account);
  };

  // Check if the current user has admin role
  const hasAdminRole = async (account?: string) => {
    if (!contract) throw new Error("Contract not initialized");
    return await contract.hasRole(ROLES.DEFAULT_ADMIN_ROLE, account || address);
  };

  // Check if the current user has minter role
  const hasMinterRole = async (account?: string) => {
    if (!contract) throw new Error("Contract not initialized");
    return await contract.hasRole(ROLES.MINTER_ROLE, account || address);
  };

  // Check if the current user has burner role
  const hasBurnerRole = async (account?: string) => {
    if (!contract) throw new Error("Contract not initialized");
    return await contract.hasRole(ROLES.BURNER_ROLE, account || address);
  };

  // Check if the current user has blocklist role
  const hasBlocklistRole = async (account?: string) => {
    if (!contract) throw new Error("Contract not initialized");
    return await contract.hasRole(ROLES.BLOCKLIST_ROLE, account || address);
  };

  // Check if the current user has oracle role
  const hasOracleRole = async (account?: string) => {
    if (!contract) throw new Error("Contract not initialized");
    return await contract.hasRole(ROLES.ORACLE_ROLE, account || address);
  };

  // Check if the current user has pause role
  const hasPauseRole = async (account?: string) => {
    if (!contract) throw new Error("Contract not initialized");
    return await contract.hasRole(ROLES.PAUSE_ROLE, account || address);
  };

  // Get transaction history (mock implementation, would normally use contract events)
  const getTransactionHistory = async (limit: number = 50): Promise<Transaction[]> => {
    if (!contract || !provider) {
      return [];
    }

    try {
      // Get the latest block number
      const latestBlock = await provider.getBlockNumber();
      
      // Define a starting block (e.g., last 10000 blocks or about ~1 day of blocks)
      const fromBlock = Math.max(0, latestBlock - 10000);
      
      // Create filter for Transfer events
      const transferFilter = contract.filters.Transfer();
      
      // Query transfer events
      const transferEvents = await contract.queryFilter(transferFilter, fromBlock, latestBlock);
      
      // Process events into transactions
      const transactions: Transaction[] = [];
      
      for (const event of transferEvents) {
        // Skip failed transactions
        if (!event.blockNumber) continue;
        
        // We need to cast the event to get typed access to args
        const typedEvent = event as unknown as {
          args: {
            from: string;
            to: string;
            value: bigint;
          };
          blockNumber: number;
          transactionHash: string;
        };
        
        if (!typedEvent.args) continue;
        
        // Get transaction type
        let type: 'Transfer' | 'Mint' | 'Burn' | 'Unknown' = 'Transfer';
        if (typedEvent.args.from === ethers.ZeroAddress) {
          type = 'Mint';
        } else if (typedEvent.args.to === ethers.ZeroAddress) {
          type = 'Burn';
        }
        
        // Get block for timestamp
        const block = await provider.getBlock(typedEvent.blockNumber);
        
        if (!block) continue;
        
        // Format amount
        const amount = ethers.formatUnits(typedEvent.args.value, 18);
        
        // Add transaction to list
        transactions.push({
          hash: typedEvent.transactionHash,
          type,
          from: typedEvent.args.from,
          to: typedEvent.args.to,
          amount,
          blockNumber: typedEvent.blockNumber,
          timestamp: block.timestamp * 1000, // Convert to milliseconds
          status: 'confirmed'
        });
      }
      
      // Add any pending transactions from local state that might not be confirmed yet
      const pendingTransactions = transactionHistory.filter(tx => tx.status === 'pending');
      
      // Combine and sort by timestamp (newest first)
      const allTransactions = [...pendingTransactions, ...transactions]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      
      return allTransactions;
    } catch (error) {
      console.error("Failed to get transaction history:", error);
      // Fall back to local transaction history on error
      return transactionHistory.slice(0, limit);
    }
  };

  // Get role assignments
  const getRoleInfo = async (): Promise<RoleInfo[]> => {
    if (!contract || !provider) {
      return [];
    }

    try {
      // Query role granted and revoked events from the chain
      const roleInfoList: RoleInfo[] = [];
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 10000); // Get about ~1 day of events
      
      // Known addresses to check for roles (add the owner and current user)
      const addressesToCheck = new Set<string>();
      const owner = networkConfig.token.owner;
      addressesToCheck.add(owner);
      
      if (address) {
        addressesToCheck.add(address);
      }
      
      // Get all RoleGranted events to find all role holders
      const roleGrantedFilter = contract.filters.RoleGranted();
      const roleGrantedEvents = await contract.queryFilter(roleGrantedFilter, fromBlock, latestBlock);
      
      // Track addresses with roles
      for (const event of roleGrantedEvents) {
        // Cast to get typed access to args
        const typedEvent = event as unknown as {
          args: {
            role: string;
            account: string;
            sender: string;
          };
        };
        
        if (typedEvent.args && typedEvent.args.account) {
          addressesToCheck.add(typedEvent.args.account);
        }
      }
      
      // Get RoleRevoked events to know which roles were revoked
      const roleRevokedFilter = contract.filters.RoleRevoked();
      const roleRevokedEvents = await contract.queryFilter(roleRevokedFilter, fromBlock, latestBlock);
      
      // Check all roles for all addresses in our set
      for (const addr of Array.from(addressesToCheck)) {
        for (const [roleName, roleHash] of Object.entries(ROLES)) {
          // Query current role status from contract
          const granted = await contract.hasRole(roleHash, addr);
          
          roleInfoList.push({
            roleName,
            roleHash,
            address: addr,
            granted
          });
        }
      }
      
      // Sort by role name and then by address
      return roleInfoList.sort((a, b) => {
        if (a.roleName !== b.roleName) {
          return a.roleName.localeCompare(b.roleName);
        }
        return a.address.toLowerCase().localeCompare(b.address.toLowerCase());
      });
    } catch (error) {
      console.error("Failed to get role info:", error);
      
      // Fallback: check roles for owner and current user
      const roleInfoList: RoleInfo[] = [];
      const owner = networkConfig.token.owner;
      
      try {
        // Check roles for owner
        for (const [roleName, roleHash] of Object.entries(ROLES)) {
          const granted = await contract.hasRole(roleHash, owner);
          roleInfoList.push({
            roleName,
            roleHash,
            address: owner,
            granted
          });
        }
        
        // Check roles for current user if different from owner
        if (address && address.toLowerCase() !== owner.toLowerCase()) {
          for (const [roleName, roleHash] of Object.entries(ROLES)) {
            const granted = await contract.hasRole(roleHash, address);
            roleInfoList.push({
              roleName,
              roleHash,
              address,
              granted
            });
          }
        }
        
        return roleInfoList;
      } catch (fallbackError) {
        console.error("Fallback role check failed:", fallbackError);
        return [];
      }
    }
  };

  // Get blocklist info
  const getBlocklistInfo = async (): Promise<BlocklistInfo[]> => {
    if (!contract || !provider) {
      return [];
    }

    try {
      // Get blocklist events from the contract
      const blocklistInfo: BlocklistInfo[] = [];
      const addressesMap = new Map<string, boolean>(); // Map address to blocked status
      
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 10000); // ~1 day of blocks
      
      // Get blocked events
      const blockedFilter = contract.filters.AccountBlocked();
      const blockedEvents = await contract.queryFilter(blockedFilter, fromBlock, latestBlock);
      
      // Get unblocked events
      const unblockedFilter = contract.filters.AccountUnblocked();
      const unblockedEvents = await contract.queryFilter(unblockedFilter, fromBlock, latestBlock);
      
      // Add addresses from events to our tracking map
      for (const event of blockedEvents) {
        if (event.args && event.args.addr) {
          addressesMap.set(event.args.addr, true);
        }
      }
      
      for (const event of unblockedEvents) {
        if (event.args && event.args.addr) {
          addressesMap.set(event.args.addr, false);
        }
      }
      
      // Add owner and current user to check 
      const knownAddresses = [
        networkConfig.token.owner,
        address
      ].filter(Boolean) as string[];
      
      for (const addr of knownAddresses) {
        if (!addressesMap.has(addr)) {
          // Only query the contract if we don't have this address from events
          try {
            const isBlocked = await contract.isBlocked(addr);
            addressesMap.set(addr, isBlocked);
          } catch (error) {
            console.error(`Failed to check if ${addr} is blocked:`, error);
          }
        }
      }
      
      // Convert map to array of BlocklistInfo objects
      for (const [addr, isBlocked] of addressesMap.entries()) {
        blocklistInfo.push({
          address: addr,
          isBlocked
        });
      }
      
      // Sort by blocked status (blocked first) then by address
      return blocklistInfo.sort((a, b) => {
        if (a.isBlocked !== b.isBlocked) {
          return a.isBlocked ? -1 : 1;
        }
        return a.address.toLowerCase().localeCompare(b.address.toLowerCase());
      });
    } catch (error) {
      console.error("Failed to get blocklist info:", error);
      
      // Fallback: check blocklist status for owner and current user
      const blocklistInfo: BlocklistInfo[] = [];
      const addressesToCheck = [
        networkConfig.token.owner,
        address
      ].filter(Boolean) as string[];
      
      try {
        for (const addr of addressesToCheck) {
          const isBlocked = await contract.isBlocked(addr);
          blocklistInfo.push({
            address: addr,
            isBlocked
          });
        }
        return blocklistInfo;
      } catch (fallbackError) {
        console.error("Fallback blocklist check failed:", fallbackError);
        return [];
      }
    }
  };

  // Show transaction modal
  const showTransactionModal = (status: "pending" | "success" | "error", errorMessage?: string) => {
    setTransactionModalState({
      isOpen: true,
      status,
      errorMessage: errorMessage || "",
      transactionHash: transactionModalState.transactionHash // Preserve existing hash
    });
  };

  // Hide transaction modal
  const hideTransactionModal = () => {
    setTransactionModalState({
      isOpen: false,
      status: "pending",
      errorMessage: "",
      transactionHash: ""
    });
  };

  const value = {
    contract,
    networkConfig,
    userBalance,
    userShares,
    totalSupply,
    totalShares,
    rewardMultiplier,
    isPaused,
    transactionModalState,
    loadContractData,
    loadUserBalance,
    loadTotalSupply,
    loadRewardMultiplier,
    loadPauseState,
    transfer,
    mint,
    burn,
    blockAccount,
    unblockAccount,
    pauseContract,
    unpauseContract,
    updateRewardMultiplier,
    grantRole,
    revokeRole,
    hasRole,
    hasAdminRole,
    hasMinterRole,
    hasBurnerRole,
    hasBlocklistRole,
    hasOracleRole,
    hasPauseRole,
    getTransactionHistory,
    getRoleInfo,
    getBlocklistInfo,
    showTransactionModal,
    hideTransactionModal
  };

  return React.createElement(
    ContractContext.Provider,
    { value },
    children
  );
};

// Wrap App component with ContractProvider
export function withContract<P extends object>(Component: React.ComponentType<P>) {
  return function WithContractComponent(props: P) {
    return React.createElement(
      ContractProvider,
      null,
      React.createElement(Component, props)
    );
  };
}
