/**
 * ABI to OpenAPI Converter
 * Express application with middleware and routes
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const routes = require('./src/api/routes');
const { notFoundHandler, errorHandler } = require('./src/api/middleware/errorHandler');

const app = express();

// Increase JSON payload limit and add error handling
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
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

module.exports = app;