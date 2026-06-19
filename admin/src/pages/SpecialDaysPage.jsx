import { useState, useEffect } from 'react'
import adminApi from '../services/adminApi'
import Button from '../components/shared/Button'
import { PageShell, PageHeader, Card, Pill, EmptyState } from '../components/shared/ui'
import { CalendarHeart, Plus, Trash2, CheckCircle2, CircleOff, AlertTriangle, Info } from 'lucide-react'

export default function SpecialDaysPage() {
  const [days,      setDays]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')
  const [label,     setLabel]     = useState('')
  const [adding,    setAdding]    = useState(false)
  const [err,       setErr]       = useState(null)

  const load = () => {
    adminApi.get('/admin/special-days')
      .then(r => setDays(r.data.days || []))
      .catch(() => setErr('Could not load special days. Refresh to try again.'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!dateFrom || !dateTo || !label.trim()) { setErr('Date range and label are required.'); return }
    if (new Date(dateTo) < new Date(dateFrom)) { setErr('End date must be on or after start date.'); return }
    setAdding(true); setErr(null)
    try {
      await adminApi.post('/admin/special-days', { label: label.trim(), date_from: dateFrom, date_to: dateTo })
      setDateFrom(''); setDateTo(''); setLabel('')
      load()
    } catch (e) {
      const data = e.response?.data
      setErr(data?.details?.[0]?.message || data?.error || 'Failed to save. Please try again.')
    }
    finally { setAdding(false) }
  }

  const toggle = async (id) => {
    try { await adminApi.patch(`/admin/special-days/${id}/toggle`); load() }
    catch { setErr('Could not update status. Please try again.') }
  }

  const del = async (id) => {
    if (!confirm('Delete this special day?')) return
    try { await adminApi.delete(`/admin/special-days/${id}`); load() }
    catch { setErr('Could not delete. Please try again.') }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <PageShell deps={[loading]} max="760px">
      <PageHeader label="Pricing" title="Special Days" icon={CalendarHeart} />

      <Card className="!py-3 flex items-start gap-3" style={{ background: 'rgba(184,117,42,0.06)', borderColor: 'rgba(184,117,42,0.2)' }}>
        <Info size={16} style={{ color: '#B8752A', flexShrink: 0, marginTop: 2 }} />
        <p className="text-sm leading-relaxed" style={{ color: '#8C7355' }}>
          Special days make Build Your Box available at the discounted price of <strong style={{ color: '#E8C88A' }}>UGX 40,000</strong>.
          Outside of these days it reverts to <strong style={{ color: '#F2EAD8' }}>UGX 80,000</strong>.
        </p>
      </Card>

      {/* Add form */}
      <Card>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] mb-4 flex items-center gap-1.5" style={{ color: '#8C7355' }}>
          <Plus size={12} /> Add Special Day
        </p>
        <div className="flex gap-3 flex-wrap">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="admin-input" style={{ minWidth: '150px', width: 'auto' }} />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="admin-input" style={{ minWidth: '150px', width: 'auto' }} />
          <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Valentine's Day" className="admin-input flex-1" style={{ minWidth: '160px' }} />
          <Button onClick={add} disabled={adding} loading={adding} variant="primary" size="sm"><Plus size={14} /> Add</Button>
        </div>
        {err && <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertTriangle size={13} /> {err}</p>}
      </Card>

      {/* List */}
      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 skeleton rounded" style={{ background: '#3D2000' }} />)}</div>
        ) : days.length === 0 ? (
          <EmptyState icon={CalendarHeart} title="No special days yet" sub="Add a date range above to enable discounted Box pricing." />
        ) : (
          <div className="overflow-x-auto admin-scroll">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #3D2000' }}>
                  {['Date From','Date To','Label','Status',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#8C7355' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map(d => {
                  const isToday = today >= d.date_from && today <= d.date_to
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#F2EAD8' }}>{d.date_from}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#F2EAD8' }}>{d.date_to}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: isToday ? '#E8C88A' : '#F2EAD8' }}>
                        {d.label}
                        {isToday && <span className="ml-2"><Pill color="#E8C88A">Today</Pill></span>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggle(d.id)} className="admin-pill" title="Toggle"
                          style={d.is_active ? { color: '#4ade80', background: 'rgba(74,222,128,0.12)' } : { color: '#8C7355', background: 'rgba(140,115,85,0.12)' }}>
                          {d.is_active ? <><CheckCircle2 size={11} /> Active</> : <><CircleOff size={11} /> Inactive</>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => del(d.id)} className="inline-flex items-center gap-1 text-[10px] hover:opacity-70 transition" style={{ color: '#f87171' }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageShell>
  )
}
