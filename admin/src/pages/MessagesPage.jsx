import { useState, useEffect, useRef, useCallback } from 'react'
import adminApi from '../services/adminApi'
import {
  RefreshCw, X, Mail, Send, CheckCheck, Inbox, MessageSquare, ArrowLeft, CheckCircle2, AlertTriangle,
} from 'lucide-react'

function useInquiries() {
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const r = await adminApi.get('/admin/messages')
      setMessages(r.data.messages || [])
    } catch {} finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(() => load(true), 60_000)
    return () => clearInterval(id)
  }, [load])

  return { messages, loading, refresh: load }
}

const typeLabel = (msg) => {
  if (msg.sender_type === 'contact_form') return 'Contact Form'
  if (msg.order_id)                       return `Order: ${msg.order_number || '—'}`
  if (msg.is_direct)                      return 'Direct Inquiry'
  return 'Message'
}

export default function MessagesPage() {
  const { messages, loading, refresh } = useInquiries()
  const [selected,   setSelected]   = useState(null)
  const [replyBody,  setReplyBody]  = useState('')
  const [sending,    setSending]    = useState(false)
  const [sendResult, setSendResult] = useState(null)
  const textareaRef = useRef(null)

  const unread = messages.filter(m => !m.is_read).length

  const select = (m) => {
    setSelected(m); setReplyBody(''); setSendResult(null)
    if (!m.is_read) adminApi.patch(`/admin/messages/${m.id}/read`).catch(() => {})
  }

  const sendEmail = async () => {
    if (replyBody.trim().length < 10 || !selected) return
    setSending(true); setSendResult(null)
    try {
      const r = await adminApi.post(`/admin/messages/${selected.id}/email-reply`, { body: replyBody.trim() })
      setSendResult({ ok: true, msg: `Email sent to ${r.data.sent_to}` })
      setReplyBody(''); refresh(true)
    } catch (err) {
      setSendResult({ ok: false, msg: err.response?.data?.error || 'Failed to send email.' })
    } finally { setSending(false) }
  }

  const toEmail = selected?.sender_email || selected?.user_email || null
  const panel = { background: '#2A1200', border: '1px solid #3D2000', borderRadius: '0.75rem' }

  return (
    <div className="flex gap-4" style={{ height: 'calc(100svh - 112px)' }}>

      {/* ── Inbox list ── (full-width on mobile; hidden when a message is open) */}
      <div className={`w-full md:w-80 flex-shrink-0 flex-col overflow-hidden ${selected ? 'hidden md:flex' : 'flex'}`} style={panel}>
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #3D2000' }}>
          <div className="flex items-center gap-2">
            <Inbox size={15} style={{ color: '#B8752A' }} />
            <p className="text-sm font-bold" style={{ color: '#F2EAD8' }}>Inquiries</p>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#B8752A', color: '#1A0A00' }}>{unread}</span>
            )}
            <button onClick={() => refresh()} className="hover:opacity-60 transition" style={{ color: '#8C7355' }} title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto admin-scroll">
          {loading ? (
            Array(5).fill(null).map((_, i) => (
              <div key={i} className="p-4" style={{ borderBottom: '1px solid rgba(61,32,0,0.5)' }}>
                <div className="h-3 rounded mb-2 skeleton" style={{ background: '#3D2000', width: '60%' }} />
                <div className="h-2.5 rounded skeleton" style={{ background: '#3D2000', width: '85%' }} />
              </div>
            ))
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
              <Inbox size={26} style={{ color: 'rgba(140,115,85,0.5)' }} />
              <p className="text-sm" style={{ color: '#8C7355' }}>No inquiries yet.</p>
            </div>
          ) : messages.map(m => {
            const displayName  = m.user_name || m.sender_name || 'Anonymous'
            const displayEmail = m.user_email || m.sender_email || ''
            const hasReplied   = parseInt(m.reply_count) > 0
            return (
              <button key={m.id} onClick={() => select(m)} className="w-full text-left px-4 py-3 transition-all hover:opacity-90"
                style={{
                  borderBottom: '1px solid rgba(61,32,0,0.5)',
                  borderLeft:   selected?.id === m.id ? '3px solid #B8752A' : '3px solid transparent',
                  background:   selected?.id === m.id ? 'rgba(184,117,42,0.12)' : 'transparent',
                }}>
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-xs font-bold truncate" style={{ color: m.is_read ? '#8C7355' : '#F2EAD8' }}>{displayName}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {hasReplied && <CheckCheck size={13} style={{ color: '#B8752A' }} />}
                    {!m.is_read && <div className="w-2 h-2 rounded-full" style={{ background: '#B8752A' }} />}
                  </div>
                </div>
                {displayEmail && <p className="text-[10px] mb-1 truncate" style={{ color: '#8C7355' }}>{displayEmail}</p>}
                {m.subject && <p className="text-[10px] mb-0.5 font-medium truncate" style={{ color: '#B8752A' }}>{m.subject}</p>}
                <p className="text-[11px] line-clamp-2" style={{ color: 'rgba(242,234,216,0.6)' }}>{m.body}</p>
                <p className="text-[9px] mt-1" style={{ color: '#8C7355' }}>
                  {new Date(m.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}{typeLabel(m)}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Detail + reply ── */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={panel}>
          <div className="px-5 py-4 flex-shrink-0 flex items-start justify-between gap-3" style={{ borderBottom: '1px solid #3D2000' }}>
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => { setSelected(null); setSendResult(null) }} className="md:hidden flex-shrink-0" style={{ color: '#8C7355' }}>
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: '#F2EAD8' }}>
                  {selected.user_name || selected.sender_name || selected.order_customer || 'Anonymous'}
                </p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: '#8C7355' }}>
                  {typeLabel(selected)}{toEmail && <> · <span style={{ color: '#B8752A' }}>{toEmail}</span></>}
                </p>
              </div>
            </div>
            <button onClick={() => { setSelected(null); setSendResult(null) }} className="hidden md:block hover:opacity-60 transition flex-shrink-0" style={{ color: '#8C7355' }}>
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto admin-scroll px-5 py-5">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8C7355' }}>
              Received · {new Date(selected.created_at).toLocaleString('en-UG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            {selected.subject && <p className="text-xs font-semibold mb-3" style={{ color: '#E8C88A' }}>{selected.subject}</p>}
            <div className="px-4 py-4 rounded-lg mb-5" style={{ background: '#1A0A00', border: '1px solid #3D2000' }}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#F2EAD8' }}>{selected.body}</p>
            </div>

            {parseInt(selected.reply_count) > 0 && selected.last_replied_at && (
              <div className="px-4 py-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(184,117,42,0.08)', border: '1px solid rgba(184,117,42,0.2)' }}>
                <CheckCheck size={14} style={{ color: '#B8752A' }} />
                <p className="text-[11px]" style={{ color: '#8C7355' }}>
                  Replied via email · {new Date(selected.last_replied_at).toLocaleString('en-UG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 px-5 pb-5 pt-4" style={{ borderTop: '1px solid #3D2000' }}>
            {toEmail ? (
              <>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#8C7355' }}>
                    <Mail size={12} /> Reply via Email
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(184,117,42,0.1)', color: '#B8752A' }}>{toEmail}</span>
                </div>

                {sendResult && (
                  <div className="mb-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                    style={{
                      background: sendResult.ok ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                      border:     `1px solid ${sendResult.ok ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                      color:      sendResult.ok ? '#86efac' : '#f87171',
                    }}>
                    {sendResult.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{sendResult.msg}
                  </div>
                )}

                <textarea ref={textareaRef} rows={4} value={replyBody} onChange={e => setReplyBody(e.target.value)}
                  placeholder="Write your reply… it will arrive as a branded HAIQ email."
                  className="admin-input resize-none mb-3" />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px]" style={{ color: '#8C7355' }}>Sent as a branded HAIQ email</p>
                  <button onClick={sendEmail} disabled={sending || replyBody.trim().length < 10} className="admin-btn-primary px-6 py-2.5 text-[11px] disabled:opacity-40">
                    <Send size={13} /> {sending ? 'Sending…' : 'Send Email'}
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-3 rounded-lg text-xs" style={{ background: '#1A0A00', color: '#8C7355' }}>
                No email address on this inquiry — respond by phone or other channel.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-2" style={panel}>
          <MessageSquare size={28} style={{ color: 'rgba(140,115,85,0.5)' }} />
          <p className="text-sm" style={{ color: '#8C7355' }}>Select an inquiry to reply</p>
          <p className="text-[10px]" style={{ color: 'rgba(140,115,85,0.5)' }}>Replies are sent as branded emails</p>
        </div>
      )}
    </div>
  )
}
