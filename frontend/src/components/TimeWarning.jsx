/**
 * TimeWarning Component
 * Displays warning banner when user's system time is incorrect
 * Helps users understand time validation failures
 */

import { AlertCircle, Clock } from 'lucide-react'
import { CLOCK_SKEW_TOLERANCE_SECONDS, CRITICAL_SKEW_THRESHOLD, formatTimeError } from '../utils/timeSync'

export default function TimeWarning({ skewSeconds, isVisible, onRefresh, variant = 'warning' }) {
  if (!isVisible || !skewSeconds) return null

  // Determine warning type and styling
  const isError = skewSeconds > CRITICAL_SKEW_THRESHOLD
  const isWarning = skewSeconds > CLOCK_SKEW_TOLERANCE_SECONDS && !isError

  if (!isError && !isWarning) return null

  const bgColor = isError ? 'rgba(248, 113, 113, 0.15)' : 'rgba(232, 200, 138, 0.15)'
  const borderColor = isError ? '#f87171' : '#E8C88A'
  const textColor = isError ? '#f87171' : '#E8C88A'
  const iconColor = isError ? '#f87171' : '#B8752A'

  const message = formatTimeError(skewSeconds)
  const title = isError ? 'System Time Error' : 'Time Mismatch Detected'

  return (
    <div
      className="p-4 rounded-lg border mb-4"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 pt-0.5">
          {isError ? (
            <AlertCircle size={20} strokeWidth={2} style={{ color: iconColor }} />
          ) : (
            <Clock size={20} strokeWidth={2} style={{ color: iconColor }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1" style={{ color: textColor }}>
            {title}
          </h3>
          <p className="text-sm text-light/60 mb-3">{message}</p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="text-xs px-3 py-1.5 rounded font-semibold transition-colors"
              style={{
                background: textColor,
                color: '#1A0A00',
              }}
              onMouseEnter={(e) => (e.target.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.target.style.opacity = '1')}
            >
              Check Again
            </button>

            {!isError && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  // Show system settings link info
                  alert('Please go to your device Settings → Date & Time to correct your system time.')
                }}
                className="text-xs px-3 py-1.5 rounded font-semibold transition-colors"
                style={{
                  background: 'transparent',
                  border: `1px solid ${textColor}`,
                  color: textColor,
                }}
              >
                Fix Time
              </a>
            )}
          </div>

          {isError && (
            <p className="text-xs mt-3 text-light/40">
              Orders are blocked until your system time is corrected. This prevents inconsistencies in our system.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
