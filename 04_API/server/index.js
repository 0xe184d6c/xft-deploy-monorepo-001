const express = require('express');
const app = express();
const port = 5000;

// Middleware to parse JSON
app.use(express.json());

// In-memory database for tokens
const tokens = [];

// GET - Get all tokens
app.get('/tokens', (req, res) => {
  res.json(tokens);
});

// GET - Get token by id
app.get('/tokens/:id', (req, res) => {
  const token = tokens.find(t => t.id === parseInt(req.params.id));
  if (!token) {
    return res.status(404).json({ error: "Token not found" });
  }
  res.json(token);
});

// POST - Create a new token
app.post('/tokens', (req, res) => {
  const token = {
    id: tokens.length + 1,
    ...req.body,
    createdAt: new Date()
  };
  tokens.push(token);
  res.status(201).json(token);
});

// PUT - Update a token
app.put('/tokens/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = tokens.findIndex(t => t.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Token not found" });
  }
  
  const updatedToken = {
    ...tokens[index],
    ...req.body,
    updatedAt: new Date()
  };
  
  tokens[index] = updatedToken;
  res.json(updatedToken);
});

// DELETE - Delete a token
app.delete('/tokens/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = tokens.findIndex(t => t.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Token not found" });
  }
  
  const deletedToken = tokens[index];
  tokens.splice(index, 1);
  res.json(deletedToken);
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Ethereum API server running at http://localhost:${port}`);
});