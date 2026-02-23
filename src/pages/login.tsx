import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

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

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate('/market-centre')
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
        <section className="motion-rise w-full max-w-[460px] rounded-3xl border border-white/10 bg-[#06122c]/95 p-6 shadow-[0_36px_70px_-40px_rgba(0,0,0,0.9)] sm:p-8">
          <div className="mb-6 text-center sm:mb-7">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/85">
              <PawIcon className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Log In</h1>
            <p className="mt-2 text-sm text-slate-300">
              Welcome back. Please enter your details.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
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
              <span className="text-sm font-medium text-slate-100">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="h-12 w-full rounded-xl border border-[#2b3f73] bg-[#091a3e] px-4 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#5f7fe4] focus:ring-2 focus:ring-[#5f7fe4]/40"
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
                className="text-slate-300 underline-offset-2 transition hover:text-white hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#4e6ed8] text-sm font-semibold text-white shadow-[0_14px_25px_-16px_rgba(78,110,216,0.95)] transition hover:bg-[#5a79df] active:scale-[0.99]"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => navigate('/market-centre')}
                className="h-12 w-full rounded-xl border border-[#324c8f] bg-transparent text-sm font-semibold text-slate-200 transition hover:bg-[#0c1d46] active:scale-[0.99]"
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
