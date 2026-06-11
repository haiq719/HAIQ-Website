/**
 * Admin Audit Logging Middleware
 * Records all admin mutations (POST, PUT, PATCH, DELETE) for compliance
 *
 * Captures:
 * - Who (admin_id)
 * - What (action: create/update/delete)
 * - Where (resource_type: product/order/etc, resource_id)
 * - When (timestamp)
 * - IP address and user agent
 * - Old data → new data (on updates)
 */

const { logger } = require('../config/logger');
const { query } = require('../config/db');

/**
 * Create admin audit log entry (non-blocking)
 */
async function logAdminAction(adminId, action, resourceType, resourceId, resourceName, oldData, newData, ip, userAgent) {
  if (!adminId) return; // Only log authenticated admin actions

  try {
    await query(
      `INSERT INTO admin_audit_log (admin_id, action, resource_type, resource_id, resource_name, old_data, new_data, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        adminId,
        action.substring(0, 50),
        resourceType.substring(0, 50),
        resourceId?.substring(0, 100),
        resourceName?.substring(0, 200),
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ip?.substring(0, 50),
        userAgent?.substring(0, 500)
      ]
    );
  } catch (err) {
    // Non-blocking: log write failure doesn't block the API response
    logger.error('Failed to write admin audit log', { error: err.message, action, resourceType });
  }
}

/**
 * Middleware factory: captures request body and attaches audit handler to res
 */
function adminAuditMiddleware(req, res, next) {
  // Capture request body for old_data comparison
  req.originalBody = req.body;
  req.logAudit = async (action, resourceType, resourceId, resourceName, newData) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    await logAdminAction(
      req.admin?.id,
      action,
      resourceType,
      resourceId,
      resourceName,
      req.method === 'POST' ? null : req.originalBody,  // No old data on POST (new record)
      newData || req.body,                               // New data
      ip,
      userAgent
    );
  };

  next();
}

module.exports = { adminAuditMiddleware, logAdminAction };
