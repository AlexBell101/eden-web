'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  async function signInWithGoogle() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-[#0D0F12] text-[#F5F1EA] flex flex-col lg:flex-row">

      {/* ── Left: brand panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 px-16 py-14 bg-[#0D0F12] border-r border-white/[0.06]">
        {/* Logo */}
        <Link href="/" className="text-xl font-semibold tracking-tight text-[#F5F1EA]">
          eden
        </Link>

        {/* Main brand copy */}
        <div className="space-y-6 max-w-md">
          <h1
            className="text-4xl xl:text-5xl leading-[1.1] text-[#F5F1EA]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Find a home that fits your life, not just your filters.
          </h1>
          <p className="text-[#B7B0A3] text-base leading-relaxed">
            Describe what matters — in your own words. Eden scores every listing against your
            criteria so only the homes worth your attention make the cut.
          </p>

          {/* Sample quote */}
          <div className="rounded-xl border border-white/[0.07] bg-[#151922] px-5 py-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7FA36C]">
              Eden&apos;s Take
            </p>
            <p className="text-sm text-[#F5F1EA] italic leading-relaxed">
              &ldquo;Quiet street, strong natural light, and enough nearby to feel easy. This one fits the way you want to live.&rdquo;
            </p>
          </div>
        </div>

        {/* Footer quote */}
        <p className="text-xs text-[#666B75]">
          A calmer way to rent.
        </p>
      </div>

      {/* ── Right: sign-in panel ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 text-center space-y-2">
          <Link href="/" className="text-2xl font-semibold tracking-tight text-[#F5F1EA]">
            eden
          </Link>
          <p className="text-sm text-[#B7B0A3]">Stop searching. Let Eden find you.</p>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1.5">
            <h2
              className="text-2xl font-semibold text-[#F5F1EA]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Welcome
            </h2>
            <p className="text-sm text-[#B7B0A3]">
              Sign in to see listings curated for you.
            </p>
          </div>

          {/* Sign-in card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#151922] p-8 space-y-5">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 rounded-xl px-4 py-3.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-[#666B75]">free to use</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <ul className="space-y-2">
              {[
                '🎯 Listings scored against your criteria',
                '🏡 Eden Together for couples & roommates',
                '📍 Map-based region search',
              ].map((item) => (
                <li key={item} className="text-xs text-[#B7B0A3] flex items-center gap-2">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-center text-xs text-[#666B75]">
            By signing in you agree to our terms and privacy policy.
          </p>
        </div>
      </div>

    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
