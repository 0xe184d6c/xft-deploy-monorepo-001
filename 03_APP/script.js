const contractAddress = '0x421C76cd7C1550c4fcc974F4d74c870150c45995'; // Replace with your contract address
let provider, signer, contract;

async function initContract() {
    const response = await fetch('abi.json');
    const contractABI = await response.json();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
}

async function connectWallet() {
    if (!window.ethereum) return alert('Please install MetaMask!');

    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();

    await initContract();
    updateUI();
}

async function updateUI() {
    const address = await signer.getAddress();
    document.getElementById('walletAddress').textContent = `${address.slice(0,6)}...${address.slice(-4)}`;

    // Update balance
    const balance = await contract.balanceOf(address);
    document.getElementById('tokenBalance').textContent = ethers.utils.formatUnits(balance, 18);

    // Update roles
    const roles = await checkRoles(address);
    document.getElementById('roleStatus').textContent = roles.join(', ');
}

async function checkRoles(address) {
    const roles = [];
    const roleNames = ['DEFAULT_ADMIN_ROLE', 'MINTER_ROLE', 'BURNER_ROLE', 'BLOCKLIST_ROLE'];

    for (const role of roleNames) {
        if (await contract.hasRole(contract[role](), address)) {
            roles.push(role.replace('_ROLE', ''));
        }
    }
    return roles.length > 0 ? roles : ['None'];
}

// Token Operations
async function transferTokens() {
    const to = document.getElementById('transferAddress').value;
    const amount = document.getElementById('transferAmount').value;
    try {
        const tx = await contract.transfer(to, ethers.utils.parseUnits(amount, 18));
        await tx.wait();
        updateUI();
    } catch (error) {
        alert(`Transfer failed: ${error.message}`);
    }
}

async function mintTokens() {
    const to = document.getElementById('mintAddress').value;
    const amount = document.getElementById('mintAmount').value;
    try {
        const tx = await contract.mint(to, ethers.utils.parseUnits(amount, 18));
        await tx.wait();
        updateUI();
    } catch (error) {
        alert(`Mint failed: ${error.message}`);
    }
}

async function burnTokens() {
    const from = document.getElementById('mintAddress').value;
    const amount = document.getElementById('mintAmount').value;
    try {
        const tx = await contract.burn(from, ethers.utils.parseUnits(amount, 18));
        await tx.wait();
        updateUI();
    } catch (error) {
        alert(`Burn failed: ${error.message}`);
    }
}

// Admin Operations
async function togglePause() {
    try {
        const isPaused = await contract.paused();
        const tx = isPaused ? await contract.unpause() : await contract.pause();
        await tx.wait();
        alert(`Protocol ${isPaused ? 'unpaused' : 'paused'}`);
    } catch (error) {
        alert(`Toggle pause failed: ${error.message}`);
    }
}

async function updateRewardMultiplier() {
    const newValue = prompt('Enter new reward multiplier:');
    try {
        const tx = await contract.setRewardMultiplier(newValue);
        await tx.wait();
        alert('Reward multiplier updated');
    } catch (error) {
        alert(`Update failed: ${error.message}`);
    }
}

// Role Management
async function grantRole() {
    const address = document.getElementById('roleAddress').