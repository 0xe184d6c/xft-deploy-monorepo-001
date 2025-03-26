/**
 * Main Router
 * Combines all routes for the application
 */

const express = require('express');
const apiRoutes = require('./apiRoutes');
const docRoutes = require('./docRoutes');
const path = require('path');

const router = express.Router();

/**
 * @route GET /
 * @description Home page
 * @access Public
 */
router.get('/', (req, res, next) => {
  try {
    res.sendFile('index.html', { root: './public' });
  } catch (error) {
    error.statusCode = 500;
    error.message = 'Error serving home page';
    next(error);
  }
});

// API routes
router.use('/api', apiRoutes);

// Documentation routes
router.use('/docs', docRoutes);

module.exports = router;