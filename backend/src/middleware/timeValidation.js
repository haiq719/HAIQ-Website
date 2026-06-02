/**
 * Time Validation Middleware
 * Validates client-server time synchronization to prevent order inconsistencies
 *
 * Security: Blocks orders from users with system time off by > 1 hour
 * Logs suspicious time mismatches for monitoring potential attacks
 */

const CLOCK_SKEW_TOLERANCE_SECONDS = 300 // 5 minutes (HTTP standard)
const CRITICAL_SKEW_THRESHOLD = 3600 // 1 hour (hard block for orders)
const TIMEZONE_OFFSET_HOURS = 3 // Africa/Kampala UTC+3

/**
 * GET /api/server-time
 * Returns server's authoritative time for client-side validation
 * Should be a HEAD request to minimize bandwidth
 */
export const getServerTime = (req, res) => {
  const serverTime = new Date()

  // Return server time in UTC (ISO 8601 format)
  // Clients can parse and compare with their local time
  res.set({
    'X-Server-Time': serverTime.toISOString(),
    'X-Server-Timezone': 'Africa/Kampala', // UTC+3
    'X-Timezone-Offset': `+${TIMEZONE_OFFSET_HOURS}:00`,
    'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache time
  })

  // Support both GET and HEAD requests
  if (req.method === 'HEAD') {
    return res.status(200).end()
  }

  return res.status(200).json({
    server_time: serverTime.toISOString(),
    timezone: 'Africa/Kampala',
    timezone_offset: `UTC+${TIMEZONE_OFFSET_HOURS}`,
  })
}

/**
 * Middleware: Validate client-server time synchronization
 * Extracts X-Client-Time header and compares with server time
 *
 * Adds to req.timeValidation:
 * - clientTime: {Date} Client's time from header
 * - serverTime: {Date} Server's current time
 * - skew: {number} Absolute difference in seconds
 * - isValid: {boolean} true if skew <= tolerance
 * - isCritical: {boolean} true if skew > critical threshold
 */
export const validateTimeSync = (req, res, next) => {
  const serverTime = new Date()
  const clientTimeHeader = req.headers['x-client-time']

  // If no client time header, create default validation object
  if (!clientTimeHeader) {
    req.timeValidation = {
      clientTime: null,
      serverTime,
      skew: 0,
      isValid: true,
      isCritical: false,
      noHeader: true,
    }
    return next()
  }

  try {
    const clientTime = new Date(clientTimeHeader)

    // Validate the date is valid
    if (isNaN(clientTime.getTime())) {
      console.warn('[TimeValidation] Invalid client time format:', clientTimeHeader)
      req.timeValidation = {
        clientTime: null,
        serverTime,
        skew: 0,
        isValid: false,
        isCritical: false,
        invalidFormat: true,
      }
      return next()
    }

    // Calculate skew in seconds
    const skewMs = Math.abs(serverTime.getTime() - clientTime.getTime())
    const skew = Math.round(skewMs / 1000)
    const isValid = skew <= CRITICAL_SKEW_THRESHOLD
    const isCritical = skew > CRITICAL_SKEW_THRESHOLD

    // Log suspicious time mismatches (potential clock attacks)
    if (skew > CLOCK_SKEW_TOLERANCE_SECONDS) {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const userId = req.user?.id || 'anonymous'
      const route = req.path

      console.warn('[TimeValidation] Clock skew detected', {
        clientTime: clientTime.toISOString(),
        serverTime: serverTime.toISOString(),
        skewSeconds: skew,
        isCritical,
        userId,
        ip,
        route,
        timestamp: new Date().toISOString(),
      })
    }

    // Attach validation result to request
    req.timeValidation = {
      clientTime,
      serverTime,
      skew,
      isValid,
      isCritical,
    }

    next()
  } catch (error) {
    console.error('[TimeValidation] Error validating time:', error)
    req.timeValidation = {
      clientTime: null,
      serverTime,
      skew: 0,
      isValid: false,
      isCritical: false,
      error: true,
    }
    next()
  }
}

/**
 * Middleware: Enforce time validation for order operations
 * Blocks orders if client time is significantly off
 *
 * Used for POST /v1/orders and similar critical operations
 */
export const enforceTimeValidation = (req, res, next) => {
  // Skip if no time validation data (endpoint called without time header)
  if (!req.timeValidation) {
    return next()
  }

  // If critical time mismatch, reject the order
  if (req.timeValidation.isCritical) {
    const skewMinutes = Math.round(req.timeValidation.skew / 60)

    // Log the rejection
    console.warn('[TimeValidation] Order blocked - critical time mismatch', {
      userId: req.user?.id || 'anonymous',
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      skewSeconds: req.timeValidation.skew,
      skewMinutes,
      clientTime: req.timeValidation.clientTime?.toISOString(),
      serverTime: req.timeValidation.serverTime?.toISOString(),
      timestamp: new Date().toISOString(),
    })

    return res.status(400).json({
      success: false,
      error: 'TIME_SYNC_ERROR',
      message:
        'Your system time is incorrect. Please sync your device date and time with your network or NTP server, then try again.',
      details: {
        skewMinutes,
        instruction: 'Go to Settings → Date & Time → Sync or Set automatically',
      },
    })
  }

  next()
}

/**
 * Middleware: Log all time validation attempts (for security audits)
 * Optional: Enable for debugging or security monitoring
 */
export const logTimeValidation = (req, res, next) => {
  if (!req.timeValidation) {
    return next()
  }

  // Skip logging GET requests (too verbose)
  if (req.method === 'GET') {
    return next()
  }

  console.debug('[TimeValidation] Request received', {
    method: req.method,
    path: req.path,
    skew: req.timeValidation.skew,
    isValid: req.timeValidation.isValid,
    userId: req.user?.id || 'anonymous',
  })

  next()
}

export default {
  getServerTime,
  validateTimeSync,
  enforceTimeValidation,
  logTimeValidation,
  CLOCK_SKEW_TOLERANCE_SECONDS,
  CRITICAL_SKEW_THRESHOLD,
  TIMEZONE_OFFSET_HOURS,
}
