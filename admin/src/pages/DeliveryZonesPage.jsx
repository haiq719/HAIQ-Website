import { useState, useEffect } from 'react'
import adminApi from '../services/adminApi'
import Button from '../components/shared/Button'
import { PageShell, PageHeader, Card, EmptyState } from '../components/shared/ui'
import { usePop } from '../lib/anim'
import { MapPin, Plus, Pencil, Trash2, CheckCircle2, CircleOff, AlertTriangle, X, Info } from 'lucide-react'

function ZoneModal({ mode, form, setForm, err, saving, onClose, onSave }) {
  const popRef = usePop()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div ref={popRef} className="w-full max-w-sm rounded-xl overflow-hidden" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.3)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #3D2000' }}>
          <div className="flex items-center gap-2">
            <MapPin size={15} style={{ color: '#B8752A' }} />
            <h2 className="font-serif font-bold text-lg" style={{ color: '#F2EAD8' }}>{mode === 'new' ? 'Add Zone' : 'Edit Zone'}</h2>
          </div>
          <button onClick={onClose} className="hover:opacity-60 transition" style={{ color: '#8C7355' }}><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>Zone Name</label>
            <input className="admin-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Muyenga" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>Delivery Fee (UGX)</label>
            <input type="number" className="admin-input" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="5000" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>Sort Order (display position)</label>
            <input type="number" className="admin-input" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} placeholder="1" />
          </div>
          {err && <p className="text-xs flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertTriangle size={13} /> {err}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #3D2000' }}>
          <Button onClick={onClose} variant="muted" size="sm">Cancel</Button>
          <Button onClick={onSave} disabled={saving} loading={saving} variant="primary" size="sm">Save Zone</Button>
        </div>
      </div>
    </div>
  )
}

export default function DeliveryZonesPage() {
  const [zones,   setZones]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState({ name: '', price: '', sort_order: '' })
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState(null)

  const load = () => {
    setLoading(true)
    adminApi.get('/admin/delivery-zones')
      .then(r => setZones(r.data.zones || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openNew  = () => { setForm({ name: '', price: '', sort_order: zones.length + 1 }); setErr(null); setModal('new') }
  const openEdit = (z) => { setForm({ name: z.name, price: z.price, sort_order: z.sort_order }); setErr(null); setModal(z) }

  const save = async () => {
    if (!form.name.trim() || !form.price) { setErr('Name and price are required.'); return }
    setSaving(true); setErr(null)
    try {
      if (modal === 'new') {
        await adminApi.post('/admin/delivery-zones', { name: form.name.trim(), price: parseFloat(form.price), sort_order: parseInt(form.sort_order) || 99 })
      } else {
        await adminApi.put(`/admin/delivery-zones/${modal.id}`, { name: form.name.trim(), price: parseFloat(form.price), sort_order: parseInt(form.sort_order) || modal.sort_order })
      }
      load(); setModal(null)
    } catch (e) { setErr(e.response?.data?.error || 'Failed.') }
    finally { setSaving(false) }
  }

  const toggle = async (z) => {
    try { await adminApi.put(`/admin/delivery-zones/${z.id}`, { is_active: !z.is_active }); load() } catch {}
  }
  const del = async (z) => {
    if (!confirm(`Delete zone "${z.name}"? This cannot be undone.`)) return
    try { await adminApi.delete(`/admin/delivery-zones/${z.id}`); load() } catch {}
  }

  return (
    <PageShell deps={[loading]} max="800px">
      <PageHeader label="Logistics" title="Delivery Zones" icon={MapPin} actions={
        <Button onClick={openNew} variant="primary" size="sm"><Plus size={14} /> Add Zone</Button>
      } />

      <Card className="!py-3 flex items-start gap-3" style={{ background: 'rgba(184,117,42,0.06)', borderColor: 'rgba(184,117,42,0.2)' }}>
        <Info size={16} style={{ color: '#B8752A', flexShrink: 0, marginTop: 2 }} />
        <p className="text-sm leading-relaxed" style={{ color: '#8C7355' }}>
          Set delivery fees per area. Customers select their zone at checkout — the fee is added to their order total automatically.
        </p>
      </Card>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 rounded skeleton" style={{ background: '#3D2000' }} />)}</div>
        ) : zones.length === 0 ? (
          <EmptyState icon={MapPin} title="No zones configured" sub="Add your first delivery zone to start charging fees." />
        ) : (
          <div className="overflow-x-auto admin-scroll">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #3D2000' }}>
                  {['#','Zone Name','Delivery Fee','Status',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#8C7355' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map(z => (
                  <tr key={z.id} className="transition-colors" style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,117,42,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#8C7355' }}>{z.sort_order}</td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: '#F2EAD8' }}>{z.name}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: '#B8752A' }}>UGX {Number(z.price).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(z)} className="admin-pill" title="Toggle"
                        style={z.is_active ? { color: '#4ade80', background: 'rgba(74,222,128,0.12)' } : { color: '#8C7355', background: 'rgba(140,115,85,0.12)' }}>
                        {z.is_active ? <><CheckCircle2 size={11} /> Active</> : <><CircleOff size={11} /> Off</>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(z)} className="inline-flex items-center gap-1 text-[10px] hover:underline" style={{ color: '#B8752A' }}><Pencil size={12} /> Edit</button>
                        <button onClick={() => del(z)} className="inline-flex items-center gap-1 text-[10px] hover:underline" style={{ color: '#f87171' }}><Trash2 size={12} /> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal && (
        <ZoneModal mode={modal === 'new' ? 'new' : 'edit'} form={form} setForm={setForm} err={err} saving={saving}
          onClose={() => setModal(null)} onSave={save} />
      )}
    </PageShell>
  )
}
