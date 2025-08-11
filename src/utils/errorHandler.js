/**
 * Standard error response format for the API
 * @param {string} message - Error message
 * @param {string} [code] - Error code (e.g., 'AUTH_ERROR', 'VALIDATION_ERROR')
 * @param {Object} [details] - Additional error details
 * @returns {Object} Standardized error response
 */
const createError = (message, code = 'INTERNAL_ERROR', details = {}) => ({
  success: false,
  error: {
    message,
    code,
    ...details
  }
});

/**
 * Common error types with their default messages and status codes
 */
const ERROR_TYPES = {
  // Authentication errors (401)
  UNAUTHORIZED: {
    status: 401,
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
  },
  INVALID_CREDENTIALS: {
    status: 401,
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
  },
  INVALID_TOKEN: {
    status: 401,
    code: 'INVALID_TOKEN',
    message: 'Invalid or expired token',
  },
  
  // Forbidden errors (403)
  FORBIDDEN: {
    status: 403,
    code: 'FORBIDDEN',
    message: 'You do not have permission to access this resource',
  },
  
  // Not found errors (404)
  NOT_FOUND: {
    status: 404,
    code: 'NOT_FOUND',
    message: 'The requested resource was not found',
  },
  
  // Validation errors (400)
  VALIDATION_ERROR: {
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
  },
  
  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: {
    status: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
  
  // Internal server errors (500)
  INTERNAL_ERROR: {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  },
};

/**
 * Creates a standardized error response
 * @param {Object} res - Express response object
 * @param {string|Error} error - Error message or Error object
 * @param {string} [type='INTERNAL_ERROR'] - Error type from ERROR_TYPES
 * @param {Object} [details] - Additional error details
 * @returns {Object} Express response with error
 */
const sendError = (res, error, type = 'INTERNAL_ERROR', details = {}) => {
  const errorType = ERROR_TYPES[type] || ERROR_TYPES.INTERNAL_ERROR;
  const statusCode = errorType.status || 500;
  const errorMessage = error instanceof Error ? error.message : error;
  
  const response = createError(
    errorMessage || errorType.message,
    errorType.code,
    details
  );
  
  return res.status(statusCode).json(response);
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle JWT specific errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 'INVALID_TOKEN');
  }
  
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token has expired', 'INVALID_TOKEN');
  }
  
  // Handle database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'Duplicate entry found', 'VALIDATION_ERROR', {
      field: err.sqlMessage.match(/key '(.+?)'/)?.[1],
    });
  }
  
  // Handle validation errors (e.g., from express-validator)
  if (err.name === 'ValidationError' || Array.isArray(err.errors)) {
    const errors = Array.isArray(err.errors) 
      ? err.errors.map(e => ({
          field: e.param,
          message: e.msg,
          value: e.value,
        }))
      : [{
          field: err.path,
          message: err.message,
          value: err.value,
        }];
    
    return sendError(res, 'Validation failed', 'VALIDATION_ERROR', { errors });
  }
  
  // Default error handler
  sendError(res, err.message || 'An unexpected error occurred', 'INTERNAL_ERROR');
};

/**
 * 404 Not Found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
  sendError(res, `Cannot ${req.method} ${req.originalUrl}`, 'NOT_FOUND');
};

module.exports = {
  createError,
  sendError,
  errorHandler,
  notFoundHandler,
  ERROR_TYPES,
};
