#!/usr/bin/env node

/**
 * PostgreSQL Dump Backup (pg_dump)
 * Creates a portable, compressed database backup
 * 
 * Format: Custom PostgreSQL format (.dump) — compressed, resumable
 * Cost: ~2-5MB per backup (compressed)
 * Restore: pg_restore -d $DATABASE_URL backup-2026-06-11.dump
 * 
 * Retention: Last 7 daily + last 4 weekly backups (auto-cleanup)
 * 
 * Usage: node scripts/backup-pg-dump.js
 * Or via cron: 0 2 * * * /usr/bin/node /path/to/backend/scripts/backup-pg-dump.js
 */

require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { query } = require('../src/config/db');
const { logger } = require('../src/config/logger');

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function performBackup() {
  const timestamp = new Date().toISOString().split('T')[0];
  const backupFile = path.join(BACKUP_DIR, `haiq-${timestamp}.dump`);

  console.log('📦 Starting pg_dump backup...');
  console.log(`   Database: haiq_db (Neon PostgreSQL)`);
  console.log(`   Format: Custom (.dump) — compressed\n`);

  return new Promise((resolve) => {
    // Use pg_dump in custom format (Fc) for compression and resumable restore
    const cmd = `pg_dump --format=custom --compress=9 --no-privileges --no-owner "${DATABASE_URL}" > "${backupFile}"`;

    const startTime = Date.now();
    exec(cmd, async (err) => {
      if (err) {
        console.error('❌ Backup failed:', err.message);
        logger.error('pg_dump backup failed', { error: err.message });
        resolve(false);
        return;
      }

      const duration = Math.round((Date.now() - startTime) / 1000);
      const fileSize = fs.statSync(backupFile);
      const fileSizeMB = (fileSize.size / 1024 / 1024).toFixed(2);

      console.log('✅ Backup completed successfully!');
      console.log(`   File: haiq-${timestamp}.dump`);
      console.log(`   Size: ${fileSizeMB} MB`);
      console.log(`   Duration: ${duration}s\n`);

      // Cleanup old backups
      console.log('🧹 Cleaning up old backups...');
      cleanupBackups();

      // Log to error_logs for tracking
      try {
        await query(
          `INSERT INTO error_logs (level, message, metadata) VALUES ($1, $2, $3)`,
          [
            'info',
            'Database backup completed successfully',
            JSON.stringify({
              file: `haiq-${timestamp}.dump`,
              sizeMB: fileSizeMB,
              durationSeconds: duration,
              type: 'pg_dump'
            })
          ]
        );
      } catch (logErr) {
        logger.error('Failed to log backup status', { error: logErr.message });
      }

      console.log('🎉 Backup and cleanup complete!\n');
      resolve(true);
    });
  });
}

function cleanupBackups() {
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.dump')).sort().reverse();
  
  const now = new Date();
  const daily = [];
  const weekly = [];

  for (const file of files) {
    const match = file.match(/haiq-(\d{4}-\d{2}-\d{2})\.dump/);
    if (!match) continue;

    const fileDate = new Date(match[1]);
    const ageMs = now - fileDate;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // Keep last 7 daily + 4 weekly
    if (ageDays <= 7) {
      daily.push(file);
    } else if (ageDays <= 28 && Math.floor(ageDays / 7) % 1 === 0) {
      weekly.push(file);
    }
  }

  // Delete backups outside retention
  for (const file of files) {
    if (!daily.includes(file) && !weekly.includes(file)) {
      fs.unlinkSync(path.join(BACKUP_DIR, file));
      console.log(`   Deleted: ${file}`);
    }
  }

  console.log(`✅ Retention: ${daily.length} daily + ${weekly.length} weekly\n`);
}

// Run backup
performBackup().then(success => {
  process.exit(success ? 0 : 1);
});
