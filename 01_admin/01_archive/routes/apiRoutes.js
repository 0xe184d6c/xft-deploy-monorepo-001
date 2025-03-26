/**
 * API Routes
 * Routes for the ABI to OpenAPI conversion API
 */

const express = require('express');
const { validateAbiRequest } = require('../middleware/requestValidator');
const { parseAbi } = require('../services/abiParser');
const { generateOpenApiSpec } = require('../services/apiGenerator');

const router = express.Router();

/**
 * @route POST /api/generateSpec
 * @description Generate OpenAPI specification from ABI JSON
 * @access Public
 */
router.post('/generateSpec', validateAbiRequest, async (req, res, next) => {
  try {
    // Get validated ABI from the request validator middleware
    const abiJson = req.validatedAbi;
    
    // Parse the ABI
    const parsedAbi = parseAbi(abiJson);
    
    // Generate OpenAPI specification
    const openApiSpec = generateOpenApiSpec(parsedAbi);
    
    // Validate the generated spec has required fields
    if (!openApiSpec || !openApiSpec.openapi || !openApiSpec.paths) {
      const error = new Error('Generated OpenAPI spec is invalid');
      error.statusCode = 422;
      return next(error);
    }
    
    return res.status(200).json(openApiSpec);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/health
 * @description Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;