const contractAddress = "0xYourContractAddress"; // Replace with your deployed contract address
let provider, signer, contract, abi;

// Connect wallet, load ABI, and instantiate contract using ethers.js
document.getElementById('connectWallet').addEventListener('click', async () => {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    document.getElementById('account').innerText = "Connected: " + userAddress;
    // Fetch the ABI from /abi.json
    const res = await fetch('/abi.json');
    abi = await res.json();
    contract = new ethers.Contract(contractAddress, abi, signer);
  } else {
    alert("MetaMask not detected");
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
    document.getElementById('output').innerText = JSON.stringify(result, null, 2);
  } catch (err) {
    console.error(err);
    document.getElementById('output').innerText = err.message;
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
