import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import adminApi from '../services/adminApi'
import Crown from '../components/shared/Crown'
import { useEntrance, useCountUp } from '../lib/anim'

function StatCard({ label, value, prefix = '', sub, accent = '#E8C88A', loading, to }) {
  const navigate = useNavigate()
  const display = useCountUp(loading ? 0 : value)
  return (
    <div
      className="p-5 relative overflow-hidden transition-all duration-200"
      style={{ background: '#2A1200', border: '1px solid rgba(61,32,0,0.8)', cursor: to ? 'pointer' : 'default' }}
      onClick={() => to && navigate(to)}
      onMouseEnter={e => { if (to) e.currentTarget.style.borderColor = '#B8752A' }}
      onMouseLeave={e => { if (to) e.currentTarget.style.borderColor = 'rgba(61,32,0,0.8)' }}
    >
      <div className="absolute -top-2 -right-2 opacity-[0.04] pointer-events-none">
        <Crown size={70} color="#E8C88A" />
      </div>
      <p className="text-[10px] font-semibold text-muted uppercase tracking-[0.25em] mb-2">{label}</p>
      {loading
        ? <div className="h-8 w-24 skeleton rounded mb-1" style={{ background: '#3D2000' }} />
        : <p className="font-serif font-bold text-3xl mb-1 leading-none tabular-nums" style={{ color: accent }}>
            {prefix}{Math.round(display).toLocaleString()}
          </p>
      }
      {sub && <p className="text-muted text-xs">{sub}</p>}
      {to && <p className="text-[10px] mt-2 opacity-50" style={{ color: accent }}>View →</p>}
    </div>
  )
}

function SparkBars({ data }) {
  const max = Math.max(...data.map(d => parseFloat(d.total) || 0), 1)
  return (
    <div className="flex items-end gap-1.5" style={{ height: '80px' }}>
      {data.map((d, i) => {
        const h = Math.max(3, ((parseFloat(d.total) || 0) / max) * 76)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full transition-all duration-500"
              style={{ height: `${h}px`, background: '#B8752A', opacity: 0.4 + (i / data.length) * 0.6 }} />
            <span className="text-[9px] hidden md:block" style={{ color: '#8C7355' }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function TierBadge({ tier }) {
  const c = { Crown: '#E8C88A', Reserve: '#B8752A', Classic: '#8C7355' }[tier] || '#8C7355'
  return <span className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider" style={{ color: c, background: `${c}18` }}>{tier || 'Classic'}</span>
}

function OrderStatusBadge({ status }) {
  const map = {
    pending:        '#E8C88A',
    freshly_kneaded:'#60a5fa',
    ovenbound:      '#fb923c',
    on_the_cart:    '#a78bfa',
    en_route:       '#D4A574',
    delivered:      '#4ade80',
    cancelled:      '#f87171',
  }
  const color = map[status] || '#8C7355'
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider"
      style={{ color, background: `${color}18` }}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [summary,      setSummary]      = useState(null)
  const [topCustomers, setTopCustomers] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [pendingCards, setPendingCards] = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.get('/admin/analytics/summary').catch(() => ({ data: {} })),
      adminApi.get('/admin/analytics/top-customers').catch(() => ({ data: { customers: [] } })),
      adminApi.get('/admin/orders?limit=6').catch(() => ({ data: { orders: [] } })),
      adminApi.get('/admin/loyalty?status=pending').catch(() => ({ data: { cards: [] } })),
    ]).then(([s, tc, ro, lc]) => {
      setSummary(s.data.summary || s.data || {})
      setTopCustomers(tc.data.customers || [])
      setRecentOrders(ro.data.orders || [])
      setPendingCards(lc.data.cards || [])
    }).finally(() => setLoading(false))
  }, [])

  const sparkData = summary?.revenue_7d || []
  const containerRef = useEntrance([loading], { delay: 80 })

  return (
    <div ref={containerRef} className="space-y-5 max-w-[1400px]">

      {/* Stat cards — all clickable */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total Revenue" loading={loading}
          value={Number(summary?.total_revenue || 0)} prefix="UGX "
          sub="All time" accent="#E8C88A" to="/orders" />
        <StatCard label="Orders Today" loading={loading}
          value={Number(summary?.orders_today || 0)}
          sub="New orders" accent="#B8752A" to="/orders" />
        <StatCard label="Customers" loading={loading}
          value={Number(summary?.total_customers || 0)}
          sub="Accounts" accent="#D4A574" />
        <StatCard label="Newsletter" loading={loading}
          value={Number(summary?.newsletter_count || 0)}
          sub="Subscribers" accent="#8C7355" to="/newsletter" />
      </div>

      {/* Revenue + Pending loyalty */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-5 md:p-6" style={{ background: '#2A1200', border: '1px solid rgba(61,32,0,0.8)' }}>
          <div className="flex items-start justify-between mb-5 flex-wrap gap-2">
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-[0.25em] mb-1">Revenue — Last 7 Days</p>
              <p className="font-serif font-bold text-2xl leading-none" style={{ color: '#E8C88A' }}>
                {loading ? '—' : `UGX ${Number(summary?.revenue_7d_total||0).toLocaleString()}`}
              </p>
            </div>
          </div>
          {!loading && sparkData.length > 0 && <SparkBars data={sparkData} />}
          {loading && <div className="h-20 skeleton rounded" style={{ background: '#3D2000' }} />}
        </div>

        {/* Pending loyalty */}
        <div className="p-5" style={{ background: '#2A1200', border: '1px solid rgba(61,32,0,0.8)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Crown size={13} color="#B8752A" />
            <p className="text-[10px] font-semibold text-muted uppercase tracking-[0.25em] flex-1">Loyalty — Pending</p>
            {pendingCards.length > 0 && (
              <Link to="/loyalty" className="text-[10px] hover:underline" style={{ color: '#B8752A', textDecoration: 'none' }}>
                Review All →
              </Link>
            )}
          </div>
          {loading ? <div className="h-20 skeleton rounded" style={{ background: '#3D2000' }} /> :
            pendingCards.length === 0 ? (
              <p className="text-sm" style={{ color: '#8C7355' }}>No pending applications.</p>
            ) : (
              <div className="space-y-3">
                {pendingCards.slice(0,5).map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: '#F2EAD8' }}>{c.full_name}</p>
                      <p className="text-[10px]" style={{ color: '#8C7355' }}>{c.email}</p>
                    </div>
                    <Link to="/loyalty" className="text-[10px] hover:underline flex-shrink-0" style={{ color: '#E8C88A', textDecoration: 'none' }}>
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* Top customers + Recent orders */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Top customers — internal only */}
        <div style={{ background: '#2A1200', border: '1px solid rgba(61,32,0,0.8)', overflow: 'hidden' }}>
          <div className="flex items-center gap-2 px-4 md:px-5 py-4" style={{ borderBottom: '1px solid rgba(61,32,0,0.8)' }}>
            <Crown size={12} color="#B8752A" />
            <p className="text-[10px] font-semibold text-muted uppercase tracking-[0.25em] flex-1">Top Customers</p>
            <span className="text-[9px] px-1.5 py-0.5" style={{ color: '#3D2000', background: 'rgba(61,32,0,0.5)' }}>Internal only</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(61,32,0,0.8)' }}>
                  {['#','Customer','Orders','Spent'].map(h => (
                    <th key={h} className="px-3 md:px-4 py-2.5 text-left text-[9px] font-semibold text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array(4).fill(null).map((_,i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(61,32,0,0.5)' }}>
                    {Array(4).fill(null).map((__,j) => <td key={j} className="px-4 py-3"><div className="h-2.5 rounded skeleton" style={{ background: '#3D2000', width:'75%' }} /></td>)}
                  </tr>
                )) : topCustomers.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}>
                    <td className="px-3 md:px-4 py-3 text-xs tabular-nums" style={{ color: '#8C7355' }}>{i+1}</td>
                    <td className="px-3 md:px-4 py-3">
                      <p className="text-xs font-medium" style={{ color: '#F2EAD8' }}>{c.full_name || `${c.first_name} ${c.last_name}`}</p>
                      <p className="text-[10px] truncate max-w-[120px]" style={{ color: '#8C7355' }}>{c.email}</p>
                    </td>
                    <td className="px-3 md:px-4 py-3 text-xs tabular-nums" style={{ color: '#F2EAD8' }}>{c.order_count}</td>
                    <td className="px-3 md:px-4 py-3 text-xs font-medium tabular-nums" style={{ color: '#E8C88A' }}>
                      {Number(c.total_spent).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent orders — clickable rows */}
        <div style={{ background: '#2A1200', border: '1px solid rgba(61,32,0,0.8)', overflow: 'hidden' }}>
          <div className="flex items-center justify-between px-4 md:px-5 py-4" style={{ borderBottom: '1px solid rgba(61,32,0,0.8)' }}>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-[0.25em]">Recent Orders</p>
            <Link to="/orders" className="text-[10px] hover:underline" style={{ color: '#E8C88A', textDecoration: 'none' }}>View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(61,32,0,0.8)' }}>
                  {['Order','Customer','Total','Status'].map(h => (
                    <th key={h} className="px-3 md:px-4 py-2.5 text-left text-[9px] font-semibold text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array(5).fill(null).map((_,i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(61,32,0,0.5)' }}>
                    {Array(4).fill(null).map((__,j) => <td key={j} className="px-4 py-3"><div className="h-2.5 rounded skeleton" style={{ background: '#3D2000', width:'75%' }} /></td>)}
                  </tr>
                )) : recentOrders.map(o => (
                  <tr key={o.id}
                    className="cursor-pointer transition-all"
                    style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,117,42,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-3 md:px-4 py-3">
                      <p className="text-[10px] font-mono" style={{ color: '#E8C88A' }}>{o.order_number}</p>
                    </td>
                    <td className="px-3 md:px-4 py-3 text-xs" style={{ color: '#F2EAD8' }}>{o.first_name} {o.last_name}</td>
                    <td className="px-3 md:px-4 py-3 text-xs tabular-nums" style={{ color: '#F2EAD8' }}>{Number(o.total).toLocaleString()}</td>
                    <td className="px-3 md:px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
