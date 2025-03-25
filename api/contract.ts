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
      decimals,
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

export async function updateRewardMultiplier(newValue: string) {
  try {
    const tx = await contract.setRewardMultiplier(ethers.parseUnits(newValue, 18));
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      newValue
    };
  } catch (error) {
    console.error("Error updating reward multiplier:", error);
    throw error;
  }
}

export async function grantRole(account: string, roleName: string) {
  try {
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

// Initialize contract when this module is imported
initializeContract().catch(error => {
  console.error("Failed to initialize contract on startup:", error);
});