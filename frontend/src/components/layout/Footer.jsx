import { useState } from 'react'
import { Link } from 'react-router-dom'
import Crown from '../shared/Crown'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Button from '../shared/Button'

export default function Footer() {
  const { user } = useAuth()

  const fullName = user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()

  const [name,    setName]    = useState(fullName || '')
  const [email,   setEmail]   = useState(user?.email || '')
  const [status,  setStatus]  = useState(null) // null | 'loading' | 'done' | 'already' | 'error'
  const [errMsg,  setErrMsg]  = useState('')

  const handleSubscribe = async (e) => {
    e.preventDefault()
    const containsHtml = (value) => /<[^>]*>/.test(value) || /javascript:/i.test(value)
    if (!name.trim())  { setErrMsg('Your name is required.'); setStatus('error'); return }
    if (containsHtml(name)) { setErrMsg('Invalid characters in name.'); setStatus('error'); return }
    if (!email.trim()) { setErrMsg('Your email is required.'); setStatus('error'); return }
    if (containsHtml(email)) { setErrMsg('Invalid characters in email.'); setStatus('error'); return }
    setStatus('loading'); setErrMsg('')
    try {
      const res = await api.post('/newsletter/subscribe', { email: email.trim(), name: name.trim() })
      setStatus(res.data.already ? 'already' : 'done')
    } catch (err) {
      setErrMsg(err.response?.data?.error || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  const inputCls = `w-full px-3 py-2.5 text-xs focus:outline-none transition-colors`
  const inputSty = { background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)', color: '#F2EAD8' }
  const inputFocus = e => e.target.style.borderColor = '#B8752A'
  const inputBlur  = e => e.target.style.borderColor = 'rgba(184,117,42,0.2)'

  return (
    <footer style={{ background: '#1A0A00', borderTop: '1px solid rgba(184,117,42,0.2)' }}>

      <div className="container mx-auto px-6 md:px-16 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <img src="/HAIQmain.png" alt="HAIQ Bakery" className="h-10 w-auto object-contain mb-4" />
            <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(242,234,216,0.35)' }}>
              Made For You.<br />Muyenga, Kampala, Uganda.
            </p>
            <Crown size={18} color="#B8752A" className="opacity-30" />
          </div>

          {/* Shop */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-4" style={{ color: '#B8752A' }}>Shop</p>
            <ul className="space-y-3">
              {[
                ['All Cookies',    '/shop'],
                ['Build Your Box', '/build-your-box'],

                ['Moments',        '/moments'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="text-xs hover:opacity-100 transition-opacity"
                    style={{ color: 'rgba(242,234,216,0.45)', textDecoration: 'none' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-4" style={{ color: '#B8752A' }}>Info</p>
            <ul className="space-y-3">
              {[
                ['FAQ',          '/faq'],
                ['Contact',      '/contact'],
                ['Track Order',  '/track'],
                ['Loyalty Card', '/account'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="text-xs hover:opacity-100 transition-opacity"
                    style={{ color: 'rgba(242,234,216,0.45)', textDecoration: 'none' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-4" style={{ color: '#B8752A' }}>Stay Close</p>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(242,234,216,0.35)' }}>
              New flavours, special days, and drops — first in your inbox.
            </p>

            {status === 'done' && (
              <div className="px-4 py-3" style={{ border: '1px solid rgba(184,117,42,0.3)' }}>
                <p className="text-xs font-medium" style={{ color: '#B8752A' }}>You're in. Watch your inbox.</p>
              </div>
            )}

            {status === 'already' && (
              <div className="px-4 py-3" style={{ border: '1px solid rgba(184,117,42,0.2)', background: 'rgba(184,117,42,0.06)' }}>
                <p className="text-xs" style={{ color: '#8C7355' }}>This email is already subscribed.</p>
              </div>
            )}

            {status !== 'done' && status !== 'already' && (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="text"
                  placeholder="Your name *"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputCls}
                  style={inputSty}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  required
                />
                <input
                  type="email"
                  placeholder="your@email.com *"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputCls}
                  style={inputSty}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={status === 'loading'}
                  loading={status === 'loading'}
                >
                  Subscribe
                </Button>
                {status === 'error' && <p className="text-red-400 text-[10px]">{errMsg}</p>}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-6 md:px-16 py-5" style={{ borderTop: '1px solid rgba(184,117,42,0.12)' }}>
        <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[10px] tracking-wide" style={{ color: 'rgba(242,234,216,0.2)' }}>
            © {new Date().getFullYear()} HAIQ Bakery. Made For You.
          </p>
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex gap-6 flex-wrap">
              <Link to="/privacy" style={{ color: '#8C7355' }} className="text-xs hover:opacity-70 transition">
                Privacy Policy
              </Link>
              <Link to="/terms" style={{ color: '#8C7355' }} className="text-xs hover:opacity-70 transition">
                Terms of Use
              </Link>
              <Link to="/data-compliance" style={{ color: '#8C7355' }} className="text-xs hover:opacity-70 transition">
                Data & Compliance
              </Link>
            </div>
            <div className="flex items-center gap-5">
              <a href="https://www.instagram.com/haiq_ug" target="_blank" rel="noopener noreferrer"
                className="text-[10px] tracking-wider hover:opacity-80 transition" style={{ color: 'rgba(242,234,216,0.2)', textDecoration: 'none' }}>
                @haiq_ug
              </a>
              <a href="https://www.tiktok.com/@haiq_africa" target="_blank" rel="noopener noreferrer"
                className="text-[10px] tracking-wider hover:opacity-80 transition" style={{ color: 'rgba(242,234,216,0.2)', textDecoration: 'none' }}>
                @haiq_africa
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
