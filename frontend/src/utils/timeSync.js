/**
 * Time Synchronisation Utility
 * Frontend clock skew detection and X-Client-Time header injection
 *
 * Purpose: Detect when a user's device time is incorrect and prevent
 * order submission if the clock is off by more than 1 hour.
 *
 * Thresholds:
 * - 300s (5 min): Show warning banner
 * - 3600s (1 hour): Block order submission
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Thresholds (match backend constants exactly)
export const CLOCK_SKEW_TOLERANCE_SECONDS = 300 // Show warning at 5 min
export const CRITICAL_SKEW_THRESHOLD = 3600 // Block orders at 1 hour

// Cache server time to avoid repeated requests
let cachedServerTime = null
let cacheTimestamp = null
const CACHE_DURATION_MS = 10000 // Refresh every 10 seconds

/**
 * Fetch server time from backend
 * Caches result for 10 seconds to avoid spamming the server
 */
export async function getServerTime() {
  const now = Date.now()

  // Return cached time if still fresh
  if (cachedServerTime && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION_MS) {
    return cachedServerTime
  }

  try {
    const res = await fetch(`${API_BASE}/v1/server-time`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      console.error('[TimeSync] Failed to fetch server time:', res.status)
      // Return client time as fallback
      return new Date()
    }

    const data = await res.json()
    cachedServerTime = new Date(data.server_time)
    cacheTimestamp = now

    return cachedServerTime
  } catch (error) {
    console.error('[TimeSync] Error fetching server time:', error)
    // Fail gracefully — return client time if server unreachable
    return new Date()
  }
}

/**
 * Get current client time
 */
export function getClientTime() {
  return new Date()
}

/**
 * Calculate absolute clock skew in seconds
 *
 * Can be called two ways:
 * - calculateClockSkew(serverDate, clientDate) - explicit dates
 * - calculateClockSkew() - uses cached server time from getServerTime()
 *
 * @param {Date} serverDate - Optional server time (if omitted, uses cached)
 * @param {Date} clientDate - Optional client time (if omitted, uses current time)
 * @returns {number} Absolute difference in seconds
 */
export function calculateClockSkew(serverDate, clientDate) {
  // If explicit dates provided, use them
  if (serverDate && clientDate) {
    const skewMs = Math.abs(serverDate.getTime() - clientDate.getTime())
    return Math.round(skewMs / 1000)
  }

  // Otherwise use cached server time
  if (!cachedServerTime) {
    return 0
  }

  const clientTime = new Date()
  const skewMs = Math.abs(clientTime.getTime() - cachedServerTime.getTime())
  return Math.round(skewMs / 1000) // Convert to seconds
}

/**
 * Check if time is valid within tolerance
 * @param {number} toleranceSeconds - Max acceptable skew in seconds
 * @returns {boolean} true if skew <= tolerance
 */
export function isTimeValid(toleranceSeconds = CRITICAL_SKEW_THRESHOLD) {
  return calculateClockSkew() <= toleranceSeconds
}

/**
 * Add X-Client-Time header to fetch request
 * Used by CheckoutPage when submitting orders
 *
 * Usage:
 * const headers = addClientTimeHeader({})
 * fetch(url, { method: 'POST', headers, body })
 */
export function addClientTimeHeader(headers = {}) {
  return {
    ...headers,
    'X-Client-Time': new Date().toISOString(),
  }
}

/**
 * Format skew for display
 */
export function formatSkewTime(seconds) {
  if (seconds < 60) {
    return `${seconds} seconds`
  }
  const minutes = Math.round(seconds / 60)
  return `${minutes} minutes`
}

export default {
  getServerTime,
  getClientTime,
  calculateClockSkew,
  isTimeValid,
  addClientTimeHeader,
  formatSkewTime,
  CLOCK_SKEW_TOLERANCE_SECONDS,
  CRITICAL_SKEW_THRESHOLD,
}
