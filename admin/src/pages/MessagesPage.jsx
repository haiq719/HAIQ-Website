import { useState, useEffect, useRef, useCallback } from 'react'
import adminApi from '../services/adminApi'

// 3-second polling for real-time feel
function useAdminMessages() {
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)
  const intervalRef = useRef(null)

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
    intervalRef.current = setInterval(() => load(true), 3000)
    return () => clearInterval(intervalRef.current)
  }, [load])

  return { messages, loading, refresh: load }
}

function useAdminThread(msgId, userId, orderId) {
  const [thread, setThread] = useState([])
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef(null)
  const bottomRef = useRef(null)

  const load = useCallback(async (silent = false) => {
    if (!msgId) return
    if (!silent) setLoading(true)
    try {
      let r
      if (userId) {
        r = await adminApi.get(`/admin/messages/thread/${userId}`)
      } else if (orderId) {
        r = await adminApi.get(`/admin/messages/order-thread/${orderId}`)
      } else {
        // contact_form message — no thread, just show the single message
        r = { data: { messages: [] } }
      }
      if (r) setThread(r.data.messages || [])
    } catch {} finally {
      if (!silent) setLoading(false)
    }
  }, [msgId, userId, orderId])

  useEffect(() => {
    setThread([])
    load()
    intervalRef.current = setInterval(() => load(true), 3000)
    return () => clearInterval(intervalRef.current)
  }, [load])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  return { thread, loading, refresh: () => load(true), bottomRef }
}

export default function MessagesPage() {
  const { messages, loading, refresh } = useAdminMessages()
  const [selected, setSelected] = useState(null)
  const [reply,    setReply]    = useState('')
  const [sending,  setSending]  = useState(false)

  const { thread, loading: threadLoading, refresh: refreshThread, bottomRef } = useAdminThread(
    selected?.id,
    selected?.user_id,
    selected?.order_id
  )

  const unread = messages.filter(m => !m.is_read).length

  const typeLabel = (msg) => {
    if (msg.is_direct)                         return 'Direct Message'
    if (msg.order_id)                          return `Order: ${msg.order_number || '—'}`
    if (msg.sender_type === 'contact_form')    return '💌 Contact Form'
    return 'Message'
  }

  const sendReply = async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await adminApi.post(`/admin/messages/${selected.id}/reply`, { body: reply.trim() })
      setReply('')
      refreshThread()
      refresh(true)
    } catch {} finally { setSending(false) }
  }

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 80px)' }}>

      {/* Message list */}
      <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(61,32,0,0.8)' }}>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold" style={{ color: '#F2EAD8' }}>Inbox</p>
            {/* Live indicator */}
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[9px]" style={{ color: '#8C7355' }}>Live</span>
            </div>
          </div>
          {unread > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: '#B8752A', color: '#1A0A00' }}>{unread}</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            Array(5).fill(null).map((_,i) => (
              <div key={i} className="p-4" style={{ borderBottom: '1px solid rgba(61,32,0,0.5)' }}>
                <div className="h-3 rounded skeleton mb-2" style={{ background: '#3D2000', width: '60%' }} />
                <div className="h-2.5 rounded skeleton" style={{ background: '#3D2000', width: '85%' }} />
              </div>
            ))
          ) : messages.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: '#8C7355' }}>No messages yet.</p>
          ) : (
            messages.map(m => {
              const displayName = m.user_name || m.sender_name || 'Anonymous'
              const displayEmail = m.user_email || m.sender_email || ''
              const isContact = m.sender_type === 'contact_form'
              return (
                <button key={m.id} onClick={() => { setSelected(m); setReply('') }}
                  className="w-full text-left px-4 py-3 transition-all hover:opacity-80"
                  style={{
                    borderBottom: '1px solid rgba(61,32,0,0.5)',
                    borderLeft:   selected?.id === m.id ? '3px solid #B8752A' : '3px solid transparent',
                    background:   selected?.id === m.id ? 'rgba(184,117,42,0.12)' : 'transparent',
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-xs font-bold truncate" style={{ color: m.is_read ? '#8C7355' : '#F2EAD8' }}>
                      {displayName}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isContact && <span className="text-[9px]">💌</span>}
                      {!m.is_read && <div className="w-2 h-2 rounded-full" style={{ background: '#B8752A' }} />}
                    </div>
                  </div>
                  {displayEmail && (
                    <p className="text-[10px] mb-1 truncate" style={{ color: '#8C7355' }}>{displayEmail}</p>
                  )}
                  {m.subject && (
                    <p className="text-[10px] mb-0.5 font-medium truncate" style={{ color: '#B8752A' }}>{m.subject}</p>
                  )}
                  <p className="text-[11px] line-clamp-2" style={{ color: 'rgba(242,234,216,0.6)' }}>{m.body}</p>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Thread panel */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0"
          style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
          <div className="px-5 py-4 flex-shrink-0 flex items-start justify-between"
            style={{ borderBottom: '1px solid rgba(61,32,0,0.8)' }}>
            <div>
              <p className="font-bold text-sm" style={{ color: '#F2EAD8' }}>
                {selected.user_name || selected.sender_name || selected.order_customer || 'Anonymous'}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#8C7355' }}>
                {typeLabel(selected)} &middot; {selected.user_email || selected.sender_email || ''}
              </p>
            </div>
            <button onClick={() => { setSelected(null); setReply('') }}
              className="text-xl hover:opacity-60 transition" style={{ color: '#8C7355' }}>x</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {threadLoading && thread.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: '#8C7355' }}>Loading...</div>
            ) : thread.length === 0 ? (
              // Contact form or standalone message — show body directly
              <div className="flex justify-start">
                <div className="px-4 py-3 text-sm max-w-[80%] leading-relaxed rounded-lg"
                  style={{ background: '#3D2000', border: '1.5px solid #B8752A', color: '#F2EAD8' }}>
                  {selected.subject && (
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#B8752A' }}>
                      {selected.subject}
                    </p>
                  )}
                  <p>{selected.body}</p>
                  <p className="text-[10px] mt-2 opacity-70">
                    📨 {selected.sender_name || selected.user_name || 'Customer'} • {new Date(selected.created_at).toLocaleString('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ) : thread.map(m => (
              <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className="px-4 py-3 text-sm max-w-[80%] leading-relaxed rounded-lg"
                  style={{
                    background: m.sender_type === 'admin' ? '#B8752A' : '#3D2000',
                    border:     `1.5px solid ${m.sender_type === 'admin' ? '#B8752A' : '#B8752A'}`,
                    color:      m.sender_type === 'admin' ? '#1A0A00' : '#F2EAD8',
                  }}>
                  <p>{m.body}</p>
                  <p className="text-[10px] mt-2 opacity-70">
                    {m.sender_type === 'admin' ? '📤 You' : '📨 Customer'} • {new Date(m.created_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Reply input */}
          <div className="flex gap-2 px-5 py-4 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(61,32,0,0.8)' }}>
            <input value={reply} onChange={e => setReply(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendReply()}
              placeholder="Reply..."
              className="flex-1 px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: '#1A0A00', border: '1px solid rgba(184,117,42,0.2)', color: '#F2EAD8' }} />
            <button onClick={sendReply} disabled={sending || !reply.trim()}
              className="px-5 py-2 font-bold text-[11px] tracking-wider uppercase disabled:opacity-40"
              style={{ background: '#B8752A', color: '#1A0A00' }}>
              {sending ? '...' : 'Reply'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center"
          style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
          <p className="text-sm" style={{ color: '#8C7355' }}>Select a message to view</p>
        </div>
      )}
    </div>
  )
}
