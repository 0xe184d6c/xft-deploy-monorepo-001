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

const rateLimit = require('express-rate-limit');

// Configure middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Register API routes
app.use('/api', routes);

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
let PORT = process.env.PORT || 8000;
let maxRetries = 3;
let retryCount = 0;

function startServer(port) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`ABI to OpenAPI converter service running on http://0.0.0.0:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retryCount < maxRetries) {
      retryCount++;
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server failed to start:', err.message);
      process.exit(1);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Performing graceful shutdown...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  return server;
}

// Start server
const server = startServer(PORT);

module.exports = server;
