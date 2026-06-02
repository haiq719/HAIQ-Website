/**
 * Time Synchronization Utility
 * Handles client-server time validation to prevent order inconsistencies
 * from users with incorrect system time settings
 *
 * Security: Uses Uganda timezone (Africa/Kampala UTC+3) as standard
 * Tolerances: 5 minutes warning, 1 hour hard block (industry standards)
 */

// Constants - Best practice security thresholds
export const CLOCK_SKEW_TOLERANCE_SECONDS = 300 // 5 minutes (HTTP standard)
export const CRITICAL_SKEW_THRESHOLD = 3600 // 1 hour (hard block for orders)
export const TIMEZONE = 'Africa/Kampala' // Uganda standard
export const TIMEZONE_OFFSET_HOURS = 3 // UTC+3

// Cache for server time (to avoid repeated fetches)
let cachedServerTime = null
let cacheTimestamp = null
const CACHE_DURATION_MS = 30000 // 30 seconds

/**
 * Fetch server's authoritative time from backend
 * Returns ISO string in UTC (server timezone: Africa/Kampala UTC+3)
 *
 * @returns {Promise<Date>} Server time as Date object
 */
export const getServerTime = async () => {
  const now = Date.now()

  // Return cached value if fresh (within 30 seconds)
  if (cachedServerTime && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return new Date(cachedServerTime)
  }

  try {
    const response = await fetch('/api/server-time', {
      method: 'HEAD',
      credentials: 'include',
    })

    // Get server time from response header
    const serverTimeHeader = response.headers.get('X-Server-Time')
    if (!serverTimeHeader) {
      console.warn('[TimeSync] Server time header missing, using client time as fallback')
      return new Date()
    }

    // Cache the server time
    cachedServerTime = serverTimeHeader
    cacheTimestamp = now

    return new Date(serverTimeHeader)
  } catch (error) {
    console.error('[TimeSync] Failed to fetch server time:', error)
    // Graceful fallback - return client time if server unavailable
    return new Date()
  }
}

/**
 * Get client's current system time
 *
 * @returns {Date} Client's current time
 */
export const getClientTime = () => {
  return new Date()
}

/**
 * Calculate clock skew between client and server
 * Returns absolute difference in seconds
 *
 * @param {Date} serverTime - Server time from backend
 * @param {Date} clientTime - Client system time
 * @returns {number} Skew in seconds (always positive)
 */
export const calculateClockSkew = (serverTime, clientTime) => {
  const skewMs = Math.abs(serverTime.getTime() - clientTime.getTime())
  return Math.round(skewMs / 1000) // Convert to seconds
}

/**
 * Check if current time is valid for order submission
 * Returns true if skew is within acceptable range
 *
 * @param {Date} serverTime - Server time
 * @param {Date} clientTime - Client time
 * @param {number} tolerance - Tolerance in seconds (default: 5 min)
 * @returns {boolean} True if time is valid
 */
export const isTimeValid = (serverTime, clientTime, tolerance = CLOCK_SKEW_TOLERANCE_SECONDS) => {
  const skew = calculateClockSkew(serverTime, clientTime)
  return skew <= tolerance
}

/**
 * Check if time difference is critical (user should be blocked)
 *
 * @param {Date} serverTime - Server time
 * @param {Date} clientTime - Client time
 * @returns {boolean} True if skew exceeds critical threshold
 */
export const isTimeCritical = (serverTime, clientTime) => {
  const skew = calculateClockSkew(serverTime, clientTime)
  return skew > CRITICAL_SKEW_THRESHOLD
}

/**
 * Format user-friendly error message based on clock skew
 *
 * @param {number} skewSeconds - Clock skew in seconds
 * @returns {string} User-friendly error message
 */
export const formatTimeError = (skewSeconds) => {
  const skewMinutes = Math.round(skewSeconds / 60)
  const ahead = skewSeconds > 0 ? 'ahead' : 'behind' // Note: skew is always positive

  if (skewSeconds > CRITICAL_SKEW_THRESHOLD) {
    return `Your device time is off by ${skewMinutes} minutes. Please correct your system date and time before placing an order. Go to Settings → Date & Time to sync your device.`
  }

  if (skewSeconds > CLOCK_SKEW_TOLERANCE_SECONDS) {
    return `Your device time appears to be off by ${skewMinutes} minutes. Please correct it to ensure orders process correctly.`
  }

  return 'Your system time is correct.'
}

/**
 * Initialize time synchronization on app load
 * Fetches server time once on startup and caches it
 *
 * @returns {Promise<Object>} Object with serverTime, clientTime, skew, valid
 */
export const initializeTimeSync = async () => {
  try {
    const serverTime = await getServerTime()
    const clientTime = getClientTime()
    const skew = calculateClockSkew(serverTime, clientTime)
    const valid = skew <= CRITICAL_SKEW_THRESHOLD

    console.log('[TimeSync] Initialized', {
      serverTime: serverTime.toISOString(),
      clientTime: clientTime.toISOString(),
      skewSeconds: skew,
      valid,
      timezone: TIMEZONE,
    })

    return { serverTime, clientTime, skew, valid }
  } catch (error) {
    console.error('[TimeSync] Initialization failed:', error)
    return { valid: true } // Assume valid if sync fails (graceful degradation)
  }
}

/**
 * Add client time to request headers for server validation
 *
 * @param {Object} headers - Request headers object
 * @returns {Object} Headers with X-Client-Time added
 */
export const addClientTimeHeader = (headers = {}) => {
  return {
    ...headers,
    'X-Client-Time': new Date().toISOString(),
  }
}

export default {
  getServerTime,
  getClientTime,
  calculateClockSkew,
  isTimeValid,
  isTimeCritical,
  formatTimeError,
  initializeTimeSync,
  addClientTimeHeader,
  CLOCK_SKEW_TOLERANCE_SECONDS,
  CRITICAL_SKEW_THRESHOLD,
  TIMEZONE,
  TIMEZONE_OFFSET_HOURS,
}
