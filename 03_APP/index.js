const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000; // Changed port from 3000 to 5000

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve the ABI file from the root directory at /abi.json
app.get('/abi.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'abi.json'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log(`Health check available at http://0.0.0.0:${PORT}/health`);
});
