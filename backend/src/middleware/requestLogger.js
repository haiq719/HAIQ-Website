const { logger } = require('../config/logger');
const { query } = require('../config/db');

function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, path: reqPath, ip } = req;

  res.on('finish', async () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const userAgent = req.headers['user-agent'] || '';

    logger.info(`${method} ${reqPath} ${statusCode} ${duration}ms`, {
      ip,
      userAgent: userAgent.substring(0, 100),
    });

    // Always persist to DB (no env gate — logging is mandatory)
    try {
      await query(
        `INSERT INTO request_logs (method, path, status_code, duration_ms, ip, user_agent, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          method,
          reqPath.substring(0, 500),
          statusCode,
          duration,
          ip?.substring(0, 50),
          userAgent.substring(0, 500),
          req.user?.id || null
        ]
      );
    } catch (err) {
      // Don't let log write failure crash the app, but do log it
      logger.error('Failed to write request log', { error: err.message });
    }
  });

  next();
}

module.exports = { requestLogger };
