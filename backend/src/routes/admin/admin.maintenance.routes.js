/**
 * Admin Maintenance Routes
 * Endpoints for manual backup triggering and system maintenance
 */

const router = require('express').Router();
const { requireSuperAdmin } = require('../../middleware/adminAuth');
const { exec } = require('child_process');
const path = require('path');
const { logger } = require('../../config/logger');

/**
 * POST /v1/admin/maintenance/backup
 * Trigger a full database backup (both Neon snapshot + pg_dump)
 * Requires superadmin role
 */
router.post('/backup', requireSuperAdmin, async (req, res) => {
  logger.info('Backup triggered by admin', { adminId: req.admin?.id });

  // Run pg_dump backup
  exec(`node ${path.join(__dirname, '../../scripts/backup-pg-dump.js')}`, (pgErr) => {
    if (pgErr) {
      logger.error('pg_dump backup failed', { error: pgErr.message });
      return res.status(500).json({ success: false, error: 'pg_dump backup failed' });
    }

    // Run Neon snapshot backup
    exec(`node ${path.join(__dirname, '../../scripts/backup-neon-snapshot.js')}`, (neonErr) => {
      if (neonErr) {
        logger.error('Neon snapshot backup failed', { error: neonErr.message });
        return res.status(500).json({ success: false, error: 'Neon snapshot backup failed' });
      }

      logger.info('Full backup completed successfully', { adminId: req.admin?.id });
      res.json({ 
        success: true, 
        message: 'Backup triggered successfully',
        timestamp: new Date().toISOString()
      });
    });
  });
});

module.exports = router;
