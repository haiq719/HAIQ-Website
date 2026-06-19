import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import api from '../../services/api'

export default function NewsletterSignup() {
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      // ✅ Fixed: properly formed API path (no template literal needed — uses api baseURL)
      await api.post('/newsletter/subscribe', { email })
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        disabled={status === 'loading' || status === 'success'}
        className="px-3 py-2 bg-gray-800 text-light rounded border border-gray-700 focus:outline-none focus:border-primary disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        className="bg-primary text-dark py-2 rounded font-medium hover:bg-primary/80 transition disabled:opacity-50"
      >
        {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {status === 'success' && (
        <p className="text-green-400 text-sm flex items-center gap-1.5"><CheckCircle2 size={14} /> You're in the inner circle.</p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm">Something went wrong. Try again.</p>
      )}
    </form>
  )
}
