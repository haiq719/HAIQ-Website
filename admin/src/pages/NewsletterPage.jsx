import { useState, useEffect } from 'react'
import adminApi from '../services/adminApi'
import Button from '../components/shared/Button'
import { PageShell, PageHeader, Card, Pill, EmptyState } from '../components/shared/ui'
import {
  Mail, Search, Download, Send, MessageCircle, CheckCircle2, AlertTriangle, Users,
} from 'lucide-react'

export default function NewsletterPage() {
  const [tab,      setTab]      = useState('subscribers')
  const [subs,     setSubs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  const [subject,  setSubject]  = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(null)
  const [campErr,  setCampErr]  = useState(null)

  const [waLink,   setWaLink]   = useState('')
  const [waEmails, setWaEmails] = useState('')
  const [waSending,setWaSending]= useState(false)
  const [waResult, setWaResult] = useState(null)
  const [waErr,    setWaErr]    = useState(null)

  useEffect(() => {
    adminApi.get('/admin/newsletter')
      .then(r => setSubs(r.data.subscribers || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = subs.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  )
  const activeCount = subs.filter(s => s.is_active !== false).length

  const exportCSV = () => {
    const rows = [
      ['Name','Email','Subscribed','Active'],
      ...filtered.map(s => [
        `"${s.name||''}"`, `"${s.email}"`,
        `"${new Date(s.subscribed_at||s.created_at).toLocaleDateString('en-UG')}"`,
        s.is_active !== false ? 'Yes' : 'No',
      ]),
    ]
    const blob = new Blob([rows.map(r=>r.join(',')).join('\n')], { type:'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `haiq-newsletter-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const sendCampaign = async () => {
    if (!subject.trim() || !bodyHtml.trim()) { setCampErr('Subject and body are required.'); return }
    if (!confirm(`Send to ${filtered.length} subscribers?`)) return
    setSending(true); setCampErr(null)
    try {
      const r = await adminApi.post('/admin/newsletter/campaign', { subject, body_html: bodyHtml })
      setSent({ count: r.data.sent, failed: r.data.failed, total: r.data.total, message: r.data.message })
    } catch (err) { setCampErr(err.response?.data?.error || 'Send failed.') }
    finally { setSending(false) }
  }

  const sendWaInvite = async () => {
    if (!waLink.trim()) { setWaErr('WhatsApp invite link required.'); return }
    const emails = waEmails.split(/[\n,;]/).map(e=>e.trim()).filter(Boolean)
    if (!emails.length && subs.length === 0) { setWaErr('No recipients.'); return }
    const recipients = emails.length ? emails : subs.filter(s => s.is_active !== false).map(s => s.email)
    if (!confirm(`Send WhatsApp invite to ${recipients.length} people?`)) return
    setWaSending(true); setWaErr(null)
    try {
      const r = await adminApi.post('/admin/newsletter/whatsapp-invite', { invite_link: waLink, emails: recipients })
      setWaResult(r.data.sent)
    } catch (err) { setWaErr(err.response?.data?.error || 'Failed.') }
    finally { setWaSending(false) }
  }

  const TABS = [
    { key: 'subscribers', label: 'Subscribers' },
    { key: 'campaign',    label: 'Send Campaign' },
    { key: 'whatsapp',    label: 'WhatsApp Invite' },
  ]

  return (
    <PageShell deps={[loading, tab]} max="920px">
      <PageHeader label="Audience" title="Newsletter" icon={Mail} />

      {/* Tabs */}
      <div className="flex gap-1 p-1 w-fit rounded-lg" style={{ background: '#2A1200', border: '1px solid #3D2000' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all"
            style={tab===t.key ? { background: '#B8752A', color: '#1A0A00' } : { color: 'rgba(242,234,216,0.45)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Subscribers ── */}
      {tab === 'subscribers' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8C7355' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
                className="admin-input" style={{ paddingLeft: '2.1rem' }} />
            </div>
            <Pill color="#8C7355" icon={Users}>{filtered.length} subscriber{filtered.length !== 1 ? 's' : ''}</Pill>
            <Button onClick={exportCSV} disabled={!filtered.length} variant="primary" size="sm" className="ml-auto">
              <Download size={13} /> Export CSV
            </Button>
          </div>

          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto admin-scroll">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid #3D2000' }}>
                    {['Name','Email','Subscribed','Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#8C7355' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array(5).fill(null).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}>
                      {Array(4).fill(null).map((__, j) => <td key={j} className="px-4 py-4"><div className="h-2.5 rounded skeleton" style={{ background: '#3D2000', width: '70%' }} /></td>)}
                    </tr>
                  )) : filtered.length === 0 ? (
                    <tr><td colSpan={4}><EmptyState icon={Mail} title="No subscribers" sub="No one matches your search." /></td></tr>
                  ) : filtered.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: '#F2EAD8' }}>{s.name || <span style={{ color: '#8C7355' }}>—</span>}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#F2EAD8' }}>{s.email}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#8C7355' }}>
                        {new Date(s.subscribed_at||s.created_at).toLocaleDateString('en-UG', { day:'numeric', month:'short', year:'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <Pill color={s.is_active!==false ? '#4ade80' : '#8C7355'}>{s.is_active!==false ? 'Active' : 'Unsubscribed'}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── Campaign ── */}
      {tab === 'campaign' && (
        <div className="max-w-2xl">
          {sent !== null ? (
            <Card>
              <div className="flex items-start gap-3">
                {sent.failed > 0 ? <AlertTriangle size={20} style={{ color: '#E8C88A', flexShrink: 0 }} /> : <CheckCircle2 size={20} style={{ color: '#4ade80', flexShrink: 0 }} />}
                <div>
                  <p className="text-sm font-semibold" style={{ color: sent.failed > 0 ? '#E8C88A' : '#86efac' }}>{sent.message}</p>
                  {sent.failed > 0 && (
                    <p className="text-xs mt-1" style={{ color: '#8C7355' }}>
                      {sent.failed} email{sent.failed !== 1 ? 's' : ''} could not be delivered (test addresses or invalid domains).
                    </p>
                  )}
                  <Button onClick={() => { setSent(null); setSubject(''); setBodyHtml('') }} variant="primary" size="sm" className="mt-3">Send Another</Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] mb-4 flex items-center gap-1.5" style={{ color: '#8C7355' }}>
                <Users size={12} /> New Campaign · {activeCount} active subscribers
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>Subject Line *</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} className="admin-input"
                    placeholder="e.g. New flavour just dropped — Build Your Box is available" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>Email Body *</label>
                  <textarea rows={10} value={bodyHtml} onChange={e => setBodyHtml(e.target.value)}
                    placeholder={"Write your message here. Separate paragraphs with a blank line.\n\nYou can also use HTML — brand colours and the subject heading are applied automatically."}
                    className="admin-input text-xs" style={{ resize: 'vertical' }} />
                  <p className="text-[10px] mt-1" style={{ color: '#8C7355' }}>
                    Plain text or HTML — the HAIQ template, subject heading, and brand colours are added automatically.
                  </p>
                </div>
                {campErr && <p className="text-xs flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertTriangle size={13} /> {campErr}</p>}
                <Button onClick={sendCampaign} disabled={sending} loading={sending} variant="primary" size="sm"><Send size={13} /> Send Campaign</Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── WhatsApp invite ── */}
      {tab === 'whatsapp' && (
        <div className="max-w-xl">
          <Card>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] mb-4 flex items-center gap-1.5" style={{ color: '#8C7355' }}>
              <MessageCircle size={12} /> Send WhatsApp Group Invite via Email
            </p>

            {waResult !== null ? (
              <EmptyState icon={CheckCircle2} title="Invites Sent" sub={`${waResult} emails sent.`} />
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>WhatsApp Group Invite Link *</label>
                  <input value={waLink} onChange={e => setWaLink(e.target.value)} placeholder="https://chat.whatsapp.com/…" className="admin-input" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>Recipients — Emails (one per line or comma separated)</label>
                  <textarea rows={4} value={waEmails} onChange={e => setWaEmails(e.target.value)}
                    placeholder={`Leave blank to send to all ${activeCount} newsletter subscribers`} className="admin-input text-xs resize-none" />
                </div>
                {waErr && <p className="text-xs flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertTriangle size={13} /> {waErr}</p>}
                <Button onClick={sendWaInvite} disabled={waSending} loading={waSending} variant="primary" size="sm"><Send size={13} /> Send WhatsApp Invite</Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  )
}
