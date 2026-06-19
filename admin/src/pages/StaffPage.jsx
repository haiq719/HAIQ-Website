import { useState, useEffect } from 'react'
import adminApi from '../services/adminApi'
import { useAdminAuth } from '../context/AdminAuthContext'
import { PageShell, PageHeader, Card, SectionHeader, Pill } from '../components/shared/ui'
import { usePop } from '../lib/anim'
import {
  Users, UserPlus, ShieldCheck, UserCheck, UserX,
  KeyRound, Pencil, X, Check, AlertTriangle, Clock
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function RolePill({ role }) {
  return role === 'superadmin'
    ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase"
        style={{ background: 'rgba(232,200,138,0.15)', color: '#E8C88A', border: '1px solid rgba(232,200,138,0.3)' }}>
        <ShieldCheck size={11} /> Superadmin
      </span>
    : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase"
        style={{ background: 'rgba(184,117,42,0.12)', color: '#B8752A', border: '1px solid rgba(184,117,42,0.25)' }}>
        <UserCheck size={11} /> Staff
      </span>
}

// ── Create / Edit modal ───────────────────────────────────────────────────────
function StaffModal({ member, onClose, onSave }) {
  const isEdit = !!member
  const ref = usePop({ y: 12, duration: 380 })

  const [fullName,  setFullName]  = useState(member?.full_name  ?? '')
  const [email,     setEmail]     = useState(member?.email      ?? '')
  const [role,      setRole]      = useState(member?.role       ?? 'staff')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState(null)
  const [saving,    setSaving]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!isEdit && password !== confirm) {
      return setError('Passwords do not match')
    }
    if (!isEdit && password.length < 8) {
      return setError('Password must be at least 8 characters')
    }

    setSaving(true)
    try {
      if (isEdit) {
        const { data } = await adminApi.patch(`/admin/staff/${member.id}`, { full_name: fullName, role })
        onSave(data.staff)
      } else {
        const { data } = await adminApi.post('/admin/staff', { email, full_name: fullName, role, password })
        onSave(data.staff)
      }
      onClose()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(14,6,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} className="w-full max-w-md rounded-xl p-6"
        style={{ background: '#2A1200', border: '1px solid #3D2000' }}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif font-bold text-lg" style={{ color: '#F2EAD8' }}>
            {isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button onClick={onClose} style={{ color: '#8C7355' }} className="hover:opacity-60 transition">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8C7355' }}>
              Full Name
            </label>
            <input
              value={fullName} onChange={e => setFullName(e.target.value)}
              required className="admin-input w-full" placeholder="e.g. Amara Nakato"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8C7355' }}>
                Email Address
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required className="admin-input w-full" placeholder="staff@haiq.ug"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8C7355' }}>
              Role
            </label>
            <select value={role} onChange={e => setRole(e.target.value)} className="admin-input w-full">
              <option value="staff">Staff</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8C7355' }}>
                  Temporary Password
                </label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required className="admin-input w-full" placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8C7355' }}>
                  Confirm Password
                </label>
                <input
                  type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  required className="admin-input w-full" placeholder="Repeat password"
                />
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
              <AlertTriangle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm rounded-lg transition hover:opacity-70"
              style={{ border: '1px solid #3D2000', color: '#8C7355' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#B8752A', color: '#1A0A00' }}>
              {saving ? 'Saving…' : <><Check size={14} /> {isEdit ? 'Save Changes' : 'Create Account'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Reset password modal ──────────────────────────────────────────────────────
function ResetModal({ member, onClose }) {
  const ref = usePop({ y: 12, duration: 380 })
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState(null)
  const [done,      setDone]      = useState(false)
  const [saving,    setSaving]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm)      return setError('Passwords do not match')
    if (password.length < 8)       return setError('Password must be at least 8 characters')

    setSaving(true)
    try {
      await adminApi.post(`/admin/staff/${member.id}/reset-password`, { new_password: password })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(14,6,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} className="w-full max-w-sm rounded-xl p-6"
        style={{ background: '#2A1200', border: '1px solid #3D2000' }}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif font-bold text-lg" style={{ color: '#F2EAD8' }}>Reset Password</h2>
          <button onClick={onClose} style={{ color: '#8C7355' }} className="hover:opacity-60 transition">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <Check size={20} style={{ color: '#22c55e' }} />
            </div>
            <p className="font-serif font-bold mb-1" style={{ color: '#F2EAD8' }}>Password reset</p>
            <p className="text-sm mb-5" style={{ color: '#8C7355' }}>
              Share the new password with {member.full_name} securely.
            </p>
            <button onClick={onClose}
              className="w-full py-2.5 text-sm rounded-lg font-semibold"
              style={{ background: '#B8752A', color: '#1A0A00' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm mb-2" style={{ color: '#8C7355' }}>
              Setting a new password for <span style={{ color: '#F2EAD8' }}>{member.full_name}</span>.
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8C7355' }}>
                New Password
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required className="admin-input w-full" placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8C7355' }}>
                Confirm Password
              </label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                required className="admin-input w-full" placeholder="Repeat password" />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                <AlertTriangle size={14} className="flex-shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm rounded-lg transition hover:opacity-70"
                style={{ border: '1px solid #3D2000', color: '#8C7355' }}>
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 text-sm rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#B8752A', color: '#1A0A00' }}>
                {saving ? 'Resetting…' : <><KeyRound size={14} /> Reset</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const { admin: me } = useAdminAuth()
  const isSuperAdmin  = me?.role === 'superadmin'

  const [staff,      setStaff]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null) // null | { type: 'create'|'edit'|'reset', member? }
  const [toasting,   setToasting]   = useState(null)

  const toast = (msg) => { setToasting(msg); setTimeout(() => setToasting(null), 3000) }

  useEffect(() => {
    adminApi.get('/admin/staff')
      .then(r => setStaff(r.data.staff))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = (saved) => {
    setStaff(prev => {
      const idx = prev.findIndex(s => s.id === saved.id)
      return idx >= 0 ? prev.map(s => s.id === saved.id ? saved : s) : [...prev, saved]
    })
    toast(saved.email ? `Account created for ${saved.full_name}` : `${saved.full_name} updated`)
  }

  const toggleActive = async (member) => {
    try {
      const { data } = await adminApi.patch(`/admin/staff/${member.id}`, { is_active: !member.is_active })
      setStaff(prev => prev.map(s => s.id === member.id ? data.staff : s))
      toast(`${data.staff.full_name} ${data.staff.is_active ? 'reactivated' : 'deactivated'}`)
    } catch (err) {
      toast(err.response?.data?.error ?? 'Failed to update')
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={Users}
        title="Staff"
        subtitle="Manage who can access the admin panel"
        actions={
          isSuperAdmin && (
            <button
              onClick={() => setModal({ type: 'create' })}
              className="admin-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              <UserPlus size={15} /> Add Staff
            </button>
          )
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#2A1200' }} />
          ))}
        </div>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(61,32,0,0.6)' }}>
            <SectionHeader icon={Users} title={`${staff.length} account${staff.length !== 1 ? 's' : ''}`} />
          </div>

          <div className="divide-y" style={{ borderColor: 'rgba(61,32,0,0.4)' }}>
            {staff.map(member => (
              <div key={member.id}
                className="flex items-center gap-4 px-5 py-4"
                style={{ opacity: member.is_active ? 1 : 0.5 }}>

                {/* Avatar initials */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ background: 'rgba(184,117,42,0.15)', color: '#B8752A', border: '1px solid rgba(184,117,42,0.25)' }}>
                  {(member.full_name || member.email).charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm truncate" style={{ color: '#F2EAD8' }}>
                      {member.full_name}
                      {member.id === me?.id && (
                        <span className="ml-1.5 text-[10px] font-normal" style={{ color: '#8C7355' }}>(you)</span>
                      )}
                    </p>
                    <RolePill role={member.role} />
                    {!member.is_active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: '#8C7355' }}>{member.email}</p>
                  <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: 'rgba(140,115,85,0.6)' }}>
                    <Clock size={10} />
                    Last login: {formatDate(member.last_login)}
                  </p>
                </div>

                {/* Actions — superadmin only, can't self-harm */}
                {isSuperAdmin && member.id !== me?.id && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setModal({ type: 'edit', member })}
                      title="Edit"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70"
                      style={{ background: 'rgba(184,117,42,0.1)', color: '#B8752A' }}>
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setModal({ type: 'reset', member })}
                      title="Reset password"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70"
                      style={{ background: 'rgba(184,117,42,0.1)', color: '#B8752A' }}>
                      <KeyRound size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive(member)}
                      title={member.is_active ? 'Deactivate' : 'Reactivate'}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70"
                      style={{
                        background: member.is_active ? 'rgba(248,113,113,0.1)' : 'rgba(34,197,94,0.1)',
                        color:      member.is_active ? '#f87171'                : '#22c55e',
                      }}>
                      {member.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modals */}
      {modal?.type === 'create' && (
        <StaffModal onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal?.type === 'edit' && (
        <StaffModal member={modal.member} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal?.type === 'reset' && (
        <ResetModal member={modal.member} onClose={() => setModal(null)} />
      )}

      {/* Toast */}
      {toasting && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg"
          style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.3)', color: '#F2EAD8' }}>
          <Check size={14} style={{ color: '#B8752A' }} /> {toasting}
        </div>
      )}
    </PageShell>
  )
}
