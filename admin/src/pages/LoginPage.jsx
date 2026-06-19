import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import { usePop } from '../lib/anim'
import { Mail, Lock, AlertTriangle, LogIn } from 'lucide-react'

export default function LoginPage() {
  const { login }  = useAdminAuth()
  const navigate   = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const cardRef = usePop({ y: 16, duration: 520 })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Invalid credentials. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(184,117,42,0.08) 0%, transparent 65%), #0E0600' }}>
      <div className="fixed top-0 left-0 right-0 h-px" style={{ background: 'rgba(184,117,42,0.3)' }} />

      <div ref={cardRef} className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/HAIQmain.png" alt="HAIQ Bakery" className="h-14 w-auto object-contain mb-3"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
          <span className="font-serif font-bold text-3xl tracking-widest hidden" style={{ display: 'none', color: '#E8C88A' }}>HAIQ</span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: '#8C7355' }}>Staff Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-xl p-8" style={{ background: '#2A1200', border: '1px solid #3D2000' }}>
          <h1 className="font-serif text-xl font-bold mb-1" style={{ color: '#F2EAD8' }}>Welcome back</h1>
          <p className="text-sm mb-7" style={{ color: '#8C7355' }}>Sign in to the HAIQ admin dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8C7355' }}>Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8C7355' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                  placeholder="admin@haiq.ug" className="admin-input" style={{ paddingLeft: '2.25rem' }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8C7355' }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8C7355' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                  placeholder="••••••••" className="admin-input" style={{ paddingLeft: '2.25rem' }} />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                <AlertTriangle size={15} className="flex-shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="admin-btn-primary w-full py-3 text-sm tracking-widest mt-2 disabled:opacity-50">
              {loading ? 'Signing in…' : <><LogIn size={15} /> Sign In</>}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] mt-6" style={{ color: '#8C7355' }}>HAIQ Bakery · Internal Staff Portal</p>
      </div>
    </div>
  )
}
