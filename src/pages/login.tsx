import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'

async function resolvePostLoginRoute(): Promise<string> {
  try {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) return '/shop-demo'

    const { data: shopRow } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle()

    return shopRow?.id ? '/marketing-centre' : '/shop-demo'
  } catch {
    return '/shop-demo'
  }
}

function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const signupPendingConfirmation = searchParams.get('confirmation') === 'pending'
  const signupEmail = searchParams.get('email') ?? ''
  const assetPath = (file: string) => `/Asset/${file}`

  useEffect(() => {
    let isActive = true

    const redirectAuthenticatedUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isActive || !session) {
        return
      }

      const route = await resolvePostLoginRoute()
      if (!isActive) {
        return
      }

      navigate(route, { replace: true })
    }

    void redirectAuthenticatedUser()

    return () => {
      isActive = false
    }
  }, [navigate])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setErrorMessage('Please enter your email address.')
      return
    }

    if (!password) {
      setErrorMessage('Please enter your password.')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      const loweredMessage = error.message.toLowerCase()
      if (loweredMessage.includes('email not confirmed')) {
        setErrorMessage(
          'Please check your email account and confirm your registration before logging in.',
        )
      } else {
        setErrorMessage('Invalid email or password.')
      }
      setIsSubmitting(false)
      return
    }

    if (rememberMe) {
      window.localStorage.setItem('rememberedEmail', normalizedEmail)
    } else {
      window.localStorage.removeItem('rememberedEmail')
    }

    setIsSubmitting(false)
    setErrorMessage('')
    const route = await resolvePostLoginRoute()
    navigate(route, { replace: true })
  }

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setErrorMessage('Enter your email first to reset your password.')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/`,
    })

    if (error) {
      setErrorMessage('Unable to send reset email. Please try again.')
      return
    }

    setErrorMessage('Password reset link sent. Please check your email account.')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040917] text-white">
      <div className="absolute inset-0">
        <img
          src={assetPath('background.png')}
          alt="Playful paw background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040917]/60 via-[#040917]/75 to-[#030711]/90 backdrop-blur-[2px]" />
      </div>

      <header className="relative z-10 px-6 pt-8">
        <img
          src={assetPath('unleash_banner.png')}
          alt="Unleash banner"
          className="h-12 w-auto"
          style={{ filter: 'brightness(2.05) saturate(1.4) drop-shadow(0 12px 28px rgba(0,0,0,0.3))' }}
        />
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10">
        <section className="motion-rise w-full max-w-[470px] rounded-[28px] border border-white/15 bg-[#0b1533]/[0.92] p-6 shadow-[0_36px_90px_-38px_rgba(0,0,0,0.78)] backdrop-blur">
          <div className="mb-6 text-center sm:mb-7">
            <img
              src={assetPath('logo_nobg.png')}
              alt="Unleash logo"
              className="mx-auto mb-3 h-16 w-auto"
              style={{ filter: 'brightness(2.1) saturate(1.4) drop-shadow(0 10px 26px rgba(12,22,58,0.55))' }}
            />
            <h1 className="text-[32px] font-semibold tracking-tight text-white">Log In</h1>
            <p className="mt-2 text-sm text-slate-200/90">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            {signupPendingConfirmation ? (
              <p className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Please check your email account{signupEmail ? ` (${signupEmail})` : ''} to confirm
                your registration.
              </p>
            ) : null}
            {errorMessage ? (
              <p className="rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </p>
            ) : null}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-100">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="h-12 w-full rounded-xl border border-[#2d3f6f] bg-[#0a1a3a] px-4 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#7396ff] focus:ring-2 focus:ring-[#7396ff]/40"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-100">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="h-12 w-full rounded-xl border border-[#2d3f6f] bg-[#0a1a3a] px-4 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#7396ff] focus:ring-2 focus:ring-[#7396ff]/40"
              />
            </label>

            <div className="flex items-center justify-between gap-3 pt-0.5 text-xs text-slate-300">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-400/70 bg-transparent text-[#5f7fe4] focus:ring-[#5f7fe4]/40"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-slate-300 underline-offset-2 transition hover:text-white hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-[#5f82ff] text-sm font-semibold text-white shadow-[0_18px_32px_-18px_rgba(95,130,255,0.95)] transition hover:bg-[#6b8dff] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Logging In...' : 'Log In'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/sign-up')}
                className="h-12 w-full rounded-xl border border-[#6a8bff] bg-[#0f214f] text-sm font-semibold text-white transition hover:bg-[#162d62] active:scale-[0.99]"
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => navigate('/shop-demo')}
                className="h-12 w-full rounded-xl border border-[#2d4075] bg-transparent text-sm font-semibold text-slate-200 transition hover:bg-[#0c1d46] active:scale-[0.99]"
              >
                Skip for now
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default LoginPage
