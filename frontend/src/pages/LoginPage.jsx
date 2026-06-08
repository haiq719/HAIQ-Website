import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Crown from '../components/shared/Crown'
import Button from '../components/shared/Button'
import { LoginSEO } from '../components/shared/SEO'

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  const from = location.state?.from?.pathname || '/account'

  const containsHtml = (value) => /<[^>]*>/.test(value) || /javascript:/i.test(value)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (containsHtml(email) || containsHtml(password)) {
      setError('Please remove HTML or script content.');
      return
    }
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Invalid email or password.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#1A0A00', minHeight: '85vh' }} className="flex items-center justify-center px-6 py-16">
      <LoginSEO />
      <div className="w-full max-w-sm">

        {/* 10% — amber accent mark */}
        <Crown size={20} color="#B8752A" className="mb-6 opacity-60" />

        {/* 30% — label text */}
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: '#B8752A' }}>
          Welcome Back
        </p>

        {/* 60% — dominant headline on dark */}
        <h1 className="font-serif font-bold text-3xl mb-2" style={{ color: '#F2EAD8' }}>Sign In</h1>
        <div className="w-8 h-px mb-8" style={{ background: '#B8752A' }} />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 text-sm focus:outline-none"
              style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.25)', color: '#F2EAD8' }}
              onFocus={e => e.target.style.borderColor = '#B8752A'}
              onBlur={e => e.target.style.borderColor = 'rgba(184,117,42,0.25)'}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#8C7355' }}>
                Password
              </label>
              <Link to="/forgot-password" className="text-[10px] hover:underline transition" style={{ color: '#B8752A' }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 text-sm focus:outline-none"
              style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.25)', color: '#F2EAD8' }}
              onFocus={e => e.target.style.borderColor = '#B8752A'}
              onBlur={e => e.target.style.borderColor = 'rgba(184,117,42,0.25)'}
            />
          </div>

          {error && (
            <div className="px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Sign In
          </Button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: 'rgba(242,234,216,0.35)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#B8752A' }} className="hover:underline">Create one</Link>
        </p>

        {/* One email per account notice */}
        <p className="text-[10px] text-center mt-3" style={{ color: 'rgba(242,234,216,0.2)' }}>
          One account per email address.
        </p>
      </div>
    </div>
  )
}
