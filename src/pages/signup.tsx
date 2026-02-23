import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const pawMarks = [
  { top: '6%', left: '8%', size: 56, opacity: 0.16 },
  { top: '10%', left: '38%', size: 68, opacity: 0.14 },
  { top: '4%', left: '70%', size: 60, opacity: 0.12 },
  { top: '24%', left: '18%', size: 64, opacity: 0.15 },
  { top: '26%', left: '54%', size: 72, opacity: 0.1 },
  { top: '23%', left: '82%', size: 58, opacity: 0.14 },
  { top: '48%', left: '9%', size: 72, opacity: 0.11 },
  { top: '52%', left: '36%', size: 62, opacity: 0.13 },
  { top: '58%', left: '72%', size: 70, opacity: 0.12 },
  { top: '73%', left: '20%', size: 66, opacity: 0.14 },
  { top: '80%', left: '52%', size: 60, opacity: 0.13 },
  { top: '82%', left: '84%', size: 56, opacity: 0.1 },
]

function PawIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="14" cy="20" r="7" />
      <circle cx="26" cy="12" r="8" />
      <circle cx="40" cy="12" r="8" />
      <circle cx="50" cy="22" r="7" />
      <ellipse cx="32" cy="38" rx="18" ry="14" />
    </svg>
  )
}

function SignUpPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [agreeUpdates, setAgreeUpdates] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    const trimmedUsername = username.trim()

    if (!trimmedUsername) {
      setErrorMessage('Please enter your username.')
      setSuccessMessage('')
      return
    }

    if (!normalizedEmail) {
      setErrorMessage('Please enter your email address.')
      setSuccessMessage('')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      setSuccessMessage('')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      setSuccessMessage('')
      return
    }

    if (!acceptTerms) {
      setErrorMessage('You must agree to the Terms and Privacy Policy.')
      setSuccessMessage('')
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: trimmedUsername,
          agree_updates: agreeUpdates,
        },
      },
    })

    if (error) {
      const duplicateUserError =
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already been registered')
      setErrorMessage(
        duplicateUserError
          ? 'An account with this email already exists.'
          : error.message || 'Unable to create account. Please try again.',
      )
      setIsSubmitting(false)
      return
    }

    const emailConfirmationRequired = !data.session
    setSuccessMessage(
      emailConfirmationRequired
        ? 'Account created. Please check your email account to confirm your registration.'
        : 'Account created successfully. You can now log in.',
    )
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setAcceptTerms(false)
    setAgreeUpdates(false)
    setIsSubmitting(false)

    setTimeout(() => {
      const pendingQuery = emailConfirmationRequired ? '?confirmation=pending' : ''
      const emailQuery = emailConfirmationRequired
        ? `&email=${encodeURIComponent(normalizedEmail)}`
        : ''
      navigate(`/${pendingQuery}${emailQuery}`)
    }, 800)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030a1b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#10214b_0%,_#071533_38%,_#030a1b_100%)]" />
      <div className="pointer-events-none absolute inset-0">
        {pawMarks.map((mark, index) => (
          <div
            key={index}
            className="absolute text-[#8ea5d9]"
            style={{
              top: mark.top,
              left: mark.left,
              opacity: mark.opacity,
            }}
          >
            <div style={{ width: mark.size, height: mark.size }}>
              <PawIcon className="h-full w-full" />
            </div>
          </div>
        ))}
      </div>

      <header className="relative z-10 px-6 pt-8">
        <div className="inline-flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/85">
            <PawIcon className="h-6 w-6" />
          </span>
          <span className="font-['Poppins'] text-2xl font-semibold tracking-wide text-white/90">
            Unleash
          </span>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-8">
        <section className="motion-rise w-full max-w-[500px] rounded-3xl border border-white/10 bg-[#06122c]/95 p-6 shadow-[0_36px_70px_-40px_rgba(0,0,0,0.9)] sm:p-8">
          <div className="mb-6 text-center sm:mb-7">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/85">
              <PawIcon className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Sign Up</h1>
            <p className="mt-2 text-sm text-slate-300">Create a simple account to continue.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage ? (
              <p className="rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p className="rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </p>
            ) : null}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-100">Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                className="h-12 w-full rounded-xl border border-[#2b3f73] bg-[#091a3e] px-4 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#5f7fe4] focus:ring-2 focus:ring-[#5f7fe4]/40"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-100">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="h-12 w-full rounded-xl border border-[#2b3f73] bg-[#091a3e] px-4 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#5f7fe4] focus:ring-2 focus:ring-[#5f7fe4]/40"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-100">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="h-12 w-full rounded-xl border border-[#2b3f73] bg-[#091a3e] px-4 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#5f7fe4] focus:ring-2 focus:ring-[#5f7fe4]/40"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-100">Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your password"
                className="h-12 w-full rounded-xl border border-[#2b3f73] bg-[#091a3e] px-4 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#5f7fe4] focus:ring-2 focus:ring-[#5f7fe4]/40"
              />
            </label>

            <div className="space-y-2.5 pt-0.5 text-xs text-slate-300">
              <label className="inline-flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-400/70 bg-transparent text-[#5f7fe4] focus:ring-[#5f7fe4]/40"
                />
                <span>I agree to the Terms and Privacy Policy.</span>
              </label>
              <label className="inline-flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={agreeUpdates}
                  onChange={(event) => setAgreeUpdates(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-400/70 bg-transparent text-[#5f7fe4] focus:ring-[#5f7fe4]/40"
                />
                <span>I want to receive updates and product news.</span>
              </label>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-[#4e6ed8] text-sm font-semibold text-white shadow-[0_14px_25px_-16px_rgba(78,110,216,0.95)] transition hover:bg-[#5a79df] active:scale-[0.99]"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="h-12 w-full rounded-xl border border-[#324c8f] bg-transparent text-sm font-semibold text-slate-200 transition hover:bg-[#0c1d46] active:scale-[0.99]"
              >
                Back to Log In
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default SignUpPage
