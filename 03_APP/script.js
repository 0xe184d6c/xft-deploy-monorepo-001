// Use a test network contract address - this should be replaced with deployed contract address
const contractAddress = '0x421C76cd7C1550c4fcc974F4d74c870150c45995'; 
// Network configuration - Add Hardhat local network support
const networks = {
    1: { name: 'Mainnet', explorer: 'https://etherscan.io' },
    5: { name: 'Goerli', explorer: 'https://goerli.etherscan.io' },
    11155111: { name: 'Sepolia', explorer: 'https://sepolia.etherscan.io' },
    31337: { name: 'Hardhat', explorer: '' }
};

// Global variables
let provider, signer, contract;
let activityLog = [];
let isDarkMode = false;

// Check if ethers library is available
function isEthersAvailable() {
    return typeof window.ethers !== 'undefined';
}

// Load ethers from local file
function loadEthers() {
    return new Promise((resolve, reject) => {
        // If ethers is already defined, resolve immediately
        if (isEthersAvailable()) {
            console.log('Ethers is already loaded');
            return resolve(true);
        }
        
        console.log('Attempting to dynamically load ethers.js...');
        
        // Create script element to load ethers
        const script = document.createElement('script');
        script.src = 'ethers.umd.min.js';
        script.type = 'text/javascript';
        
        // Set up event handlers
        script.onload = () => {
            console.log('Ethers library loaded successfully');
            if (isEthersAvailable()) {
                resolve(true);
            } else {
                reject(new Error('Ethers loaded but not defined'));
            }
        };
        
        script.onerror = (err) => {
            console.error('Failed to load ethers library:', err);
            reject(new Error('Failed to load ethers library'));
        };
        
        // Add script to the document
        document.head.appendChild(script);
    });
}

// Initialize the dashboard when document is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Document loaded, initializing app...');
    
    try {
        // Try to load ethers.js if not already loaded
        await loadEthers();
        
        // Set up the tab functionality
        setupTabs();
        
        // Check if we're in a test environment without MetaMask
        setupTestEnvironmentIfNeeded();
        
        // Set up dark mode toggle
        setupDarkMode();
        
        // Initialize token amount converter if ethers is available
        if (isEthersAvailable()) {
            const tokenAmountInput = document.getElementById('tokenAmount');
            if (tokenAmountInput) {
                tokenAmountInput.addEventListener('input', async () => {
                    if (contract) {
                        try {
                            const amount = tokenAmountInput.value;
                            if (amount && amount > 0) {
                                const shares = await contract.convertToShares(ethers.utils.parseUnits(amount, 18));
                                document.getElementById('sharesAmount').value = ethers.utils.formatUnits(shares, 18);
                            }
                        } catch (error) {
                            console.error('Error converting tokens:', error);
                        }
                    }
                });
            }
    
            // Check if MetaMask is already connected
            if (window.ethereum && window.ethereum.selectedAddress) {
                connectWallet();
            }
        } else {
            addToActivityLog('Ethereum library not available. Connect wallet feature disabled.', 'error');
        }
        
        console.log('App initialization complete');
    } catch (error) {
        console.error('Error during app initialization:', error);
        addToActivityLog('Error initializing application: ' + error.message, 'error');
        alert('Failed to load Ethereum library. Some features might not work properly.');
    }
});

// Toggle dark mode
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    const moonIcon = document.querySelector('.dark-mode-toggle i');
    if (isDarkMode) {
        moonIcon.classList.remove('fa-moon');
        moonIcon.classList.add('fa-sun');
    } else {
        moonIcon.classList.remove('fa-sun');
        moonIcon.classList.add('fa-moon');
    }
}

// Contract initialization
async function initContract() {
    try {
        const response = await fetch('abi.json');
        const contractABI = await response.json();
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        addToActivityLog('Contract initialized');
        return true;
    } catch (error) {
        console.error('Error initializing contract:', error);
        addToActivityLog('Failed to initialize contract', 'error');
        return false;
    }
}

// Connect to wallet
async function connectWallet() {
    try {
        // Verify ethers is available
        if (typeof window.ethers === 'undefined') {
            console.error('Ethers library not loaded');
            
            try {
                // Attempt to load ethers dynamically
                await loadEthers();
                console.log('Ethers successfully loaded dynamically');
            } catch (error) {
                console.error('Failed to load ethers dynamically:', error);
                addToActivityLog('Ethers library not loaded. Please refresh the page.', 'error');
                alert('Ethers library not loaded. Please refresh the page and try again.');
                return;
            }
        }

        // Check if ethereum object exists (MetaMask or other wallet)
        if (typeof window.ethereum === 'undefined') {
            console.error('No ethereum provider detected');
            alert('Please install MetaMask or another Ethereum wallet!');
            addToActivityLog('No Ethereum provider detected', 'error');
            return;
        }
        
        console.log('Ethereum provider detected:', window.ethereum);
    } catch (error) {
        console.error('Error checking wallet availability:', error);
    }

    try {
        // Show connecting state
        const connectButton = document.getElementById('connectButton');
        connectButton.innerHTML = '<span class="loading"></span> Connecting...';
        connectButton.disabled = true;

        // Initialize provider with error handling
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
        } catch (connectionError) {
            console.error('Provider connection error:', connectionError);
            throw new Error('Failed to connect to Ethereum provider: ' + connectionError.message);
        }

        // Initialize contract with error handling
        if (await initContract()) {
            // Update UI elements
            await updateDashboard();
            
            // Change button to "Connected"
            connectButton.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
            
            // Start periodic updates
            setInterval(updateDashboard, 30000); // Update every 30 seconds
            
            addToActivityLog('Wallet connected successfully');
        } else {
            connectButton.innerHTML = 'Connect Wallet';
            connectButton.disabled = false;
            throw new Error('Contract initialization failed');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        document.getElementById('connectButton').innerHTML = 'Connect Wallet';
        document.getElementById('connectButton').disabled = false;
        addToActivityLog('Failed to connect wallet: ' + error.message, 'error');
        
        // Show user-friendly error
        alert('Connection failed: ' + (error.message || 'Unknown error'));
    }
}

// Update all dashboard UI elements
async function updateDashboard() {
    if (!contract || !signer) return;
    
    try {
        // Get connected address
        const address = await signer.getAddress();
        document.getElementById('walletAddress').textContent = `${address.slice(0,6)}...${address.slice(-4)}`;

        // Get network info
        const network = await provider.getNetwork();
        document.getElementById('networkStatus').textContent = network.name;

        // Get token details
        const [
            name, 
            symbol, 
            decimals, 
            totalSupply, 
            balance, 
            roles, 
            isPaused, 
            multiplier,
            userShares,
            totalShares,
            gasPrice
        ] = await Promise.all([
            contract.name(),
            contract.symbol(),
            contract.decimals(),
            contract.totalSupply(),
            contract.balanceOf(address),
            checkRoles(address),
            contract.paused(),
            contract.rewardMultiplier(),
            contract.sharesOf(address),
            contract.totalShares(),
            provider.getGasPrice()
        ]);

        // Update token information
        document.getElementById('tokenName').textContent = name;
        document.getElementById('tokenSymbol').textContent = symbol;
        document.getElementById('tokenDecimals').textContent = decimals;
        document.getElementById('tokenBalance').textContent = ethers.utils.formatUnits(balance, decimals);
        document.getElementById('totalSupply').textContent = `${ethers.utils.formatUnits(totalSupply, decimals)} ${symbol}`;
        document.getElementById('roleStatus').textContent = roles.join(', ');
        document.getElementById('contractStatus').textContent = isPaused ? 'Paused' : 'Active';
        document.getElementById('pauseButtonText').textContent = isPaused ? 'Unpause Protocol' : 'Pause Protocol';
        document.getElementById('rewardMultiplier').textContent = `${(multiplier / 100).toFixed(2)}x`;
        document.getElementById('userShares').textContent = ethers.utils.formatUnits(userShares, decimals);
        document.getElementById('sharesTotalSupply').textContent = ethers.utils.formatUnits(totalShares, decimals);
        document.getElementById('gasPrice').textContent = `${ethers.utils.formatUnits(gasPrice, 'gwei')} Gwei`;
        
        // Update reward multiplier input placeholder
        document.getElementById('newMultiplier').placeholder = `Current: ${multiplier}`;

    } catch (error) {
        console.error('Error updating dashboard:', error);
        addToActivityLog('Error updating dashboard: ' + error.message, 'error');
    }
}

// Check all roles for an address
async function checkRoles(address) {
    const roles = [];
    const roleNames = ['DEFAULT_ADMIN_ROLE', 'MINTER_ROLE', 'BURNER_ROLE', 'BLOCKLIST_ROLE', 'PAUSE_ROLE', 'ORACLE_ROLE'];

    try {
        for (const role of roleNames) {
            if (await contract.hasRole(contract[role](), address)) {
                roles.push(role.replace('_ROLE', ''));
            }
        }
        return roles.length > 0 ? roles : ['None'];
    } catch (error) {
        console.error('Error checking roles:', error);
        return ['Error'];
    }
}

// Check a specific role for an address
async function checkRole() {
    const address = document.getElementById('roleAddress').value;
    const roleKey = document.getElementById('roleSelect').value;
    
    if (!ethers.utils.isAddress(address)) {
        alert('Please enter a valid address');
        return;
    }
    
    try {
        const hasRole = await contract.hasRole(contract[roleKey](), address);
        const roleName = roleKey.replace('_ROLE', '');
        const resultElement = document.getElementById('roleCheckResult');
        
        if (hasRole) {
            resultElement.textContent = `Address ${address.slice(0,6)}...${address.slice(-4)} has the ${roleName} role.`;
            resultElement.style.color = 'green';
        } else {
            resultElement.textContent = `Address ${address.slice(0,6)}...${address.slice(-4)} does NOT have the ${roleName} role.`;
            resultElement.style.color = 'red';
        }
        
        addToActivityLog(`Checked ${roleName} role for ${address.slice(0,6)}...${address.slice(-4)}`);
    } catch (error) {
        console.error('Error checking role:', error);
        addToActivityLog('Error checking role: ' + error.message, 'error');
        alert(`Error checking role: ${error.message}`);
    }
}

// Check if an address is blocked
async function checkIfBlocked() {
    const address = document.getElementById('blockAddress').value;
    
    if (!ethers.utils.isAddress(address)) {
        alert('Please enter a valid address');
        return;
    }
    
    try {
        const isBlocked = await contract.isBlocked(address);
        const statusElement = document.getElementById('accountBlockStatus');
        
        if (isBlocked) {
            statusElement.textContent = 'BLOCKED';
            statusElement.style.color = 'red';
        } else {
            statusElement.textContent = 'NOT BLOCKED';
            statusElement.style.color = 'green';
        }
        
        addToActivityLog(`Checked block status for ${address.slice(0,6)}...${address.slice(-4)}`);
    } catch (error) {
        console.error('Error checking block status:', error);
        addToActivityLog('Error checking block status: ' + error.message, 'error');
        alert(`Error checking block status: ${error.message}`);
    }
}

// Convert tokens to shares
async function convertTokens() {
    const tokenAmount = document.getElementById('tokenAmount').value;
    
    if (!tokenAmount || tokenAmount <= 0) {
        alert('Please enter a valid token amount');
        return;
    }
    
    try {
        const shares = await contract.convertToShares(ethers.utils.parseUnits(tokenAmount, 18));
        document.getElementById('sharesAmount').value = ethers.utils.formatUnits(shares, 18);
        addToActivityLog(`Converted ${tokenAmount} tokens to ${ethers.utils.formatUnits(shares, 18)} shares`);
    } catch (error) {
        console.error('Error converting tokens:', error);
        addToActivityLog('Error converting tokens: ' + error.message, 'error');
        alert(`Error converting tokens: ${error.message}`);
    }
}

// Token Operations
async function transferTokens() {
    const to = document.getElementById('transferAddress').value;
    const amount = document.getElementById('transferAmount').value;
    
    if (!ethers.utils.isAddress(to)) {
        alert('Please enter a valid recipient address');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        const tx = await contract.transfer(to, ethers.utils.parseUnits(amount, 18));
        addToActivityLog(`Transferring ${amount} tokens to ${to.slice(0,6)}...${to.slice(-4)}`, 'pending', tx.hash);
        
        await tx.wait();
        
        updateDashboard();
        addToActivityLog(`Transferred ${amount} tokens to ${to.slice(0,6)}...${to.slice(-4)}`, 'success', tx.hash);
    } catch (error) {
        console.error('Transfer failed:', error);
        addToActivityLog(`Transfer failed: ${error.message}`, 'error');
        alert(`Transfer failed: ${error.message}`);
    }
}

async function mintTokens() {
    const to = document.getElementById('mintAddress').value;
    const amount = document.getElementById('mintAmount').value;
    
    if (!ethers.utils.isAddress(to)) {
        alert('Please enter a valid recipient address');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        const tx = await contract.mint(to, ethers.utils.parseUnits(amount, 18));
        addToActivityLog(`Minting ${amount} tokens to ${to.slice(0,6)}...${to.slice(-4)}`, 'pending', tx.hash);
        
        await tx.wait();
        
        updateDashboard();
        addToActivityLog(`Minted ${amount} tokens to ${to.slice(0,6)}...${to.slice(-4)}`, 'success', tx.hash);
    } catch (error) {
        console.error('Mint failed:', error);
        addToActivityLog(`Mint failed: ${error.message}`, 'error');
        alert(`Mint failed: ${error.message}`);
    }
}

async function burnTokens() {
    const from = document.getElementById('mintAddress').value;
    const amount = document.getElementById('mintAmount').value;
    
    if (!ethers.utils.isAddress(from)) {
        alert('Please enter a valid address');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        const tx = await contract.burn(from, ethers.utils.parseUnits(amount, 18));
        addToActivityLog(`Burning ${amount} tokens from ${from.slice(0,6)}...${from.slice(-4)}`, 'pending', tx.hash);
        
        await tx.wait();
        
        updateDashboard();
        addToActivityLog(`Burned ${amount} tokens from ${from.slice(0,6)}...${from.slice(-4)}`, 'success', tx.hash);
    } catch (error) {
        console.error('Burn failed:', error);
        addToActivityLog(`Burn failed: ${error.message}`, 'error');
        alert(`Burn failed: ${error.message}`);
    }
}

// Block/Unblock Operations
async function blockAccount() {
    const address = document.getElementById('blockAddress').value;
    
    if (!ethers.utils.isAddress(address)) {
        alert('Please enter a valid address');
        return;
    }
    
    try {
        const tx = await contract.blockAccounts([address]);
        addToActivityLog(`Blocking account ${address.slice(0,6)}...${address.slice(-4)}`, 'pending', tx.hash);
        
        await tx.wait();
        
        document.getElementById('accountBlockStatus').textContent = 'BLOCKED';
        document.getElementById('accountBlockStatus').style.color = 'red';
        
        addToActivityLog(`Blocked account ${address.slice(0,6)}...${address.slice(-4)}`, 'success', tx.hash);
    } catch (error) {
        console.error('Block failed:', error);
        addToActivityLog(`Block failed: ${error.message}`, 'error');
        alert(`Block failed: ${error.message}`);
    }
}

async function unblockAccount() {
    const address = document.getElementById('blockAddress').value;
    
    if (!ethers.utils.isAddress(address)) {
        alert('Please enter a valid address');
        return;
    }
    
    try {
        const tx = await contract.unblockAccounts([address]);
        addToActivityLog(`Unblocking account ${address.slice(0,6)}...${address.slice(-4)}`, 'pending', tx.hash);
        
        await tx.wait();
        
        document.getElementById('accountBlockStatus').textContent = 'NOT BLOCKED';
        document.getElementById('accountBlockStatus').style.color = 'green';
        
        addToActivityLog(`Unblocked account ${address.slice(0,6)}...${address.slice(-4)}`, 'success', tx.hash);
    } catch (error) {
        console.error('Unblock failed:', error);
        addToActivityLog(`Unblock failed: ${error.message}`, 'error');
        alert(`Unblock failed: ${error.message}`);
    }
}

// Role Management
async function grantRole() {
    const address = document.getElementById('roleAddress').value;
    const roleKey = document.getElementById('roleSelect').value;
    
    if (!ethers.utils.isAddress(address)) {
        alert('Please enter a valid address');
        return;
    }
    
    try {
        const roleName = roleKey.replace('_ROLE', '');
        const tx = await contract.grantRole(contract[roleKey](), address);
        addToActivityLog(`Granting ${roleName} role to ${address.slice(0,6)}...${address.slice(-4)}`, 'pending', tx.hash);
        
        await tx.wait();
        
        document.getElementById('roleCheckResult').textContent = `${roleName} role granted to ${address.slice(0,6)}...${address.slice(-4)}`;
        document.getElementById('roleCheckResult').style.color = 'green';
        
        updateDashboard();
        addToActivityLog(`Granted ${roleName} role to ${address.slice(0,6)}...${address.slice(-4)}`, 'success', tx.hash);
    } catch (error) {
        console.error('Grant role failed:', error);
        addToActivityLog(`Grant role failed: ${error.message}`, 'error');
        alert(`Grant role failed: ${error.message}`);
    }
}

async function revokeRole() {
    const address = document.getElementById('roleAddress').value;
    const roleKey = document.getElementById('roleSelect').value;
    
    if (!ethers.utils.isAddress(address)) {
        alert('Please enter a valid address');
        return;
    }
    
    try {
        const roleName = roleKey.replace('_ROLE', '');
        const tx = await contract.revokeRole(contract[roleKey](), address);
        addToActivityLog(`Revoking ${roleName} role from ${address.slice(0,6)}...${address.slice(-4)}`, 'pending', tx.hash);
        
        await tx.wait();
        
        document.getElementById('roleCheckResult').textContent = `${roleName} role revoked from ${address.slice(0,6)}...${address.slice(-4)}`;
        document.getElementById('roleCheckResult').style.color = 'red';
        
        updateDashboard();
        addToActivityLog(`Revoked ${roleName} role from ${address.slice(0,6)}...${address.slice(-4)}`, 'success', tx.hash);
    } catch (error) {
        console.error('Revoke role failed:', error);
        addToActivityLog(`Revoke role failed: ${error.message}`, 'error');
        alert(`Revoke role failed: ${error.message}`);
    }
}

// Admin Operations
async function togglePause() {
    try {
        const isPaused = await contract.paused();
        const action = isPaused ? 'unpause' : 'pause';
        
        const tx = isPaused ? await contract.unpause() : await contract.pause();
        addToActivityLog(`${action.charAt(0).toUpperCase() + action.slice(1)}ing protocol...`, 'pending', tx.hash);
        
        await tx.wait();
        
        document.getElementById('contractStatus').textContent = isPaused ? 'Active' : 'Paused';
        document.getElementById('pauseButtonText').textContent = isPaused ? 'Pause Protocol' : 'Unpause Protocol';
        
        addToActivityLog(`Protocol ${isPaused ? 'unpaused' : 'paused'}`, 'success', tx.hash);
    } catch (error) {
        console.error('Toggle pause failed:', error);
        addToActivityLog(`Toggle pause failed: ${error.message}`, 'error');
        alert(`Toggle pause failed: ${error.message}`);
    }
}

async function setRewardMultiplier() {
    const newMultiplier = document.getElementById('newMultiplier').value;
    
    if (!newMultiplier || newMultiplier < 1) {
        alert('Please enter a valid reward multiplier (minimum 1)');
        return;
    }
    
    try {
        const tx = await contract.setRewardMultiplier(newMultiplier);
        addToActivityLog(`Setting reward multiplier to ${newMultiplier}...`, 'pending', tx.hash);
        
        await tx.wait();
        
        document.getElementById('rewardMultiplier').textContent = `${(newMultiplier / 100).toFixed(2)}x`;
        document.getElementById('newMultiplier').placeholder = `Current: ${newMultiplier}`;
        document.getElementById('newMultiplier').value = '';
        
        addToActivityLog(`Reward multiplier set to ${(newMultiplier / 100).toFixed(2)}x`, 'success', tx.hash);
    } catch (error) {
        console.error('Set reward multiplier failed:', error);
        addToActivityLog(`Set reward multiplier failed: ${error.message}`, 'error');
        alert(`Set reward multiplier failed: ${error.message}`);
    }
}

async function incrementRewardMultiplier() {
    const increment = document.getElementById('newMultiplier').value;
    
    if (!increment || increment < 1) {
        alert('Please enter a valid increment value (minimum 1)');
        return;
    }
    
    try {
        const tx = await contract.addRewardMultiplier(increment);
        addToActivityLog(`Incrementing reward multiplier by ${increment}...`, 'pending', tx.hash);
        
        await tx.wait();
        
        const newMultiplier = await contract.rewardMultiplier();
        document.getElementById('rewardMultiplier').textContent = `${(newMultiplier / 100).toFixed(2)}x`;
        document.getElementById('newMultiplier').placeholder = `Current: ${newMultiplier}`;
        document.getElementById('newMultiplier').value = '';
        
        addToActivityLog(`Reward multiplier incremented to ${(newMultiplier / 100).toFixed(2)}x`, 'success', tx.hash);
    } catch (error) {
        console.error('Increment reward multiplier failed:', error);
        addToActivityLog(`Increment reward multiplier failed: ${error.message}`, 'error');
        alert(`Increment reward multiplier failed: ${error.message}`);
    }
}

// Activity Log Management
function addToActivityLog(message, status = 'info', txHash = null) {
    try {
        const timestamp = new Date().toLocaleTimeString();
        let logEntry = `[${timestamp}] ${message}`;
        
        if (txHash) {
            logEntry += ` (TX: ${txHash.slice(0,6)}...${txHash.slice(-4)})`;
        }
        
        // Add to our log array
        activityLog.push({ message: logEntry, status });
        
        // Limit to last 50 entries
        if (activityLog.length > 50) {
            activityLog.shift();
        }
        
        // Update the activity log display
        updateActivityLog();
        
        // Also log to console for debugging
        console.log(logEntry);
    } catch (error) {
        // Failsafe for any logging errors
        console.error('Error adding to activity log:', error);
    }
}

function updateActivityLog() {
    try {
        const logElement = document.getElementById('activityLog');
        
        if (!logElement) {
            console.error('Activity log element not found');
            return;
        }
        
        // Clear current log display
        logElement.innerHTML = '';
        
        if (activityLog.length === 0) {
            logElement.innerHTML = '<div class="log-entry">No activity yet.</div>';
            return;
        }
        
        // Create a document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Display logs in reverse order (newest first)
        for (let i = activityLog.length - 1; i >= 0; i--) {
            const entry = activityLog[i];
            const logEntryElement = document.createElement('div');
            logEntryElement.className = 'log-entry';
            
            // Set color based on status
            switch (entry.status) {
                case 'error':
                    logEntryElement.style.color = 'red';
                    break;
                case 'success':
                    logEntryElement.style.color = 'green';
                    break;
                case 'pending':
                    logEntryElement.style.color = 'orange';
                    break;
                default:
                    // Default color from CSS
                    break;
            }
            
            logEntryElement.textContent = entry.message;
            fragment.appendChild(logEntryElement);
        }
        
        // Append all entries at once for better performance
        logElement.appendChild(fragment);
    } catch (error) {
        console.error('Error updating activity log display:', error);
    }
}

// Block account function 
async function blockAccount() {
    const address = document.getElementById('blockAddress').value;
    
    if (!ethers.utils.isAddress(address)) {
        alert('Please enter a valid address');
        return;
    }
    
    try {
        const tx = await contract.blockAccounts([address]);
        addToActivityLog(`Blocking address ${address.slice(0,6)}...${address.slice(-4)}`, 'pending', tx.hash);
        
        await tx.wait();
        
        // Update UI
        document.getElementById('accountBlockStatus').textContent = 'BLOCKED';
        document.getElementById('accountBlockStatus').style.color = 'red';
        
        addToActivityLog(`Address ${address.slice(0,6)}...${address.slice(-4)} has been blocked`, 'success', tx.hash);
    } catch (error) {
        console.error('Error blocking account:', error);
        addToActivityLog('Error blocking account: ' + error.message, 'error');
        alert(`Error blocking account: ${error.message}`);
    }
}

// Unblock account function
async function unblockAccount() {
    const address = document.getElementById('blockAddress').value;
    
    if (!ethers.utils.isAddress(address)) {
        alert('Please enter a valid address');
        return;
    }
    
    try {
        const tx = await contract.unblockAccounts([address]);
        addToActivityLog(`Unblocking address ${address.slice(0,6)}...${address.slice(-4)}`, 'pending', tx.hash);
        
        await tx.wait();
        
        // Update UI
        document.getElementById('accountBlockStatus').textContent = 'NOT BLOCKED';
        document.getElementById('accountBlockStatus').style.color = 'green';
        
        addToActivityLog(`Address ${address.slice(0,6)}...${address.slice(-4)} has been unblocked`, 'success', tx.hash);
    } catch (error) {
        console.error('Error unblocking account:', error);
        addToActivityLog('Error unblocking account: ' + error.message, 'error');
        alert(`Error unblocking account: ${error.message}`);
    }
}

// Burn tokens function
async function burnTokens() {
    const from = document.getElementById('mintAddress').value;
    const amount = document.getElementById('mintAmount').value;
    
    if (!ethers.utils.isAddress(from)) {
        alert('Please enter a valid address');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        const tx = await contract.burn(from, ethers.utils.parseUnits(amount, 18));
        addToActivityLog(`Burning ${amount} tokens from ${from.slice(0,6)}...${from.slice(-4)}`, 'pending', tx.hash);
        
        await tx.wait();
        
        updateDashboard();
        addToActivityLog(`Burned ${amount} tokens from ${from.slice(0,6)}...${from.slice(-4)}`, 'success', tx.hash);
    } catch (error) {
        console.error('Error burning tokens:', error);
        addToActivityLog('Error burning tokens: ' + error.message, 'error');
        alert(`Error burning tokens: ${error.message}`);
    }
}

// Toggle pause function
async function togglePause() {
    try {
        let tx;
        const isPaused = await contract.paused();
        
        if (isPaused) {
            tx = await contract.unpause();
            addToActivityLog('Unpausing protocol', 'pending', tx.hash);
        } else {
            tx = await contract.pause();
            addToActivityLog('Pausing protocol', 'pending', tx.hash);
        }
        
        await tx.wait();
        
        // Update UI
        updateDashboard();
        
        if (isPaused) {
            addToActivityLog('Protocol unpaused successfully', 'success', tx.hash);
        } else {
            addToActivityLog('Protocol paused successfully', 'success', tx.hash);
        }
    } catch (error) {
        console.error('Error toggling pause state:', error);
        addToActivityLog('Error toggling pause state: ' + error.message, 'error');
        alert(`Error toggling pause state: ${error.message}`);
    }
}

// Grant role function
async function grantRole() {
    const address = document.getElementById('roleAddress').value;
    const roleKey = document.getElementById('roleSelect').value;
    
    if (!ethers.utils.isAddress(address)) {
        alert('Please enter a valid address');
        return;
    }
    
    try {
        const tx = await contract.grantRole(contract[roleKey](), address);
        const roleName = roleKey.replace('_ROLE', '');
        
        addToActivityLog(`Granting ${roleName} role to ${address.slice(0,6)}...${address.slice(-4)}`, 'pending', tx.hash);
        
        await tx.wait();
        
        addToActivityLog(`Granted ${roleName} role to ${address.slice(0,6)}...${address.slice(-4)}`, 'success', tx.hash);
        
        // Update role check result
        const resultElement = document.getElementById('roleCheckResult');
        resultElement.textContent = `Address ${address.slice(0,6)}...${address.slice(-4)} now has the ${roleName} role.`;
        resultElement.style.color = 'green';
    } catch (error) {
        console.error('Error granting role:', error);
        addToActivityLog('Error granting role: ' + error.message, 'error');
        alert(`Error granting role: ${error.message}`);
    }
}

// Revoke role function
async function revokeRole() {
    const address = document.getElementById('roleAddress').value;
    const roleKey = document.getElementById('roleSelect').value;
    
    if (!ethers.utils.isAddress(address)) {
        alert('Please enter a valid address');
        return;
    }
    
    try {
        const tx = await contract.revokeRole(contract[roleKey](), address);
        const roleName = roleKey.replace('_ROLE', '');
        
        addToActivityLog(`Revoking ${roleName} role from ${address.slice(0,6)}...${address.slice(-4)}`, 'pending', tx.hash);
        
        await tx.wait();
        
        addToActivityLog(`Revoked ${roleName} role from ${address.slice(0,6)}...${address.slice(-4)}`, 'success', tx.hash);
        
        // Update role check result
        const resultElement = document.getElementById('roleCheckResult');
        resultElement.textContent = `Address ${address.slice(0,6)}...${address.slice(-4)} no longer has the ${roleName} role.`;
        resultElement.style.color = 'red';
    } catch (error) {
        console.error('Error revoking role:', error);
        addToActivityLog('Error revoking role: ' + error.message, 'error');
        alert(`Error revoking role: ${error.message}`);
    }
}

// Function to increment reward multiplier 
async function incrementRewardMultiplier() {
    const incrementValue = document.getElementById('newMultiplier').value;
    
    if (!incrementValue || incrementValue <= 0) {
        alert('Please enter a valid amount to add to the multiplier');
        return;
    }
    
    try {
        const tx = await contract.addRewardMultiplier(parseInt(incrementValue));
        addToActivityLog(`Adding ${incrementValue} basis points to reward multiplier`, 'pending', tx.hash);
        
        await tx.wait();
        
        updateDashboard();
        
        // Clear the input field
        document.getElementById('newMultiplier').value = '';
        
        addToActivityLog(`Added ${incrementValue} basis points to reward multiplier`, 'success', tx.hash);
    } catch (error) {
        console.error('Error incrementing reward multiplier:', error);
        addToActivityLog('Error incrementing reward multiplier: ' + error.message, 'error');
        alert(`Error incrementing reward multiplier: ${error.message}`);
    }
}

// Setup tabs in UI
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all tab content
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show the corresponding tab content
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Setup test environment if needed
function setupTestEnvironmentIfNeeded() {
    // For development environments - show a warning if no ethereum provider
    if (typeof window.ethereum === 'undefined') {
        console.warn('No Ethereum provider detected. Running in development mode.');
        document.getElementById('connectButton').disabled = true;
        document.getElementById('connectButton').textContent = 'No Wallet Available';
        
        addToActivityLog('No Ethereum wallet detected. Some features will be disabled.', 'error');
    }
}

// Setup dark mode toggle
function setupDarkMode() {
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
        
        // Check for saved preference
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        if (savedDarkMode) {
            isDarkMode = true;
            document.body.classList.add('dark-mode');
            const icon = darkModeToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }
}

// Add entry to activity log
function addToActivityLog(message, status = 'info', txHash = null) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = {
        timestamp: timestamp,
        message: message,
        status: status || 'info',
        txHash: txHash
    };
    
    // Add to in-memory log
    activityLog.unshift(entry);
    
    // Keep log at a reasonable size
    if (activityLog.length > 100) {
        activityLog.pop();
    }
    
    // Update the UI
    updateActivityLogUI();
    
    // Log to console for debugging
    console.log(`[${status.toUpperCase()}] ${message}`);
}

// Update the activity log UI
function updateActivityLogUI() {
    const logElement = document.getElementById('activityLog');
    if (!logElement) return;
    
    logElement.innerHTML = '';
    
    activityLog.forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${entry.status}`;
        
        let logContent = `
            <span class="log-time">${entry.timestamp}</span>
            <span class="log-message">${entry.message}</span>
        `;
        
        if (entry.txHash) {
            const network = provider ? provider.network.chainId : 1;
            const explorerUrl = networks[network]?.explorer;
            if (explorerUrl) {
                logContent += `
                    <a href="${explorerUrl}/tx/${entry.txHash}" target="_blank" class="log-hash">
                        <i class="fas fa-external-link-alt"></i> View Transaction
                    </a>
                `;
            }
        }
        
        logEntry.innerHTML = logContent;
        logElement.appendChild(logEntry);
    });
}