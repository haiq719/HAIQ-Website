import { AlertTriangle } from 'lucide-react'
import { CLOCK_SKEW_TOLERANCE_SECONDS, CRITICAL_SKEW_THRESHOLD, formatSkewTime } from '../utils/timeSync'

/**
 * TimeWarning Component
 * Shows when device clock is off by 5–60 minutes (300s–3600s)
 *
 * Props:
 * - skewSeconds: Number - clock skew in seconds
 * - isVisible: Boolean - whether to show the warning
 * - onRefresh: Function - callback to refresh time check
 */
export default function TimeWarning({ skewSeconds = 0, isVisible = false, onRefresh }) {
  // Don't show if explicitly hidden or if skew is in safe zone
  if (!isVisible || skewSeconds <= CLOCK_SKEW_TOLERANCE_SECONDS) {
    return null
  }

  const skewDisplay = formatSkewTime(skewSeconds)
  const isCritical = skewSeconds > CRITICAL_SKEW_THRESHOLD

  return (
    <div
      className="mb-6 p-4 rounded-sm border-l-4 flex gap-3 items-start"
      style={{
        background: isCritical
          ? 'rgba(248, 113, 113, 0.1)' // Red at 10% for critical
          : 'rgba(184, 117, 42, 0.1)', // Amber at 10% for warning
        borderColor: isCritical ? '#f87171' : '#B8752A',
      }}
      role="alert"
    >
      <AlertTriangle
        size={16}
        strokeWidth={1.5}
        style={{
          color: isCritical ? '#f87171' : '#B8752A',
          flexShrink: 0,
          marginTop: '2px',
        }}
        aria-hidden="true"
      />
      <div className="flex-1">
        <p
          className="text-sm font-semibold"
          style={{ color: isCritical ? '#f87171' : '#B8752A' }}
        >
          {isCritical ? 'Critical Time Mismatch' : 'Device Time Mismatch'}
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: '#8C7355' }}
        >
          Your device time is off by {skewDisplay}. Please sync your date and time
          settings to ensure orders process correctly.
        </p>
        <p
          className="text-[11px] mt-2 opacity-70"
          style={{ color: '#8C7355' }}
        >
          Settings → Date & Time → Sync automatically
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-2 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: '#B8752A' }}
          >
            Refresh time check
          </button>
        )}
      </div>
    </div>
  )
}
