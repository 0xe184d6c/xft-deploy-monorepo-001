/**
 * Route definitions for the ABI to OpenAPI converter
 */

const express = require('express');
const { validateAbi } = require('./validators');
const { parseAbi } = require('./abiParser');
const { generateOpenApiSpec } = require('./apiGenerator');

const router = express.Router();

/**
 * POST endpoint to generate OpenAPI specification from an Ethereum ABI
 * Accepts ABI JSON in request body
 * Returns OpenAPI specification as JSON
 */
router.post('/generateSpec', async (req, res) => {
  try {
    const abiJson = req.body;
    
    // Validate the ABI structure
    const validationResult = validateAbi(abiJson);
    if (!validationResult.valid) {
      return res.status(400).json({
        error: true,
        message: 'Invalid ABI JSON structure',
        details: validationResult.errors
      });
    }
    
    // Parse the ABI to extract functions, parameters, etc.
    const parsedAbi = parseAbi(abiJson);
    
    // Generate OpenAPI specification
    const openApiSpec = generateOpenApiSpec(parsedAbi);
    
    // Return the generated specification
    return res.status(200).json(openApiSpec);
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to generate OpenAPI specification',
      details: error.message
    });
  }
});

// Root endpoint that redirects to the static HTML
router.get('/', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

module.exports = router;
