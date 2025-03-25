// USDX contract address on Sepolia testnet (this is an example address, replace with your actual deployed contract address)
const contractAddress = "0x8431717927C4A3343bCf1626e7B5B1D31E240406";
let provider, signer, contract, abi;

// Connect wallet, load ABI, and instantiate contract using ethers.js
document.getElementById('connectWallet').addEventListener('click', async () => {
  try {
    if (window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      document.getElementById('account').innerText = "Connected: " + userAddress;
      
      // Fetch the ABI from /abi.json
      try {
        const res = await fetch('/abi.json');
        abi = await res.json();
        contract = new ethers.Contract(contractAddress, abi, signer);
        console.log("Contract initialized successfully");
      } catch (error) {
        console.error("Error loading ABI:", error);
        document.getElementById('output').innerText = "Error loading ABI: " + error.message;
      }
    } else {
      console.log("MetaMask not detected");
      document.getElementById('output').innerText = "MetaMask not detected. Please install MetaMask extension to interact with this dApp.";
    }
  } catch (error) {
    console.error("Error connecting wallet:", error);
    document.getElementById('output').innerText = "Error connecting wallet: " + error.message;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Failed to connect wallet`);
  }
});

// Update parameter inputs based on selected function
document.getElementById('functionSelect').addEventListener('change', updateParams);
updateParams();

// Call the selected contract function with provided parameters
document.getElementById('callFunction').addEventListener('click', async () => {
  const func = document.getElementById('functionSelect').value;
  const params = getParams();
  let result;
  try {
    if (["name", "symbol", "decimals", "balanceOf"].includes(func)) {
      result = (func === "balanceOf")
        ? await contract.balanceOf(params.address)
        : await contract[func]();
    } else {
      let tx;
      if (func === "mint") tx = await contract.mint(params.address, params.amount);
      else if (func === "burn") tx = await contract.burn(params.address, params.amount);
      else if (func === "transfer") tx = await contract.transfer(params.address, params.amount);
      else if (func === "approve") tx = await contract.approve(params.address, params.amount);
      else if (func === "transferFrom") tx = await contract.transferFrom(params.from, params.to, params.amount);
      else if (func === "setRewardMultiplier") tx = await contract.setRewardMultiplier(params.value);
      else if (func === "addRewardMultiplier") tx = await contract.addRewardMultiplier(params.value);
      else if (func === "pause") tx = await contract.pause();
      else if (func === "unpause") tx = await contract.unpause();
      result = await tx.wait();
    }
    // Format the output for better readability
    const timestamp = new Date().toLocaleTimeString();
    
    // Create a formatted output based on result type
    let formattedOutput = "";
    if (typeof result === 'object' && result.hash) {
      // Transaction receipt
      formattedOutput = `
        <div style="color: #27ae60; margin-bottom: 10px;">Transaction Successful at ${timestamp}</div>
        <strong>Transaction Hash:</strong> ${result.hash}<br>
        <strong>Block Number:</strong> ${result.blockNumber}<br>
        <strong>From:</strong> ${result.from}<br>
        ${result.to ? `<strong>To:</strong> ${result.to}<br>` : ''}
        <strong>Gas Used:</strong> ${result.gasUsed ? result.gasUsed.toString() : 'N/A'}<br>
        <hr>
        <details>
          <summary>View Full Transaction Details</summary>
          <pre>${JSON.stringify(result, null, 2)}</pre>
        </details>
      `;
    } else if (ethers.BigNumber.isBigNumber(result)) {
      // If it's a BigNumber (like balanceOf result)
      const readableValue = ethers.utils.formatUnits(result, 18); // Assuming 18 decimals, adjust as needed
      formattedOutput = `
        <div style="color: #27ae60; margin-bottom: 10px;">Query Result at ${timestamp}</div>
        <strong>Value (Wei):</strong> ${result.toString()}<br>
        <strong>Value (ETH):</strong> ${readableValue}<br>
      `;
    } else if (typeof result === 'string') {
      // Simple string result (like name, symbol)
      formattedOutput = `
        <div style="color: #27ae60; margin-bottom: 10px;">Query Result at ${timestamp}</div>
        <strong>Result:</strong> ${result}
      `;
    } else if (typeof result === 'number') {
      // Number result (like decimals)
      formattedOutput = `
        <div style="color: #27ae60; margin-bottom: 10px;">Query Result at ${timestamp}</div>
        <strong>Result:</strong> ${result}
      `;
    } else {
      // Default for any other types
      formattedOutput = `
        <div style="color: #27ae60; margin-bottom: 10px;">Operation Successful at ${timestamp}</div>
        <pre>${JSON.stringify(result, null, 2)}</pre>
      `;
    }
    
    document.getElementById('output').innerHTML = formattedOutput;
  } catch (err) {
    console.error("Error executing function:", err);
    
    // Format error message for better readability
    let errorMsg = err.message;
    
    // Check if it's a blockchain/contract error
    if (errorMsg.includes("execution reverted")) {
      const reasonMatch = errorMsg.match(/reason="([^"]+)"/);
      if (reasonMatch && reasonMatch[1]) {
        errorMsg = `Transaction Failed: ${reasonMatch[1]}`;
      } else {
        errorMsg = "Transaction Failed: The contract reverted the transaction";
      }
    }
    
    // Check for common MetaMask errors
    if (errorMsg.includes("user rejected")) {
      errorMsg = "Transaction Cancelled: You rejected the transaction in your wallet";
    }
    
    // Check for network errors
    if (errorMsg.includes("network error") || errorMsg.includes("connection error")) {
      errorMsg = "Network Error: Unable to connect to the Ethereum network. Please check your internet connection.";
    }
    
    // Add a timestamp
    const timestamp = new Date().toLocaleTimeString();
    document.getElementById('output').innerHTML = `<div style="color: #e74c3c; margin-bottom: 10px;">Error at ${timestamp}:</div>${errorMsg}`;
  }
});

// Dynamically generate input fields based on the selected function
function updateParams() {
  const func = document.getElementById('functionSelect').value;
  const paramsDiv = document.getElementById('params');
  let html = "";
  if (func === "balanceOf") {
    html += 'Address: <input type="text" id="address" placeholder="0x...">';
  } else if (["mint", "burn", "transfer", "approve"].includes(func)) {
    html += 'Address: <input type="text" id="address" placeholder="0x..."> ';
    html += 'Amount: <input type="number" id="amount" placeholder="Amount">';
  } else if (func === "transferFrom") {
    html += 'From: <input type="text" id="from" placeholder="0x..."> ';
    html += 'To: <input type="text" id="to" placeholder="0x..."> ';
    html += 'Amount: <input type="number" id="amount" placeholder="Amount">';
  } else if (["setRewardMultiplier", "addRewardMultiplier"].includes(func)) {
    html += 'Value: <input type="number" id="value" placeholder="Value">';
  }
  paramsDiv.innerHTML = html;
}

// Retrieve input values based on selected function
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
