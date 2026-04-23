import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        setError(error.message)
      } else {
        if (isSignUp) {
          setError('Check your email for the confirmation link')
        } else {
          navigate('/')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-full bg-ink grid place-items-center">
            <span className="text-white text-2xl">⚽</span>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-secondary">Welcome back</p>
          <h1 className="text-2xl font-black text-ink">
            {isSignUp ? 'Create account' : 'Sign in to Sansiro FC'}
          </h1>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-secondary outline-none focus:border-ink focus:ring-1 focus:ring-ink transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-secondary outline-none focus:border-ink focus:ring-1 focus:ring-ink transition"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className={`rounded-xl p-3 text-sm ${error.includes('Check your email') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-live/5 text-live border border-live/20'}`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="text-center text-sm text-ink-secondary">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              className="font-semibold text-ink hover:text-ink-secondary transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-ink-secondary hover:text-ink transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
