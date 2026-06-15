/**
 * Error Alert Service
 * Sends email notifications for critical errors in error_logs
 */

const nodemailer = require('nodemailer');
const { query } = require('../config/db');
const { logger } = require('../config/logger');

const ADMIN_EMAIL = 'haiqafrica@gmail.com';
const ALERT_THRESHOLD_MINUTES = 5; // Group errors within 5 minutes

let transporter = null;

/**
 * Initialize email transporter (reuses Resend config if available)
 */
function initializeTransporter() {
  if (transporter) return transporter;

  // Use Resend API for email (since we already have it configured)
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Create a custom transporter wrapper around Resend
  transporter = {
    send: async (mailOptions) => {
      try {
        const result = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@haiq.ug',
          to: mailOptions.to,
          subject: mailOptions.subject,
          html: mailOptions.html,
        });
        return result;
      } catch (err) {
        throw err;
      }
    }
  };

  return transporter;
}

/**
 * Send alert email for recent errors
 */
async function sendErrorAlert() {
  try {
    const transport = initializeTransporter();

    // Get unresolved critical errors from last 5 minutes
    const { rows: errors } = await query(
      `SELECT id, level, message, path, user_id, admin_id, created_at
       FROM error_logs
       WHERE resolved = false 
       AND level IN ('error', 'critical')
       AND created_at > NOW() - INTERVAL '${ALERT_THRESHOLD_MINUTES} minutes'
       ORDER BY created_at DESC
       LIMIT 20`
    );

    if (errors.length === 0) {
      return; // No new errors, don't send email
    }

    // Build email HTML
    const errorList = errors.map(e => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          <strong>${e.level.toUpperCase()}</strong>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; max-width: 300px; word-break: break-word;">
          ${e.message.substring(0, 100)}${e.message.length > 100 ? '...' : ''}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; color: #666;">
          ${e.path}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; color: #666;">
          ${new Date(e.created_at).toLocaleString()}
        </td>
      </tr>
    `).join('');

    const htmlBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: #f87171; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #d1d5db; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🚨 HAIQ Error Alert</h1>
              <p style="margin: 5px 0 0 0;">${errors.length} critical error(s) in the last ${ALERT_THRESHOLD_MINUTES} minutes</p>
            </div>

            <p>The following errors were detected in the HAIQ system:</p>

            <table>
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Message</th>
                  <th>Path</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                ${errorList}
              </tbody>
            </table>

            <div class="footer">
              <p>Review full error logs: <a href="https://haiq-web-admin.vercel.app/logs">Admin Dashboard → Logs</a></p>
              <p>This is an automated alert from HAIQ Error Monitoring System</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    await transport.send({
      to: ADMIN_EMAIL,
      subject: `🚨 HAIQ Alert: ${errors.length} Error(s) in Last ${ALERT_THRESHOLD_MINUTES}m`,
      html: htmlBody,
    });

    logger.info('Error alert email sent', { errorCount: errors.length, recipient: ADMIN_EMAIL });
  } catch (err) {
    logger.error('Failed to send error alert email', { error: err.message });
  }
}

/**
 * Send daily error summary
 */
async function sendDailyErrorSummary() {
  try {
    const transport = initializeTransporter();

    // Get errors from last 24 hours
    const { rows: summary } = await query(`
      SELECT 
        level,
        COUNT(*) as count,
        ARRAY_AGG(DISTINCT message ORDER BY message) as messages
      FROM error_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY level
      ORDER BY count DESC
    `);

    if (summary.length === 0) {
      return; // No errors, don't send email
    }

    const summaryTable = summary.map(s => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${s.level.toUpperCase()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold; color: #dc2626;">${s.count}</td>
      </tr>
    `).join('');

    const htmlBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #d1d5db; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📊 Daily Error Summary</h1>
              <p style="margin: 5px 0 0 0;">Last 24 hours</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                ${summaryTable}
              </tbody>
            </table>

            <div class="footer">
              <p>View detailed logs: <a href="https://haiq-web-admin.vercel.app/logs">Admin Dashboard → Logs</a></p>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transport.send({
      to: ADMIN_EMAIL,
      subject: `📊 HAIQ Daily Error Summary - ${new Date().toLocaleDateString()}`,
      html: htmlBody,
    });

    logger.info('Daily error summary email sent', { recipient: ADMIN_EMAIL });
  } catch (err) {
    logger.error('Failed to send daily summary email', { error: err.message });
  }
}

module.exports = {
  sendErrorAlert,
  sendDailyErrorSummary,
};
