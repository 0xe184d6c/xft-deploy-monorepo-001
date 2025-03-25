const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve the ABI file from the root directory at /abi.json
app.get('/abi.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'abi.json'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
