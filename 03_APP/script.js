const contractAddress = '0x421C76cd7C1550c4fcc974F4d74c870150c45995'; // Replace with your contract address
let provider, signer, contract;
let activityLog = [];
let isDarkMode = false;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Set up tab navigation
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

    // Initialize token amount converter
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
    // Verify ethers is available
    if (typeof ethers === 'undefined') {
        console.error('Ethers library not loaded');
        addToActivityLog('Ethers library not loaded. Please refresh the page.', 'error');
        alert('Ethers library not loaded. Please refresh the page and try again.');
        return;
    }

    if (!window.ethereum) {
        alert('Please install MetaMask or another Ethereum wallet!');
        addToActivityLog('No Ethereum provider detected', 'error');
        return;
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