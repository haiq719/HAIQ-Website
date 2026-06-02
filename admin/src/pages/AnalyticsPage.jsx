// AnalyticsPage.jsx
import { useEffect, useState } from 'react'
import adminApi from '../services/adminApi'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import {
  BarChart3, MapPin, Gift, Users, Trophy, Package, TrendingUp, AlertCircle, CalendarDays,
} from 'lucide-react'

const TIER_COLOR = { Crown: '#E8C88A', Reserve: '#B8752A', Classic: '#8C7355' }
const PIE_COLORS = ['#B8752A', '#D4A574', '#8C7355', '#7A3B1E']
const HEATMAP_COLORS = ['#F2EAD8', '#E8C88A', '#D4A574', '#B8752A', '#8C7355', '#5A4A3A', '#3D2000']

const fmt    = n => Number(n || 0).toLocaleString()
const fmtDay = s => {
  const d = new Date(s)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function SectionHeader({ label, title }) {
  return (
    <div className="mb-4">
      <p className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase mb-1">{label}</p>
      <h2 className="font-serif font-bold text-light text-xl">{title}</h2>
    </div>
  )
}

function IconLabel({ icon, text }) {
  return (
    <div className="flex items-center gap-1.5 mb-3" style={{ color: '#8C7355' }}>
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <p className="text-[10px]">{text}</p>
    </div>
  )
}

function KPICard({ label, value, change, icon }) {
  const isPositive = change > 0
  return (
    <div className="admin-card p-4">
      <div className="flex items-start justify-between mb-3">
        <p className="text-light/50 text-[10px] font-semibold uppercase tracking-widest">{label}</p>
        <p className="text-xl">{icon}</p>
      </div>
      <p className="font-serif font-bold text-light text-2xl mb-2">{fmt(value)}</p>
      {change !== null && (
        <p className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(change)}% vs last week
        </p>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const [summary,              setSummary]              = useState(null)
  const [revenue,              setRevenue]              = useState([])
  const [statusBreak,          setStatusBreak]          = useState([])
  const [topCustomers,         setTopCustomers]         = useState([])
  const [topProducts,          setTopProducts]          = useState([])
  const [zones,                setZones]                = useState([])
  const [customerTiers,        setCustomerTiers]        = useState([])
  const [heatmapData,          setHeatmapData]          = useState([])
  const [specialDaysData,      setSpecialDaysData]      = useState(null)
  const [customerGrowthData,   setCustomerGrowthData]   = useState([])
  const [loading,              setLoading]              = useState(true)
  const [expandedAccordion,    setExpandedAccordion]    = useState(false)
  const [isMobile,             setIsMobile]             = useState(window.innerWidth < 768)

  // Handle product image loading with retry limit (max 3 attempts)
  const handleProductImageError = (e, productName) => {
    const img = e.target
    const currentRetries = parseInt(img.dataset.retries || '0')

    console.log(`Image load failed for ${productName}. Attempt ${currentRetries + 1}/3`)

    if (currentRetries < 3) {
      // Increment retry counter and retry with fallback
      img.dataset.retries = currentRetries + 1
      img.src = '/default-product.png'
    } else {
      // Max retries reached - hide image and show placeholder
      img.style.display = 'none'
      const parent = img.parentElement

      // Create placeholder div with Package icon
      const placeholder = document.createElement('div')
      placeholder.className = 'w-full h-32 rounded mb-3 flex items-center justify-center'
      placeholder.style.background = 'rgba(140, 115, 85, 0.1)'
      placeholder.style.border = '1px dashed rgba(140, 115, 85, 0.3)'

      const iconDiv = document.createElement('div')
      iconDiv.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8C7355" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>`

      placeholder.appendChild(iconDiv)
      parent.insertBefore(placeholder, img.nextSibling)
    }
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    Promise.all([
      adminApi.get('/admin/analytics/summary'),
      adminApi.get('/admin/analytics/revenue'),
      adminApi.get('/admin/analytics/orders-by-status'),
      adminApi.get('/admin/analytics/top-customers'),
      adminApi.get('/admin/analytics/top-products'),
      adminApi.get('/admin/analytics/zone-breakdown'),
      adminApi.get('/admin/analytics/customer-tiers'),
      adminApi.get('/admin/analytics/heatmap'),
      adminApi.get('/admin/analytics/special-days-impact'),
      adminApi.get('/admin/analytics/customer-growth'),
    ]).then(([
      summ, rev, stat, cust, prod, zo, tiers, heat, special, growth
    ]) => {
      setSummary(summ.data.summary || null)
      setRevenue(rev.data.data || [])
      setStatusBreak(stat.data.data || [])
      setTopCustomers(cust.data.customers || [])
      setTopProducts(prod.data.products || [])
      setZones(zo.data.zones || [])
      setCustomerTiers(tiers.data.tiers || [])
      setHeatmapData(heat.data.data || [])
      setSpecialDaysData(special.data || null)
      setCustomerGrowthData(growth.data.data || [])
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-surface border border-border px-4 py-2.5 rounded text-xs">
        <p className="text-light/50 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name?.includes('revenue') ? `UGX ${fmt(p.value)}` : p.value}
          </p>
        ))}
      </div>
    )
  }

  const getHeatmapColor = (orderCount) => {
    const maxOrders = heatmapData.reduce((max, d) => Math.max(max, d.order_count), 1)
    const ratio = orderCount / maxOrders
    return HEATMAP_COLORS[Math.floor(ratio * (HEATMAP_COLORS.length - 1))]
  }

  const heatmapGrid = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const hours = ['00–04', '04–08', '08–12', '12–16', '16–20', '20–24']
    const grid = {}
    heatmapData.forEach(d => {
      const daysIndex = d.day_of_week === 0 ? 6 : d.day_of_week - 1
      const hourBucket = Math.floor(d.hour_of_day / 4)
      const key = `${daysIndex}-${hourBucket}`
      grid[key] = d.order_count
    })
    return { days, hours, grid }
  })()

  if (loading) return (
    <div className="space-y-6">
      {Array(3).fill(null).map((_, i) => (
        <div key={i} className="h-48 skeleton-dark rounded-lg" />
      ))}
    </div>
  )

  return (
    <div className="space-y-10">

      {/* Page header */}
      <div>
        <p className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase mb-1">Insights</p>
        <h1 className="font-serif font-bold text-light text-3xl">Analytics</h1>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="Total Orders"
            value={summary.total_orders}
            change={null}
            icon={<Package size={18} strokeWidth={1.5} style={{ color: '#B8752A' }} />}
          />
          <KPICard
            label="Product Revenue"
            value={summary.product_revenue}
            change={null}
            icon={<BarChart3 size={18} strokeWidth={1.5} style={{ color: '#B8752A' }} />}
          />
          <KPICard
            label="Active Orders"
            value={summary.active_orders}
            change={null}
            icon={<TrendingUp size={18} strokeWidth={1.5} style={{ color: '#B8752A' }} />}
          />
          <KPICard
            label="Total Customers"
            value={summary.total_customers}
            change={summary.weekly_change_pct}
            icon={<Users size={18} strokeWidth={1.5} style={{ color: '#B8752A' }} />}
          />
        </div>
      )}

      {/* Customer Tiers Breakdown */}
      {customerTiers.length > 0 && (
        <div className="admin-card">
          <SectionHeader label="Loyalty" title="Customer Tiers" />
          <p className="text-[10px] mb-4" style={{ color: '#8C7355' }}>
            Classic = Not yet approved • Reserve = Approved member • Crown = Premium member
          </p>
          <div className="grid grid-cols-3 gap-3">
            {customerTiers.map(tier => (
              <div
                key={tier.loyalty_tier}
                className="p-4 rounded text-center border"
                style={{
                  background: tier.loyalty_tier === 'Crown' ? 'rgba(232,200,138,0.1)' :
                             tier.loyalty_tier === 'Reserve' ? 'rgba(184,117,42,0.1)' :
                             'rgba(140,115,85,0.1)',
                  border: `1px solid ${tier.loyalty_tier === 'Crown' ? '#E8C88A' :
                                       tier.loyalty_tier === 'Reserve' ? '#B8752A' :
                                       '#8C7355'}`,
                }}
              >
                <p className="text-xs font-bold mb-2" style={{ color: '#8C7355' }}>
                  {tier.loyalty_tier.toUpperCase()}
                </p>
                <p
                  className="font-serif font-bold text-3xl mb-2"
                  style={{
                    color: tier.loyalty_tier === 'Crown' ? '#E8C88A' :
                           tier.loyalty_tier === 'Reserve' ? '#B8752A' :
                           '#8C7355',
                  }}
                >
                  {tier.tier_count}
                </p>
                <p className="text-[10px]" style={{ color: '#8C7355' }}>
                  Avg: UGX {fmt(tier.avg_spent)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue chart — dual lines */}
      <div className="admin-card">
        <SectionHeader label="Last 30 Days" title="Revenue Breakdown" />
        <IconLabel icon={<BarChart3 size={13} strokeWidth={1.5}/>} text="Product vs Delivery revenue" />
        {revenue.length === 0 ? (
          <div className="flex items-center justify-center h-64 rounded"
            style={{ background: '#2A1200', border: '1px solid #3D2000' }}>
            <div className="text-center">
              <BarChart3 size={32} strokeWidth={1.5} style={{ color: '#8C7355', margin: '0 auto 12px' }} />
              <p style={{ color: '#8C7355' }} className="text-sm">
                No revenue data available for the selected period
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
            <LineChart data={revenue} margin={{ left: 0, right: 8 }}>
              <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fill: '#8C7355', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#8C7355', fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={36} />
              <Tooltip content={customTooltip} />
              <Line type="monotone" dataKey="product_revenue" stroke="#B8752A" strokeWidth={2.5}
                dot={false} activeDot={{ r: 5, fill: '#B8752A' }} name="product_revenue" />
              <Line type="monotone" dataKey="delivery_revenue" stroke="#8C7355" strokeWidth={2}
                strokeDasharray="5 5" dot={false} activeDot={{ r: 5, fill: '#8C7355' }} name="delivery_revenue" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Zone Distribution */}
        <div className="admin-card">
          <SectionHeader label="By Location" title="Zone Distribution" />
          <IconLabel icon={<MapPin size={13} strokeWidth={1.5}/>} text="Zones with active orders" />
          {zones.length === 0 ? (
            <p className="text-light/30 text-sm py-4">No zone data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 220}>
              <PieChart>
                <Pie data={zones} dataKey="order_count" nameKey="zone_name"
                  cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2}>
                  {zones.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(v) => <span style={{ color: '#F2EAD8', fontSize: 10 }}>{v}</span>}
                />
                <Tooltip content={customTooltip} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by status */}
        <div className="admin-card">
          <SectionHeader label="Breakdown" title="Orders by Status" />
          <IconLabel icon={<TrendingUp size={13} strokeWidth={1.5}/>} text="Current order distribution" />
          {statusBreak.length === 0 ? (
            <p className="text-light/30 text-sm py-4">No order data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
              <BarChart data={statusBreak} margin={{ left: -10 }}>
                <XAxis dataKey="status" tick={{ fill: '#8C7355', fontSize: 9 }}
                  tickLine={false} axisLine={false}
                  tickFormatter={s => s?.replace('_', '\n')} />
                <YAxis tick={{ fill: '#8C7355', fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                <Tooltip content={customTooltip} />
                <Bar dataKey="count" fill="#B8752A" radius={[3, 3, 0, 0]} name="orders" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Order Activity Heatmap */}
      <div className="admin-card">
        <SectionHeader label="Time Patterns" title="Order Activity Heatmap" />
        {heatmapData.length === 0 ? (
          <p className="text-light/30 text-sm py-4">No heatmap data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="p-1 text-light/30 font-semibold uppercase text-[8px]">Time</th>
                  {heatmapGrid.days.map(day => (
                    <th key={day} className="p-1 text-light/30 font-semibold uppercase text-[8px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapGrid.hours.map(hour => (
                  <tr key={hour}>
                    <td className="p-1 text-light/30 font-semibold text-[8px]">{hour}</td>
                    {heatmapGrid.days.map((day, dayIdx) => {
                      const hourBucket = heatmapGrid.hours.indexOf(hour)
                      const key = `${dayIdx}-${hourBucket}`
                      const count = heatmapGrid.grid[key] || 0
                      return (
                        <td
                          key={`${day}-${hour}`}
                          className="p-1 text-center rounded"
                          style={{
                            backgroundColor: getHeatmapColor(count),
                            color: count > 0 ? '#1A0A00' : '#F2EAD8',
                            fontSize: '10px',
                            fontWeight: 'bold',
                          }}
                          title={`${day} ${hour}: ${count} orders`}
                        >
                          {count > 0 ? count : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Special Days Impact & Customer Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Special Days Impact */}
        <div className="admin-card">
          <SectionHeader label="Comparison" title="Special Days Impact" />
          <IconLabel icon={<CalendarDays size={13} strokeWidth={1.5}/>} text="vs Normal days performance" />
          {specialDaysData ? (
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
              <BarChart data={[
                { name: 'Special Days', revenue: specialDaysData.special_days?.avg_revenue || 0, orders: specialDaysData.special_days?.avg_orders || 0 },
                { name: 'Normal Days', revenue: specialDaysData.normal_days?.avg_revenue || 0, orders: specialDaysData.normal_days?.avg_orders || 0 },
              ]} margin={{ left: -10 }}>
                <XAxis dataKey="name" tick={{ fill: '#8C7355', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#8C7355', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8C7355', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={customTooltip} />
                <Bar yAxisId="left" dataKey="revenue" fill="#B8752A" radius={[3, 3, 0, 0]} name="Avg Revenue (UGX)" />
                <Bar yAxisId="right" dataKey="orders" fill="#D4A574" radius={[3, 3, 0, 0]} name="Avg Orders" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-light/30 text-sm py-4">No special days data yet.</p>
          )}
        </div>

        {/* Customer Growth */}
        <div className="admin-card">
          <SectionHeader label="90 Days" title="Customer Growth" />
          <IconLabel icon={<Users size={13} strokeWidth={1.5}/>} text="Cumulative new signups" />
          {customerGrowthData.length === 0 ? (
            <p className="text-light/30 text-sm py-4">No customer data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
              <AreaChart data={customerGrowthData} margin={{ left: 0, right: 8 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B8752A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3D2000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fill: '#8C7355', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#8C7355', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={customTooltip} />
                <Area type="monotone" dataKey="cumulative" stroke="#B8752A" strokeWidth={2} fillOpacity={1} fill="url(#colorCumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="admin-card">
        <SectionHeader label="Sales" title="Top Cookies" />
        {topProducts.length === 0 ? (
          <p className="text-light/30 text-sm">No sales yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topProducts.map((p, i) => (
              <div key={p.id} className="p-4 rounded border" style={{ background: '#2A1200', border: '1px solid #3D2000' }}>
                {/* Product image */}
                <div className="mb-3 h-32 bg-black/30 rounded overflow-hidden flex items-center justify-center">
                  <img
                    src={p.image_url || '/default-product.png'}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    data-retries="0"
                    onError={(e) => handleProductImageError(e, p.name)}
                    onLoad={(e) => {
                      // Reset retry counter on successful load
                      e.target.dataset.retries = '0'
                    }}
                  />
                </div>

                {/* Best Seller Badge */}
                {i === 0 && (
                  <div className="inline-block px-2 py-1 text-xs rounded mb-2 font-bold flex items-center gap-1.5" style={{ background: '#B8752A', color: '#1A0A00' }}>
                    <Trophy size={12} strokeWidth={1.5} />
                    Best Seller
                  </div>
                )}

                {/* Product name */}
                <h4 className="font-bold mb-3 text-sm" style={{ color: '#F2EAD8' }}>{p.name}</h4>

                {/* Stats */}
                <div className="space-y-1">
                  <p className="text-xs flex items-center gap-1.5" style={{ color: '#8C7355' }}>
                    <Package size={11} strokeWidth={1.5} />
                    {fmt(p.units_sold)} units
                  </p>
                  <p className="text-xs font-semibold" style={{ color: '#B8752A' }}>
                    UGX {fmt(p.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* More Details Accordion */}
      <div className="admin-card border-l-2 border-haiq-gold/40">
        <button
          onClick={() => setExpandedAccordion(!expandedAccordion)}
          className="w-full text-left flex items-center justify-between hover:opacity-80 transition-opacity mb-4"
        >
          <div>
            <p className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase mb-1">Detailed</p>
            <h2 className="font-serif font-bold text-light text-xl">Zone Breakdown</h2>
          </div>
          <span className="text-xl" style={{ transform: expandedAccordion ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}>
            ▼
          </span>
        </button>

        {expandedAccordion && zones.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-light/30 text-[10px] uppercase tracking-widest border-b border-border">
                  <th className="text-left py-2 pr-4">#</th>
                  <th className="text-left py-2 pr-4">Zone Name</th>
                  <th className="text-left py-2 pr-4">Orders</th>
                  <th className="text-left py-2">Delivery Revenue</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z, i) => (
                  <tr key={z.zone_name} className="border-b border-border/40 hover:bg-surface/40 transition-colors">
                    <td className="py-3 pr-4 text-primary/40 font-serif font-bold">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3 pr-4 text-light font-medium">{z.zone_name}</td>
                    <td className="py-3 pr-4 text-light/50">{z.order_count}</td>
                    <td className="py-3 text-primary font-bold">UGX {fmt(z.delivery_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── TOP CUSTOMERS (admin-only — not visible on frontend) ──────────────── */}
      <div className="admin-card border-l-2 border-haiq-gold/40">
        <div className="flex items-start justify-between mb-4">
          <SectionHeader label="Internal — Admin Only" title="Top Customers" />
          <span className="text-[10px] bg-haiq-gold/10 text-haiq-gold border border-haiq-gold/30 px-2.5 py-1 rounded-full uppercase tracking-widest">
            👑 Hidden from customers
          </span>
        </div>
        <p className="text-light/30 text-xs mb-5 leading-relaxed">
          Use this list to identify loyal customers for gifting or personal outreach.
          This data is never surfaced on the customer-facing website.
        </p>

        {topCustomers.length === 0 ? (
          <p className="text-light/30 text-sm">No customer data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-light/30 text-[10px] uppercase tracking-widest border-b border-border">
                  <th className="text-left py-2 pr-4">#</th>
                  <th className="text-left py-2 pr-4">Name</th>
                  <th className="text-left py-2 pr-4">Email</th>
                  <th className="text-left py-2 pr-4">Tier</th>
                  <th className="text-left py-2 pr-4">Points</th>
                  <th className="text-left py-2 pr-4">Orders</th>
                  <th className="text-left py-2">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, i) => (
                  <tr key={c.id} className="border-b border-border/40 hover:bg-surface/40 transition-colors">
                    <td className="py-3 pr-4 text-primary/40 font-serif font-bold">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3 pr-4 text-light font-medium">{c.full_name}</td>
                    <td className="py-3 pr-4 text-light/40 text-xs">{c.email}</td>
                    <td className="py-3 pr-4">
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                        style={{
                          color:            TIER_COLOR[c.loyalty_tier] || '#8C7355',
                          backgroundColor:  `${TIER_COLOR[c.loyalty_tier] || '#8C7355'}20`,
                        }}
                      >
                        {c.loyalty_tier || 'Classic'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-haiq-gold font-semibold">
                      {fmt(c.loyalty_points)} pts
                    </td>
                    <td className="py-3 pr-4 text-light/50">{c.total_orders}</td>
                    <td className="py-3 text-primary font-bold">UGX {fmt(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
