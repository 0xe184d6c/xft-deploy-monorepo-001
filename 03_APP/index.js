const express = require('express');
const path = require('path');
const app = express();

const PORT = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/abi.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'abi.json'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

// API endpoint for contract deployments
app.get('/api/deployment', (req, res) => {
  const deploymentInfo = {
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
    transaction: "0xe03c2db67f323461692e5bd0743d26716797a453e82c33b1f79c4dbedc98f23f",
    timestamp: "2025-03-24T07:40:38.331Z"
  };
  res.json(deploymentInfo);
});

// Use explicit listen with callback
const server = app.listen(PORT, () => {
  console.log(`USDX Frontend server running at http://localhost:${PORT}`);
  
  // Force the port to stay open with keep-alive
  setInterval(() => {
    console.log(`Server heartbeat: ${new Date().toISOString()}`);
  }, 10000);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
