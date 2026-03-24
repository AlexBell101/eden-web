import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight } from 'lucide-react'

const HERO_IMAGE = '/architectural.png'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-[#0D0F12] text-[#F5F1EA] flex flex-col">

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col">

        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={HERO_IMAGE}
            alt="Lush garden home"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Top-to-bottom cinematic fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D0F12]/85 via-[#0D0F12]/35 to-[#0D0F12]" />
          {/* Left vignette — text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0F12]/60 via-transparent to-transparent" />
          {/* Radial vignette for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_60%_50%,transparent_40%,#0D0F12/50_100%)]" />
        </div>

        {/* Nav — floats over image */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
          <span className="text-lg font-semibold tracking-tight drop-shadow-sm">eden</span>
          {user ? (
            <Link
              href="/feed"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7FA36C] hover:text-[#a8c99b] transition-colors drop-shadow-sm"
            >
              Your feed <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-[#F5F1EA]/80 hover:text-[#F5F1EA] transition-colors drop-shadow-sm"
            >
              Sign in
            </Link>
          )}
        </nav>

        {/* Hero content — centered over image */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pb-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 backdrop-blur-sm px-4 py-1.5 text-xs text-[#F5F1EA]/70 mb-10 tracking-wide">
            AI-guided home search · Powered by Claude
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tight leading-[1.05] mb-6 drop-shadow-lg"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Stop searching.<br />
            <span className="text-[#a8c99b]">Let Eden find you.</span>
          </h1>

          <p className="text-lg text-[#F5F1EA]/70 leading-relaxed max-w-xl mb-10 drop-shadow-sm">
            Describe the kind of place you want in your own words.
            Eden scores every listing against your standards so only the homes
            that truly fit rise to the top.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {user ? (
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 rounded-xl bg-[#7FA36C] text-[#0D0F12] px-7 py-3.5 text-sm font-semibold hover:bg-[#5E7A56] transition-colors shadow-lg"
              >
                Open your feed <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7FA36C] text-[#0D0F12] px-7 py-3.5 text-sm font-semibold hover:bg-[#5E7A56] transition-colors shadow-lg"
                >
                  Find my fit <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#8B6F8F]/50 bg-[#8B6F8F]/15 backdrop-blur-sm text-[#c9a8cd] px-7 py-3.5 text-sm font-semibold hover:bg-[#8B6F8F]/25 transition-colors"
                >
                  Try Eden Together
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Scroll fade — merges image into the section below */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0D0F12] to-transparent z-10" />
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="bg-[#0D0F12] px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#B7B0A3] mb-14">
            How it works
          </p>
          <div className="grid gap-10 sm:grid-cols-3">
            {[
              {
                num: '01',
                title: 'Tell Eden what matters',
                body: 'Use natural language and weighted criteria — light, quiet street, walkable, dog-friendly. Weight what matters most.',
              },
              {
                num: '02',
                title: 'Eden scores every listing',
                body: 'Not just price and beds. Claude evaluates neighborhood feel, natural light, pet policy, commute, and more.',
              },
              {
                num: '03',
                title: 'Only the right homes surface',
                body: "Set your minimum threshold. Browse a feed of listings that actually clear your bar — not everyone else's.",
              },
            ].map((step) => (
              <div key={step.num} className="space-y-3">
                <span className="text-xs font-semibold text-[#7FA36C] tracking-widest">{step.num}</span>
                <h3 className="text-base font-semibold text-[#F5F1EA]">{step.title}</h3>
                <p className="text-sm text-[#B7B0A3] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solo / Together split ────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] bg-[#151922] px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <p
            className="text-3xl sm:text-4xl text-center mb-16 text-[#F5F1EA]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Two ways to find home
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#7FA36C]/25 bg-[#0D0F12]/60 p-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="size-8 rounded-full bg-[#7FA36C]/15 flex items-center justify-center text-base">🌿</span>
                <h3 className="text-lg font-semibold text-[#F5F1EA]">Eden</h3>
              </div>
              <p className="text-sm text-[#B7B0A3] font-medium">For finding a place that feels right to you</p>
              <ul className="space-y-2 text-sm text-[#B7B0A3]">
                {[
                  'Weighted criteria, your way',
                  'Threshold-based feed — only what clears your bar',
                  'Per-listing reasoning from Claude',
                  'Neighborhood-aware summaries',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-[#7FA36C] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={user ? '/feed' : '/login'}
                className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-[#7FA36C] hover:text-[#a8c99b] transition-colors"
              >
                {user ? 'Open feed' : 'Get started'} <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-[#8B6F8F]/30 bg-[#0D0F12]/60 p-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="size-8 rounded-full bg-[#8B6F8F]/15 flex items-center justify-center text-base">👫</span>
                <h3 className="text-lg font-semibold text-[#F5F1EA]">Eden Together</h3>
              </div>
              <p className="text-sm text-[#B7B0A3] font-medium">For couples and roommates searching as a team</p>
              <ul className="space-y-2 text-sm text-[#B7B0A3]">
                {[
                  'Combine two sets of priorities',
                  'Individual fit scores for each person',
                  'Blended household score',
                  '"This one leans Alex — here\'s what wins Hannah over"',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-[#8B6F8F] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={user ? '/household' : '/login'}
                className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-[#8B6F8F] hover:text-[#c9a8cd] transition-colors"
              >
                {user ? 'Open Together' : 'Start together'} <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product proof ────────────────────────────────────────────── */}
      <section className="bg-[#0D0F12] px-6 py-24">
        <div className="max-w-3xl mx-auto space-y-12">
          <p
            className="text-3xl sm:text-4xl text-center text-[#F5F1EA]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            More than filters.<br />Better decisions.
          </p>
          <div className="space-y-4">
            {[
              {
                label: 'Natural light',
                quote: 'South-facing windows and an open living area make this one strong for your mornings.',
                score: '9.1',
                color: '#7FA36C',
              },
              {
                label: 'Walkability',
                quote: 'Good coffee, groceries, and dinner options within 10 minutes on foot.',
                score: '8.4',
                color: '#7FA36C',
              },
              {
                label: 'Together mode',
                quote: 'This one leans Alex on layout and quiet. Hannah gets the neighborhood energy and restaurants.',
                score: '7.8',
                color: '#8B6F8F',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/[0.06] bg-[#151922] px-6 py-5 flex items-start gap-5"
              >
                <div
                  className="shrink-0 mt-0.5 rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums"
                  style={{ background: `${item.color}22`, color: item.color }}
                >
                  {item.score}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#B7B0A3] mb-1">{item.label}</p>
                  <p className="text-sm text-[#F5F1EA] leading-relaxed italic">&ldquo;{item.quote}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Philosophy ───────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] bg-[#151922] px-6 py-24">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          <blockquote
            className="text-2xl sm:text-3xl text-[#F5F1EA] leading-snug"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Eden is built for people who know what they want, but don&apos;t want to spend their lives scrolling for it.
          </blockquote>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-[#B7B0A3]">
            {[
              { stat: 'Less', label: 'scrolling' },
              { stat: 'Clearer', label: 'tradeoffs' },
              { stat: 'Better', label: 'matches' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-lg font-semibold text-[#7FA36C]">{item.stat}</div>
                <div className="text-xs uppercase tracking-wide">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────── */}
      <section className="bg-[#0D0F12] px-6 py-20 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2
            className="text-3xl sm:text-4xl text-[#F5F1EA]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Your next home should feel obvious sooner.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 rounded-xl bg-[#7FA36C] text-[#0D0F12] px-7 py-3.5 text-sm font-semibold hover:bg-[#5E7A56] transition-colors"
              >
                Back to your feed <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7FA36C] text-[#0D0F12] px-7 py-3.5 text-sm font-semibold hover:bg-[#5E7A56] transition-colors"
                >
                  Find my fit <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#8B6F8F]/40 bg-[#8B6F8F]/10 text-[#8B6F8F] px-7 py-3.5 text-sm font-semibold hover:bg-[#8B6F8F]/20 transition-colors"
                >
                  Start with Eden Together
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-[#B7B0A3]">eden</span>
          <span className="text-xs text-[#666B75]">A calmer way to rent.</span>
        </div>
      </footer>

    </main>
  )
}
