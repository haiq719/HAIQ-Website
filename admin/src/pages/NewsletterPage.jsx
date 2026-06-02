import { useState, useEffect } from 'react'
import adminApi from '../services/adminApi'
import Button from '../components/shared/Button'

export default function NewsletterPage() {
  const [tab,      setTab]      = useState('subscribers')
  const [subs,     setSubs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  // Campaign state
  const [subject,  setSubject]  = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(null)
  const [campErr,  setCampErr]  = useState(null)

  // WhatsApp invite state
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

  const exportCSV = () => {
    const rows = [
      ['Name','Email','Subscribed','Active'],
      ...filtered.map(s => [
        `"${s.name||''}"`,
        `"${s.email}"`,
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

  const inputSty = { background: '#1A0A00', border: '1px solid rgba(184,117,42,0.2)', color: '#F2EAD8', fontSize: '13px', padding: '10px 14px' }

  return (
    <div className="space-y-5 max-w-[900px]">

      {/* Tabs */}
      <div className="flex gap-1 p-1 w-fit" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
        {[
          { key: 'subscribers', label: 'Subscribers' },
          { key: 'campaign',    label: 'Send Campaign' },
          { key: 'whatsapp',    label: 'WhatsApp Invite' },
        ].map(t => (
          <Button
            key={t.key}
            onClick={() => setTab(t.key)}
            variant={tab===t.key ? 'primary' : 'secondary'}
            size="sm"
            className="px-4"
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* ── Subscribers tab ── */}
      {tab === 'subscribers' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email…" className="focus:outline-none"
              style={{ ...inputSty, width: '220px', padding: '8px 12px', fontSize: '12px' }} />
            <span className="text-xs" style={{ color: '#8C7355' }}>
              {filtered.length} subscriber{filtered.length !== 1 ? 's' : ''}
            </span>
            <Button onClick={exportCSV} disabled={!filtered.length} variant="primary" size="sm" className="ml-auto">
              Export CSV
            </Button>
          </div>

          <div style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)', overflow: 'hidden' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(61,32,0,0.8)' }}>
                  {['Name','Email','Subscribed','Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-semibold text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array(5).fill(null).map((_,i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}>
                    {Array(4).fill(null).map((__,j) => <td key={j} className="px-4 py-4"><div className="h-2.5 rounded skeleton" style={{ background: '#3D2000', width: '70%' }} /></td>)}
                  </tr>
                )) : filtered.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}>
                    <td className="px-4 py-3 text-xs" style={{ color: '#F2EAD8' }}>{s.name || <span style={{ color: '#8C7355' }}>—</span>}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#F2EAD8' }}>{s.email}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#8C7355' }}>
                      {new Date(s.subscribed_at||s.created_at).toLocaleDateString('en-UG', { day:'numeric', month:'short', year:'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider"
                        style={{ color: s.is_active!==false ? '#4ade80' : '#8C7355', background: s.is_active!==false ? 'rgba(74,222,128,0.1)' : 'rgba(140,115,85,0.1)' }}>
                        {s.is_active!==false ? 'Active' : 'Unsubscribed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Campaign tab ── */}
      {tab === 'campaign' && (
        <div className="space-y-5 max-w-2xl">
          {sent !== null && (
            <div className="mt-3 p-3 rounded" style={{ background: '#1A0A00', border: '1px solid rgba(184,117,42,0.3)' }}>
              <p className="text-sm font-semibold" style={{ color: sent.failed > 0 ? '#E8C88A' : '#6ECA8F' }}>
                {sent.failed > 0 ? '⚠' : '✓'} {sent.message}
              </p>
              {sent.failed > 0 && (
                <p className="text-xs mt-1" style={{ color: '#8C7355' }}>
                  {sent.failed} email{sent.failed !== 1 ? 's' : ''} could not be delivered (test addresses or invalid domains).
                </p>
              )}
              <Button onClick={() => { setSent(null); setSubject(''); setBodyHtml('') }} variant="primary" size="sm" className="mt-3">
                Send Another
              </Button>
            </div>
          )}
          {sent === null && (
            <>
              <div className="p-5" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: '#8C7355' }}>
                  New Campaign · {subs.filter(s=>s.is_active!==false).length} active subscribers
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>Subject Line *</label>
                    <input value={subject} onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. New flavour just dropped — Build Your Box is available"
                      className="w-full focus:outline-none" style={inputSty} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>
                      Email Body (HTML) *
                    </label>
                    <textarea rows={10} value={bodyHtml} onChange={e => setBodyHtml(e.target.value)}
                      placeholder="<p>Your email HTML here...</p>"
                      className="w-full focus:outline-none resize-none font-mono text-xs"
                      style={{ ...inputSty, resize: 'vertical' }} />
                    <p className="text-[10px] mt-1" style={{ color: '#8C7355' }}>
                      Use HTML. The HAIQ brand template wrapping is applied automatically on the backend.
                    </p>
                  </div>
                  {campErr && <p className="text-red-400 text-xs">{campErr}</p>}
                  <Button onClick={sendCampaign} disabled={sending} loading={sending} variant="primary" size="sm">
                    Send Campaign
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── WhatsApp invite tab ── */}
      {tab === 'whatsapp' && (
        <div className="space-y-4 max-w-xl">
          <div className="p-5" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: '#8C7355' }}>
              Send WhatsApp Group Invite via Email
            </p>

            {waResult !== null ? (
              <div className="py-8 text-center">
                <p className="font-serif font-bold text-xl mb-2" style={{ color: '#4ade80' }}>✓ Invites Sent</p>
                <p className="text-sm" style={{ color: '#8C7355' }}>{waResult} emails sent.</p>
                <button onClick={() => { setWaResult(null); setWaLink(''); setWaEmails('') }}
                  className="mt-4 px-5 py-2 font-bold text-[11px] tracking-wider uppercase"
                  style={{ background: '#B8752A', color: '#1A0A00' }}>
                  Send Another
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>
                    WhatsApp Group Invite Link *
                  </label>
                  <input value={waLink} onChange={e => setWaLink(e.target.value)}
                    placeholder="https://chat.whatsapp.com/…"
                    className="w-full focus:outline-none" style={inputSty} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>
                    Recipients — Emails (one per line or comma separated)
                  </label>
                  <textarea rows={4} value={waEmails} onChange={e => setWaEmails(e.target.value)}
                    placeholder={`Leave blank to send to all ${subs.filter(s=>s.is_active!==false).length} newsletter subscribers`}
                    className="w-full focus:outline-none resize-none text-xs"
                    style={inputSty} />
                </div>
                {waErr && <p className="text-red-400 text-xs">{waErr}</p>}
                <Button onClick={sendWaInvite} disabled={waSending} loading={waSending} variant="primary" size="sm">
                  Send WhatsApp Invite
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
