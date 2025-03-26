const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Import core modules
const abiParser = require('./src/abiParser');
const apiGenerator = require('./src/apiGenerator');
const validators = require('./src/validators');
const routes = require('./src/routes');

// Create Express application
const app = express();

// Configure middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Request timeout handler
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    const error = new Error('Request timeout');
    error.statusCode = 408;
    next(error);
  });
  next();
});

// Register routes
app.use('/', routes);

// 404 handler for routes that don't exist
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.statusCode = 404;
  next(error);
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(`Error: ${statusCode} - ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  
  res.status(statusCode).json({
    error: {
      status: statusCode,
      message: message
    }
  });
});

// Server configuration
const PORT = process.env.PORT || 8000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`ABI to OpenAPI converter service running on http://0.0.0.0:${PORT}`);
});

module.exports = server;
