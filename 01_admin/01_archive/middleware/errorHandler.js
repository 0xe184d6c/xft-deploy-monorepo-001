/**
 * Global error handling middleware
 */

/**
 * Handle 404 errors for routes that don't exist
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

/**
 * Handle all other errors
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  
  // Log error details for server-side debugging
  console.error(`[ERROR] ${statusCode} - ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  
  // Prepare client-friendly error response
  const errorResponse = {
    error: true,
    message: statusCode === 500 ? 'Internal Server Error' : err.message
  };
  
  // Include error details in non-production environments
  if (process.env.NODE_ENV !== 'production' && err.details) {
    errorResponse.details = err.details;
  }
  
  res.status(statusCode).json(errorResponse);
}

module.exports = {
  notFoundHandler,
  errorHandler
};