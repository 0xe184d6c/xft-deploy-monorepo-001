
const express = require('express');
const { validateAbi } = require('./validators');
const { parseAbi } = require('./abiParser');
const { generateOpenApiSpec } = require('./apiGenerator');

const router = express.Router();

router.post('/generateSpec', async (req, res) => {
  try {
    const abiJson = req.body;
    
    // Check for empty request body
    if (!abiJson || Object.keys(abiJson).length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Request body is empty'
      });
    }

    // Validate the ABI structure
    const validationResult = validateAbi(abiJson);
    if (!validationResult.valid) {
      return res.status(400).json({
        error: true,
        message: 'Invalid ABI JSON structure',
        details: validationResult.errors
      });
    }
    
    try {
      // Parse the ABI
      const parsedAbi = parseAbi(abiJson);
      
      // Generate OpenAPI specification
      const openApiSpec = generateOpenApiSpec(parsedAbi);
      
      // Validate the generated spec has required fields
      if (!openApiSpec || !openApiSpec.openapi || !openApiSpec.paths) {
        throw new Error('Generated OpenAPI spec is invalid');
      }
      
      return res.status(200).json(openApiSpec);
    } catch (processingError) {
      console.error('Processing error:', processingError);
      return res.status(422).json({
        error: true,
        message: 'Failed to process ABI',
        details: processingError.message
      });
    }
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to generate OpenAPI specification',
      details: error.message
    });
  }
});

router.get('/', (req, res) => {
  try {
    res.sendFile('index.html', { root: './public' });
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
