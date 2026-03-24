import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/feed')

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <span className="text-xl font-semibold tracking-tight">Eden 🌿</span>
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground mb-8">
          AI-powered rental discovery
        </div>

        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-foreground leading-tight mb-6">
          Stop searching.<br />
          <span className="text-muted-foreground">Let Eden find you.</span>
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mb-10">
          Define what home looks like — your criteria, your weights, your vibe.
          Eden scores every listing against your bar and surfaces only the ones that clear it.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-foreground text-background px-8 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Get started free
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-16 text-sm text-muted-foreground">
          {[
            '🤖 Claude AI scoring',
            '🐶 Pet-friendly filters',
            '📍 Neighborhood vibes',
            '📬 Daily digest',
            '⚖️ Custom criteria weights',
          ].map((f) => (
            <span
              key={f}
              className="rounded-full border border-border bg-muted/40 px-4 py-1.5"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </main>
  )
}
