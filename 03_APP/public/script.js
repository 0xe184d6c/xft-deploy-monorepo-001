// USDX contract address on Sepolia testnet (from deployment config)
const contractAddress = "0x421C76cd7C1550c4fcc974F4d74c870150c45995"; // Proxy address
const CHAIN_ID = 11155111; // Sepolia testnet chain ID
let provider, signer, contract, abi;
let isConnected = false;

// Set contract address in UI
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('contractAddress').textContent = shortenAddress(contractAddress);
});

/**
 * Initialize the application
 */
async function initApp() {
  try {
    // Wait for provider and contract to be initialized
    await Promise.all([setupProvider(), loadAbi()]);
    
    // Load contract information
    if (contract) {
      await updateContractInfo();
    }
  } catch (error) {
    console.error("Error initializing app:", error);
    showError(`Error initializing: ${error.message}`);
  }
}

/**
 * Set up the Ethereum provider
 */
async function setupProvider() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // Set up event listeners for account and network changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', () => window.location.reload());
    
    // Check if already connected
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      await connectWallet(false); // Connect silently without prompting
    }
  } else {
    showError("MetaMask not detected. Please install MetaMask extension to interact with this dApp.");
  }
}

/**
 * Load contract ABI
 */
async function loadAbi() {
  try {
    const res = await fetch('/abi.json');
    abi = await res.json();
    
    // Check if we're already signed in
    if (signer) {
      contract = new ethers.Contract(contractAddress, abi, signer);
    }
    return true;
  } catch (error) {
    console.error("Error loading ABI:", error);
    showError(`Error loading contract interface: ${error.message}`);
    return false;
  }
}

/**
 * Connect to user's wallet
 */
async function connectWallet(requestAccounts = true) {
  try {
    if (!window.ethereum) {
      showError("MetaMask not detected. Please install MetaMask extension to interact with this dApp.");
      return false;
    }
    
    // Request accounts if needed
    if (requestAccounts) {
      await provider.send("eth_requestAccounts", []);
    }
    
    signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    const network = await provider.getNetwork();
    
    // Check if we're on the right network
    if (network.chainId !== CHAIN_ID) {
      showError(`Please switch to Sepolia Testnet in your wallet. Current network ID: ${network.chainId}`);
      return false;
    }
    
    // Display connected account
    document.getElementById('account').innerHTML = `
      <div>
        <strong>Connected Account:</strong> 
        ${shortenAddress(userAddress)}
      </div>
    `;
    
    // Initialize contract with signer
    if (abi) {
      contract = new ethers.Contract(contractAddress, abi, signer);
      console.log("Contract initialized successfully");
      
      // Update contract info
      updateContractInfo();
      
      isConnected = true;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Failed to connect wallet`);
    showError(`Error connecting wallet: ${error.message}`);
    return false;
  }
}

/**
 * Handle account changes from MetaMask
 */
async function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // User disconnected
    isConnected = false;
    document.getElementById('account').innerHTML = '';
    document.getElementById('userBalance').innerText = '-';
    showWarning("Wallet disconnected. Please connect your wallet to continue.");
  } else {
    // Account changed, update UI
    if (provider) {
      signer = provider.getSigner();
      if (contract) {
        contract = new ethers.Contract(contractAddress, abi, signer);
        updateUserInfo();
      }
    }
  }
}

/**
 * Update contract information displayed in the UI
 */
async function updateContractInfo() {
  try {
    // Get basic token info
    const [name, symbol, decimals, totalSupply, rewardMultiplier] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
      contract.rewardMultiplier()
    ]);
    
    // Update UI elements
    document.getElementById('tokenName').innerText = name;
    document.getElementById('tokenSymbol').innerText = symbol;
    document.getElementById('tokenDecimals').innerText = decimals;
    document.getElementById('tokenSupply').innerText = 
      `${ethers.utils.formatUnits(totalSupply, decimals)} ${symbol}`;
    
    // Get user info if wallet is connected
    updateUserInfo();
    
    return true;
  } catch (error) {
    console.error("Error updating contract info:", error);
    showError(`Error loading token information: ${error.message}`);
    return false;
  }
}

/**
 * Update user-specific information
 */
async function updateUserInfo() {
  try {
    if (signer && contract) {
      const userAddress = await signer.getAddress();
      const balance = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      document.getElementById('userBalance').innerText = 
        `${ethers.utils.formatUnits(balance, decimals)} USDX`;
    }
  } catch (error) {
    console.error("Error updating user info:", error);
  }
}

/**
 * Connect wallet button click handler
 */
document.getElementById('connectWallet').addEventListener('click', async () => {
  await connectWallet(true);
});

/**
 * Function selection change handler
 */
document.getElementById('functionSelect').addEventListener('change', updateParams);
updateParams();

/**
 * Call function button click handler
 */
document.getElementById('callFunction').addEventListener('click', async () => {
  if (!isConnected) {
    showError("Please connect your wallet first");
    return;
  }
  
  const func = document.getElementById('functionSelect').value;
  const params = getParams();
  let result;
  
  try {
    showOutput("Processing request...", "warning");
    
    if (["name", "symbol", "decimals", "totalSupply", "balanceOf", "rewardMultiplier"].includes(func)) {
      // Read functions
      if (func === "balanceOf") {
        result = await contract.balanceOf(params.address);
      } else {
        result = await contract[func]();
      }
      displayReadResult(func, result);
    } else {
      // Write functions
      let tx;
      if (func === "mint") tx = await contract.mint(params.address, ethers.utils.parseUnits(params.amount, 18));
      else if (func === "burn") tx = await contract.burn(params.address, ethers.utils.parseUnits(params.amount, 18));
      else if (func === "transfer") tx = await contract.transfer(params.address, ethers.utils.parseUnits(params.amount, 18));
      else if (func === "approve") tx = await contract.approve(params.address, ethers.utils.parseUnits(params.amount, 18));
      else if (func === "transferFrom") tx = await contract.transferFrom(params.from, params.to, ethers.utils.parseUnits(params.amount, 18));
      else if (func === "setRewardMultiplier") tx = await contract.setRewardMultiplier(ethers.utils.parseUnits(params.value, 18));
      else if (func === "addRewardMultiplier") tx = await contract.addRewardMultiplier(ethers.utils.parseUnits(params.value, 18));
      else if (func === "pause") tx = await contract.pause();
      else if (func === "unpause") tx = await contract.unpause();
      
      showOutput(`Transaction submitted. Waiting for confirmation...`, "warning");
      result = await tx.wait();
      displayTransactionResult(func, result);
      
      // Update contract and user info after successful transaction
      updateContractInfo();
    }
  } catch (err) {
    console.error("Error executing function:", err);
    handleError(err);
  }
});

/**
 * Display read function results
 */
function displayReadResult(func, result) {
  const timestamp = new Date().toLocaleTimeString();
  let formattedOutput = `<div class="success">Query Result at ${timestamp}</div>`;
  
  if (ethers.BigNumber.isBigNumber(result)) {
    // For functions that return numbers (balanceOf, totalSupply, etc)
    const decimals = 18; // Default to 18, should be fetched from contract
    const readableValue = ethers.utils.formatUnits(result, decimals);
    
    formattedOutput += `
      <div><strong>Function:</strong> ${func}()</div>
      <div><strong>Raw Value:</strong> ${result.toString()}</div>
      <div><strong>Formatted Value:</strong> ${readableValue} USDX</div>
    `;
  } else if (typeof result === 'string') {
    // String results (name, symbol)
    formattedOutput += `
      <div><strong>Function:</strong> ${func}()</div>
      <div><strong>Result:</strong> ${result}</div>
    `;
  } else if (typeof result === 'number') {
    // Number results (decimals)
    formattedOutput += `
      <div><strong>Function:</strong> ${func}()</div>
      <div><strong>Result:</strong> ${result}</div>
    `;
  } else {
    // Default for other types
    formattedOutput += `
      <div><strong>Function:</strong> ${func}()</div>
      <div><strong>Result:</strong></div>
      <pre>${JSON.stringify(result, null, 2)}</pre>
    `;
  }
  
  showOutput(formattedOutput);
}

/**
 * Display transaction results
 */
function displayTransactionResult(func, result) {
  const timestamp = new Date().toLocaleTimeString();
  
  let formattedOutput = `
    <div class="success">Transaction Successful at ${timestamp}</div>
    <div><strong>Function:</strong> ${func}()</div>
    <div><strong>Transaction Hash:</strong> 
      <a href="https://sepolia.etherscan.io/tx/${result.transactionHash}" target="_blank" rel="noopener">
        ${result.transactionHash}
      </a>
    </div>
    <div><strong>Block Number:</strong> ${result.blockNumber}</div>
    <div><strong>From:</strong> ${result.from}</div>
    ${result.to ? `<div><strong>To:</strong> ${result.to}</div>` : ''}
    <div><strong>Gas Used:</strong> ${result.gasUsed ? result.gasUsed.toString() : 'N/A'}</div>
    
    <details>
      <summary>View Full Transaction Details</summary>
      <pre>${JSON.stringify(result, null, 2)}</pre>
    </details>
  `;
  
  showOutput(formattedOutput);
}

/**
 * Handle different types of errors
 */
function handleError(err) {
  let errorMsg = err.message;
  
  // Blockchain/contract errors
  if (errorMsg.includes("execution reverted")) {
    const reasonMatch = errorMsg.match(/reason="([^"]+)"/);
    if (reasonMatch && reasonMatch[1]) {
      errorMsg = `Transaction Failed: ${reasonMatch[1]}`;
    } else {
      errorMsg = "Transaction Failed: The contract reverted the transaction";
    }
  } 
  // MetaMask errors
  else if (errorMsg.includes("user rejected")) {
    errorMsg = "Transaction Cancelled: You rejected the transaction in your wallet";
  }
  // Network errors
  else if (errorMsg.includes("network error") || errorMsg.includes("connection error")) {
    errorMsg = "Network Error: Unable to connect to the Ethereum network. Please check your internet connection.";
  }
  // Permission errors
  else if (errorMsg.includes("missing provider")) {
    errorMsg = "Please connect your wallet to interact with the contract";
  }
  
  showError(errorMsg);
}

/**
 * Show output in the output container
 */
function showOutput(message, type = "success") {
  document.getElementById('output').innerHTML = message;
}

/**
 * Show an error message
 */
function showError(message) {
  const timestamp = new Date().toLocaleTimeString();
  document.getElementById('output').innerHTML = `
    <div class="error">Error at ${timestamp}</div>
    <div>${message}</div>
  `;
}

/**
 * Show a warning message
 */
function showWarning(message) {
  const timestamp = new Date().toLocaleTimeString();
  document.getElementById('output').innerHTML = `
    <div class="warning">Warning at ${timestamp}</div>
    <div>${message}</div>
  `;
}

/**
 * Shorten an Ethereum address for display
 */
function shortenAddress(address) {
  return address.slice(0, 6) + '...' + address.slice(-4);
}

/**
 * Dynamically generate input fields based on the selected function
 */
function updateParams() {
  const func = document.getElementById('functionSelect').value;
  const paramsDiv = document.getElementById('params');
  let html = "";
  
  if (func === "balanceOf") {
    html += `
      <div class="param-group">
        <label for="address">Address:</label>
        <input type="text" id="address" placeholder="0x...">
      </div>
    `;
  } else if (["mint", "burn", "transfer", "approve"].includes(func)) {
    html += `
      <div class="param-group">
        <label for="address">Address:</label>
        <input type="text" id="address" placeholder="0x...">
      </div>
      <div class="param-group">
        <label for="amount">Amount (USDX):</label>
        <input type="text" id="amount" placeholder="0.0">
      </div>
    `;
  } else if (func === "transferFrom") {
    html += `
      <div class="param-group">
        <label for="from">From:</label>
        <input type="text" id="from" placeholder="0x...">
      </div>
      <div class="param-group">
        <label for="to">To:</label>
        <input type="text" id="to" placeholder="0x...">
      </div>
      <div class="param-group">
        <label for="amount">Amount (USDX):</label>
        <input type="text" id="amount" placeholder="0.0">
      </div>
    `;
  } else if (["setRewardMultiplier", "addRewardMultiplier"].includes(func)) {
    html += `
      <div class="param-group">
        <label for="value">Value:</label>
        <input type="text" id="value" placeholder="1.0">
        <small>Use 1.0 for 100% (1x multiplier)</small>
      </div>
    `;
  } else {
    html += `<div class="no-params">No parameters required</div>`;
  }
  
  paramsDiv.innerHTML = html;
}

/**
 * Retrieve input values based on selected function
 */
function getParams() {
  const func = document.getElementById('functionSelect').value;
  const params = {};
  
  if (["balanceOf", "mint", "burn", "transfer", "approve"].includes(func)) {
    params.address = document.getElementById('address').value;
    if (func !== "balanceOf") params.amount = document.getElementById('amount').value;
  } else if (func === "transferFrom") {
    params.from = document.getElementById('from').value;
    params.to = document.getElementById('to').value;
    params.amount = document.getElementById('amount').value;
  } else if (["setRewardMultiplier", "addRewardMultiplier"].includes(func)) {
    params.value = document.getElementById('value').value;
  }
  
  return params;
}

// Initialize the app when the page loads
initApp();
