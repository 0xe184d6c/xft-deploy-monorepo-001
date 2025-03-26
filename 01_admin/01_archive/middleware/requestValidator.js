/**
 * Request validation middleware
 */

const { validateAbi } = require('../../utils/validators');

/**
 * Validate ABI JSON in request body
 */
function validateAbiRequest(req, res, next) {
  try {
    const abiJson = req.body;
    
    // Check for empty request body
    if (!abiJson || Object.keys(abiJson).length === 0) {
      const error = new Error('Request body is empty');
      error.statusCode = 400;
      return next(error);
    }

    // Validate the ABI structure
    const validationResult = validateAbi(abiJson);
    if (!validationResult.valid) {
      const error = new Error('Invalid ABI JSON structure');
      error.statusCode = 400;
      error.details = validationResult.errors;
      return next(error);
    }
    
    // Attach validated ABI to request for downstream handlers
    req.validatedAbi = abiJson;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateAbiRequest
};