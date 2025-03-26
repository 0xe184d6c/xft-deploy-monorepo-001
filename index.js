/**
 * Entry point for the ABI to OpenAPI converter service
 * Sets up the Express server with necessary middleware
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Register routes
app.use('/', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: true,
    message: 'Internal server error',
    details: err.message
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ABI to OpenAPI converter service running on http://0.0.0.0:${PORT}`);
});

module.exports = app;
