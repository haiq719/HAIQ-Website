import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Crown from '../components/shared/Crown'
import { RegisterSEO } from '../components/shared/SEO'
import Button from '../components/shared/Button'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form,    setForm]    = useState({ full_name: '', phone: '', email: '', password: '' })
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const containsHtml = (value) => /<[^>]*>/.test(value) || /javascript:/i.test(value)

  const validate = () => {
    const name = form.full_name.trim()
    if (!name || !name.includes(' ') || name.split(' ').filter(Boolean).length < 2) {
      return 'Please enter your full name — first and last name required.'
    }
    if (containsHtml(name)) return 'This field contains invalid characters.'
    if (!form.phone.trim()) return 'Phone number is required.'
    if (containsHtml(form.phone)) return 'This field contains invalid characters.'
    if (!form.email.trim()) return 'Email address is required.'
    if (containsHtml(form.email)) return 'This field contains invalid characters.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (!/[!@#$%^&*()\-_=+\[\]{}|;:'",.<>?/\\`~]/.test(form.password)) {
      return 'Password must include at least one special character (e.g. ! @ # $ %).'
    }
    return null
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError(null)

    try {
      const { data } = await api.post('/auth/register', {
        full_name: form.full_name.trim(),
        // Split for backends expecting first/last
        first_name: form.full_name.trim().split(' ')[0],
        last_name:  form.full_name.trim().split(' ').slice(1).join(' '),
        phone:      form.phone.trim(),
        email:      form.email.trim().toLowerCase(),
        password:   form.password,
      })

      // Auto-login after register with the credentials just used
      try {
        await login(form.email.trim().toLowerCase(), form.password)
        navigate('/account')
      } catch (_) {
        // Login failed (unlikely) — user can manually sign in
        navigate('/login')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Could not create account. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-dark min-h-[85vh] flex items-center justify-center px-6 py-16">
      <RegisterSEO />
      <div className="w-full max-w-sm">

        <Crown size={20} color="#B8752A" className="mb-6 opacity-55" />

        <p className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase mb-2">
          Join HAIQ
        </p>
        <h1 className="font-serif font-bold text-light text-3xl mb-2">
          Create Account
        </h1>
        <div className="w-8 h-px bg-primary mb-8" />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-semibold text-muted uppercase tracking-[0.2em] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={upd('full_name')}
              placeholder="Amara Nakato"
              required
              className="w-full bg-dark2 border border-primary/20 px-4 py-3 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-light/25 text-[10px] mt-1">First and last name required</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[10px] font-semibold text-muted uppercase tracking-[0.2em] mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={upd('phone')}
              placeholder="+256 700 000 000"
              required
              className="w-full bg-dark2 border border-primary/20 px-4 py-3 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] font-semibold text-muted uppercase tracking-[0.2em] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={upd('email')}
              placeholder="you@example.com"
              required
              className="w-full bg-dark2 border border-primary/20 px-4 py-3 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-semibold text-muted uppercase tracking-[0.2em] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={upd('password')}
              placeholder="Min 6 characters, 1 special character"
              required
              className="w-full bg-dark2 border border-primary/20 px-4 py-3 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-light/25 text-[10px] mt-1">
              At least 6 characters and one special character (! @ # $ %)
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm leading-relaxed">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            loading={loading}
            disabled={loading}
          >
            Create Account
          </Button>
        </form>

        <p className="text-[10px] text-center mt-3" style={{ color: '#8C7355' }}>
          By creating an account, you agree to our{' '}
          <Link to="/terms" style={{ color: '#B8752A' }}>Terms of Use</Link>{' '}and{' '}
          <Link to="/privacy" style={{ color: '#B8752A' }}>Privacy Policy</Link>.
        </p>

        <p className="text-light/30 text-xs text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-secondary transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
