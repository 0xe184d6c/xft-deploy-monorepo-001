import { ethers } from "ethers";

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
  "function addRewardMultiplier(uint256 rewardMultiplierIncrement) external",
  
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
export const ROLES = {
  DEFAULT_ADMIN_ROLE: ethers.zeroPadValue("0x00", 32),
  MINTER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")),
  BURNER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE")),
  BLOCKLIST_ROLE: ethers.keccak256(ethers.toUtf8Bytes("BLOCKLIST_ROLE")),
  ORACLE_ROLE: ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE")),
  UPGRADE_ROLE: ethers.keccak256(ethers.toUtf8Bytes("UPGRADE_ROLE")),
  PAUSE_ROLE: ethers.keccak256(ethers.toUtf8Bytes("PAUSE_ROLE"))
};

// Network configuration
export const NETWORK_CONFIG = {
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
  }
};

// Create provider and contract instance
let provider: ethers.JsonRpcProvider | null = null;
let contract: ethers.Contract | null = null;
let wallet: ethers.Wallet | null = null;
let isInitializing = false;
let initializationPromise: Promise<ethers.Contract | null> | null = null;

export async function initializeContract() {
  // If initialization is already in progress, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Set the initialization flag
  isInitializing = true;
  
  // Create a new initialization promise
  initializationPromise = (async () => {
    try {
      // Check if required environment variables are available
      const privateKey = process.env.PRIVATE_KEY;
      const alchemyApiKey = process.env.ALCHEMY_API_KEY;
      
      if (!privateKey) {
        console.error("PRIVATE_KEY environment variable is not set");
        return null;
      }
      
      if (!alchemyApiKey) {
        console.error("ALCHEMY_API_KEY environment variable is not set");
        return null;
      }
      
      // Construct Alchemy RPC URL
      const rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
      
      try {
        console.log(`Attempting to connect to Alchemy Sepolia RPC...`);
        
        // Initialize provider
        provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Wait for provider to be ready
        await provider.ready;
        
        // Initialize wallet with private key
        wallet = new ethers.Wallet(privateKey, provider);
        
        // Create contract instance
        contract = new ethers.Contract(
          NETWORK_CONFIG.addresses.proxy,
          USDX_ABI,
          wallet
        );
        
        // Test the connection
        const tokenName = await contract.name();
        console.log(`Successfully connected to ${tokenName} contract on Sepolia`);
        
        // If we get here, the connection is working
        return contract;
      } catch (error) {
        console.error(`Failed to connect to Alchemy Sepolia RPC:`, error);
        
        // Reset state
        provider = null;
        contract = null;
        wallet = null;
        return null;
      }
    } catch (error) {
      console.error("Failed to initialize contract:", error);
      return null;
    } finally {
      isInitializing = false;
    }
  })();
  
  return initializationPromise;
}

export async function getTokenInfo() {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();
    const totalShares = await contract.totalShares();
    const rewardMultiplier = await contract.rewardMultiplier();
    const isPaused = await contract.paused();
    
    return {
      name,
      symbol,
      decimals: decimals.toString(),
      totalSupply: totalSupply.toString(),
      totalShares: totalShares.toString(),
      rewardMultiplier: rewardMultiplier.toString(),
      isPaused
    };
  } catch (error) {
    console.error("Error fetching token info:", error);
    throw error;
  }
}

export async function getAccountInfo(address: string) {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    const balance = await contract.balanceOf(address);
    const shares = await contract.sharesOf(address);
    const isBlocked = await contract.isBlocked(address);
    
    return {
      address,
      balance: balance.toString(),
      shares: shares.toString(),
      isBlocked
    };
  } catch (error) {
    console.error(`Error fetching info for account ${address}:`, error);
    throw error;
  }
}

export async function transferTokens(to: string, amount: string) {
  try {
    if (!contract || !wallet) {
      throw new Error("Contract or wallet not initialized");
    }
    
    const tx = await contract.transfer(to, ethers.parseUnits(amount, 18));
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      from: wallet.address,
      to,
      amount
    };
  } catch (error) {
    console.error("Error transferring tokens:", error);
    throw error;
  }
}

export async function mintTokens(to: string, amount: string) {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    const tx = await contract.mint(to, ethers.parseUnits(amount, 18));
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      to,
      amount
    };
  } catch (error) {
    console.error("Error minting tokens:", error);
    throw error;
  }
}

export async function burnTokens(from: string, amount: string) {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    const tx = await contract.burn(from, ethers.parseUnits(amount, 18));
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      from,
      amount
    };
  } catch (error) {
    console.error("Error burning tokens:", error);
    throw error;
  }
}

export async function pauseContract() {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    const tx = await contract.pause();
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash
    };
  } catch (error) {
    console.error("Error pausing contract:", error);
    throw error;
  }
}

export async function unpauseContract() {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    const tx = await contract.unpause();
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash
    };
  } catch (error) {
    console.error("Error unpausing contract:", error);
    throw error;
  }
}

export async function blockAccount(account: string) {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    const tx = await contract.blockAccount(account);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      account
    };
  } catch (error) {
    console.error(`Error blocking account ${account}:`, error);
    throw error;
  }
}

export async function unblockAccount(account: string) {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    const tx = await contract.unblockAccount(account);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      account
    };
  } catch (error) {
    console.error(`Error unblocking account ${account}:`, error);
    throw error;
  }
}

export async function updateRewardMultiplier(newValue: string, operation: 'set' | 'add' = 'set') {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    // Choose the appropriate contract function based on the operation
    let tx;
    if (operation === 'add') {
      tx = await contract.addRewardMultiplier(ethers.parseUnits(newValue, 18));
    } else {
      tx = await contract.setRewardMultiplier(ethers.parseUnits(newValue, 18));
    }
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      newValue,
      operation
    };
  } catch (error) {
    console.error(`Error ${operation === 'add' ? 'adding to' : 'setting'} reward multiplier:`, error);
    throw error;
  }
}

export async function grantRole(account: string, roleName: string) {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    const roleHash = ROLES[roleName as keyof typeof ROLES];
    if (!roleHash) {
      throw new Error(`Invalid role: ${roleName}`);
    }
    
    const tx = await contract.grantRole(roleHash, account);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      account,
      role: roleName
    };
  } catch (error) {
    console.error(`Error granting ${roleName} role to ${account}:`, error);
    throw error;
  }
}

export async function revokeRole(account: string, roleName: string) {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    const roleHash = ROLES[roleName as keyof typeof ROLES];
    if (!roleHash) {
      throw new Error(`Invalid role: ${roleName}`);
    }
    
    const tx = await contract.revokeRole(roleHash, account);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      account,
      role: roleName
    };
  } catch (error) {
    console.error(`Error revoking ${roleName} role from ${account}:`, error);
    throw error;
  }
}

export async function hasRole(account: string, roleName: string) {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    const roleHash = ROLES[roleName as keyof typeof ROLES];
    if (!roleHash) {
      throw new Error(`Invalid role: ${roleName}`);
    }
    
    const hasRole = await contract.hasRole(roleHash, account);
    
    return {
      account,
      role: roleName,
      hasRole
    };
  } catch (error) {
    console.error(`Error checking if ${account} has ${roleName} role:`, error);
    throw error;
  }
}

export async function getTransaction(txHash: string) {
  try {
    if (!provider) {
      throw new Error("Provider not initialized");
    }
    
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      throw new Error(`Transaction ${txHash} not found`);
    }
    
    const receipt = await provider.getTransactionReceipt(txHash);
    
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      blockNumber: tx.blockNumber,
      blockHash: tx.blockHash,
      timestamp: (await provider.getBlock(tx.blockNumber || 0))?.timestamp || 0,
      status: receipt?.status === 1 ? 'success' : 'failed',
      gasUsed: receipt?.gasUsed.toString() || '0'
    };
  } catch (error) {
    console.error(`Error fetching transaction ${txHash}:`, error);
    throw error;
  }
}

/**
 * Gets all events from the contract for a specified event type and block range
 * @param eventName Name of the event to filter for, or 'all' for all events
 * @param fromBlock Starting block number (default: latest 10000 blocks)
 * @param toBlock Ending block number (default: latest)
 * @param maxEvents Maximum number of events to return
 * @returns Array of events with decoded data
 */
export async function getContractEvents(
  eventName: string = 'all',
  fromBlock?: number,
  toBlock?: number,
  maxEvents: number = 1000
) {
  try {
    if (!provider || !contract) {
      throw new Error("Provider or contract not initialized");
    }
    
    // Get the latest block if not specified
    const latestBlock = await provider.getBlockNumber();
    
    // Alchemy has a 500 block limit, but we'll use 100 to be safe
    const MAX_BLOCK_RANGE = 100;
    
    // Default to last 100 blocks if not specified
    const effectiveFromBlock = fromBlock || Math.max(0, latestBlock - MAX_BLOCK_RANGE);
    let effectiveToBlock = toBlock || latestBlock;
    
    // Validate block ranges
    if (effectiveFromBlock < 0) {
      throw new Error("From block cannot be negative");
    }
    
    if (effectiveToBlock < effectiveFromBlock) {
      throw new Error("To block must be greater than or equal to from block");
    }
    
    // Ensure we don't exceed the maximum range
    if (effectiveToBlock - effectiveFromBlock > MAX_BLOCK_RANGE) {
      effectiveToBlock = effectiveFromBlock + MAX_BLOCK_RANGE;
    }
    
    // For specific testing, if no blocks are specified, use a recent known range
    // This is helpful when the "latest blocks" may not have any events
    if (fromBlock === undefined && toBlock === undefined && eventName === 'all') {
      // Use a recent range where we know there are events (e.g., from contract deployment or recent activity)
      const KNOWN_START_BLOCK = latestBlock - 200;
      const KNOWN_END_BLOCK = KNOWN_START_BLOCK + 100;
      console.log(`Using known block range for testing: ${KNOWN_START_BLOCK} to ${KNOWN_END_BLOCK}`);
      return await getContractEvents(eventName, KNOWN_START_BLOCK, KNOWN_END_BLOCK, maxEvents);
    }

    console.log(`Fetching events from block ${effectiveFromBlock} to ${effectiveToBlock} (${effectiveToBlock - effectiveFromBlock} blocks)`);
    
    // Create filter for all events or specific event
    let filter;
    if (eventName === 'all') {
      filter = { 
        address: contract.target as string,
        fromBlock: effectiveFromBlock,
        toBlock: effectiveToBlock
      };
    } else {
      // Get the event signature from the ABI
      if (!contract) {
        throw new Error("Contract not initialized");
      }
      
      try {
        // In ethers v6, the method changed from getEventTopic to getEvent().format
        const eventFragment = contract.interface.getEvent(eventName);
        
        if (!eventFragment) {
          throw new Error(`Event ${eventName} not found in contract ABI`);
        }
        
        const eventSignature = eventFragment.format();
        const eventTopic = ethers.id(eventSignature);
        
        filter = {
          address: contract.target as string,
          topics: [eventTopic],
          fromBlock: effectiveFromBlock,
          toBlock: effectiveToBlock
        };
      } catch (error) {
        console.error(`Error getting event topic for ${eventName}:`, error);
        throw new Error(`Event ${eventName} not found in contract ABI or is not properly formatted`);
      }
    }
    
    // Get logs from provider with timeout
    let logs;
    try {
      // Create a promise with timeout
      const timeoutDuration = 15000; // 15 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out - blockchain query took too long')), timeoutDuration);
      });
      
      // Race between the actual request and timeout
      logs = await Promise.race([
        provider.getLogs(filter),
        timeoutPromise
      ]) as ethers.Log[];
    } catch (error: any) {
      if (error.message.includes('timed out')) {
        // If timeout occurred, try with a smaller block range
        if (effectiveToBlock - effectiveFromBlock > 20) {
          console.log(`Query timed out. Retrying with smaller block range...`);
          const midBlock = Math.floor((effectiveFromBlock + effectiveToBlock) / 2);
          return await getContractEvents(eventName, effectiveFromBlock, midBlock, maxEvents);
        }
        throw error;
      }
      throw error;
    }
    
    // Limit the number of logs to process
    const limitedLogs = logs.slice(0, maxEvents);
    
    // Process and decode logs
    const events = await Promise.all(limitedLogs.map(async (log) => {
      try {
        if (!contract || !provider) {
          throw new Error("Contract or provider not initialized");
        }
        
        // Try to decode the log
        const parsedLog = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data
        });
        
        // Get the block for timestamp
        const block = await provider.getBlock(log.blockNumber);
        
        // Get transaction receipt for gas used and status
        const receipt = await provider.getTransactionReceipt(log.transactionHash);
        
        return {
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          logIndex: log.index,
          removed: log.removed,
          address: log.address,
          timestamp: block?.timestamp || 0,
          name: parsedLog?.name || 'Unknown',
          signature: parsedLog?.signature || '',
          topic: log.topics[0],
          args: parsedLog?.args ? Object.keys(parsedLog.args)
            .filter(key => isNaN(Number(key))) // Filter out numeric keys
            .reduce((obj, key) => {
              const value = parsedLog.args[key];
              obj[key] = typeof value === 'bigint' ? value.toString() : value;
              return obj;
            }, {} as Record<string, any>) : {},
          data: log.data,
          status: receipt?.status === 1 ? 'success' : 'failed',
          gasUsed: receipt?.gasUsed?.toString() || '0'
        };
      } catch (error) {
        console.warn(`Could not decode log for transaction ${log.transactionHash}:`, error);
        // Return partial data for logs we couldn't fully decode
        return {
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          logIndex: log.index,
          removed: log.removed,
          address: log.address,
          timestamp: 0, // We couldn't get the timestamp
          name: 'Unknown',
          signature: '',
          topic: log.topics[0],
          args: {},
          data: log.data,
          status: 'unknown',
          gasUsed: '0'
        };
      }
    }));
    
    // Sort events by block number (descending) and then by log index (ascending)
    const sortedEvents = events.sort((a, b) => {
      if (b.blockNumber !== a.blockNumber) {
        return b.blockNumber - a.blockNumber; // Newest blocks first
      }
      return a.logIndex - b.logIndex; // Within the same block, sort by log index
    });
    
    return {
      events: sortedEvents,
      range: {
        fromBlock: effectiveFromBlock,
        toBlock: effectiveToBlock,
        totalBlocks: effectiveToBlock - effectiveFromBlock,
        totalEvents: sortedEvents.length,
        hasMore: logs.length > maxEvents
      }
    };
  } catch (error) {
    console.error(`Error fetching contract events:`, error);
    throw error;
  }
}

// Initialize contract when this module is imported
initializeContract().catch(error => {
  console.error("Failed to initialize contract on startup:", error);
});