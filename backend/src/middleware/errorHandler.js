const { logger } = require('../config/logger');
const { query } = require('../config/db');
const { sendErrorAlert } = require('../services/errorAlert.service');

function errorHandler(err, req, res, next) {
  // Log full error
  const userId = req.user?.id || null;
  const adminId = req.admin?.id || null;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  logger.error('Unhandled error', {
    message:  err.message,
    stack:    err.stack,
    path:     req.path,
    method:   req.method,
    userId:   userId,
    adminId:  adminId,
  });

  // Persist to error_logs table (non-blocking)
  try {
    query(
      `INSERT INTO error_logs (message, stack_trace, pg_error_code, path, method, user_id, admin_id, ip, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        err.message?.substring(0, 1000),
        err.stack?.substring(0, 5000),
        err.code || null,
        req.path?.substring(0, 500),
        req.method,
        userId,
        adminId,
        ip?.substring(0, 50),
        JSON.stringify({ originalError: err.toString() })
      ]
    ).then(() => {
      // Send email alert for 500+ errors (non-blocking)
      if (err.status >= 500 || err.statusCode >= 500) {
        sendErrorAlert().catch(() => {}); // Silent fail
      }
    })
    .catch(() => {}); // Silent fail — don't block the response
  } catch (logErr) {
    // If we can't even queue the log, just continue
  }

  // Determine status code
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // CORS error
  if (message.startsWith('CORS:')) {
    status  = 403;
    message = 'Origin not allowed';
  }

  // Postgres unique violation
  if (err.code === '23505') {
    status  = 409;
    message = 'Duplicate entry — resource already exists';
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    status  = 400;
    message = 'Referenced resource not found';
  }

  // JWT errors (should be caught in middleware but just in case)
  if (err.name === 'JsonWebTokenError') {
    status  = 401;
    message = 'Invalid token';
  }

  // Never leak internal messages in production
  if (status === 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred. Please try again.';
  }

  res.status(status).json({
    success: false,
    error:   message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
