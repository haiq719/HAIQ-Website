#!/usr/bin/env node

/**
 * Neon Branch Snapshot Backup
 * Creates a live-queryable copy of the database using Neon's branch API
 * 
 * Cost: Zero (uses Neon's copy-on-write architecture)
 * Speed: Instant (few seconds)
 * Queryable: Yes (can query the snapshot directly)
 * 
 * Usage: node scripts/backup-neon-snapshot.js
 * Or via cron: 0 2 * * * /usr/bin/node /path/to/backend/scripts/backup-neon-snapshot.js
 */

require('dotenv').config();
const https = require('https');

const NEON_API_KEY = process.env.NEON_API_KEY;
const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;

if (!NEON_API_KEY || !NEON_PROJECT_ID) {
  console.error('❌ Missing NEON_API_KEY or NEON_PROJECT_ID environment variables');
  process.exit(1);
}

async function makeNeonRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.neon.tech',
      path: `/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '{}'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createSnapshot() {
  const timestamp = new Date().toISOString().split('T')[0];
  const branchName = `backup-${timestamp}`;

  console.log('📦 Creating Neon branch snapshot...');
  console.log(`   Project: ${NEON_PROJECT_ID}`);
  console.log(`   Branch: ${branchName}\n`);

  try {
    // Create branch from main
    const response = await makeNeonRequest('POST', `/projects/${NEON_PROJECT_ID}/branches`, {
      branch: {
        name: branchName,
        parent_id: 'main',
      },
    });

    if (response.branch) {
      console.log('✅ Snapshot created successfully!');
      console.log(`   Branch ID: ${response.branch.id}`);
      console.log(`   Name: ${response.branch.name}`);
      console.log(`   Created: ${response.branch.created_at}`);
      console.log(`   Connection: ${response.branch.connection_uri}\n`);
    }

    // Cleanup: Delete snapshots older than 14 days
    console.log('🧹 Cleaning up old snapshots (>14 days)...');
    const branches = await makeNeonRequest('GET', `/projects/${NEON_PROJECT_ID}/branches`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);
    
    let deleted = 0;
    for (const branch of branches.branches || []) {
      if (branch.name.startsWith('backup-') && branch.id !== 'main') {
        const branchDate = new Date(branch.created_at);
        if (branchDate < cutoffDate) {
          await makeNeonRequest('DELETE', `/projects/${NEON_PROJECT_ID}/branches/${branch.id}`);
          console.log(`   Deleted: ${branch.name}`);
          deleted++;
        }
      }
    }
    
    console.log(`✅ Cleanup complete (${deleted} old branches removed)\n`);
    console.log('🎉 Snapshot backup complete!');
  } catch (err) {
    console.error('❌ Snapshot failed:', err.message);
    process.exit(1);
  }
}

createSnapshot();
