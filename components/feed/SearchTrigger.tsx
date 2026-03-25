'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle2, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { requestSearch, cancelSearch, getSearchStatus, checkScraperHealth } from '@/app/actions/feed'
import { cn } from '@/lib/utils'

interface SearchTriggerProps {
  lastScrapedAt: string | null
  scrapeRequestedAt: string | null
  scrapeStatus: string | null
}

type Phase = 'idle' | 'queued' | 'scraping' | 'scoring' | 'done'

interface Progress {
  found: number
  scored: number
  total: number
  new_scores: number
}

interface DiagRow {
  label: string
  value: string
  ok: boolean | null  // null = neutral
}

function phaseLabel(phase: Phase, progress: Progress | null): string {
  switch (phase) {
    case 'queued':   return 'Queued — waiting for scraper…'
    case 'scraping': return 'Finding listings on Zillow…'
    case 'scoring':
      return progress?.total
        ? `Scoring ${progress.scored} of ${progress.total} listings…`
        : 'Scoring listings…'
    case 'done':
      return progress?.new_scores
        ? `Done — ${progress.new_scores} new listing${progress.new_scores === 1 ? '' : 's'} scored`
        : 'Done — feed updated'
    default: return ''
  }
}

export function SearchTrigger({ lastScrapedAt, scrapeRequestedAt, scrapeStatus }: SearchTriggerProps) {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>(() => {
    if (scrapeStatus === 'scraping') return 'scraping'
    if (scrapeStatus === 'scoring')  return 'scoring'
    if (scrapeRequestedAt || scrapeStatus === 'queued') return 'queued'
    return 'idle'
  })
  const [progress, setProgress]       = useState<Progress | null>(null)
  const [debugOpen, setDebugOpen]     = useState(false)
  const [diagRows, setDiagRows]       = useState<DiagRow[]>([])
  const [diagLoading, setDiagLoading] = useState(false)
  const [isPending, startTransition]  = useTransition()
  const [isCancelling, startCancel]   = useTransition()

  const baseLastScraped = useRef(lastScrapedAt)

  // ── Kick off a search ────────────────────────────────────────────────────
  function handleRequest() {
    startTransition(async () => {
      baseLastScraped.current = lastScrapedAt
      const result = await requestSearch()
      setPhase('queued')

      // Surface any issues immediately in the debug panel
      const rows: DiagRow[] = [
        { label: 'DB flag set',       value: result.dbUpdated ? 'yes' : 'failed',             ok: result.dbUpdated },
        { label: 'SCRAPER_URL set',   value: result.scraperUrlConfigured ? 'yes' : 'not configured — add to Vercel env vars', ok: result.scraperUrlConfigured },
        { label: 'Scraper called',    value: result.scraperCalled ? 'yes' : 'no',             ok: result.scraperCalled },
        { label: 'Scraper response',  value: result.scraperResponse ?? (result.error ?? 'n/a'), ok: result.error ? false : result.scraperResponse ? true : null },
      ]
      setDiagRows(rows)

      // Auto-open debug if anything looks wrong
      if (!result.scraperUrlConfigured || result.error) setDebugOpen(true)
    })
  }

  // ── Cancel / reset ───────────────────────────────────────────────────────
  function handleCancel() {
    startCancel(async () => {
      await cancelSearch()
      setPhase('idle')
      setProgress(null)
      setDiagRows([])
      setDebugOpen(false)
    })
  }

  // ── Load scraper health for debug panel ──────────────────────────────────
  async function loadHealth() {
    setDiagLoading(true)
    try {
      const h = await checkScraperHealth()
      const rows: DiagRow[] = [
        { label: 'SCRAPER_URL',    value: h.urlConfigured ? 'configured' : 'not set in Vercel env vars', ok: h.urlConfigured },
        { label: 'Reachable',      value: h.reachable ? 'yes' : (h.error ?? 'no'),                      ok: h.reachable },
        { label: 'RAPIDAPI_KEY',   value: h.rapidApiKeySet == null ? 'unknown' : h.rapidApiKeySet ? 'set' : 'not set — add to Render env vars', ok: h.rapidApiKeySet ?? null },
        { label: 'Scraper busy',   value: h.reachable ? (h.busy ? 'yes — run in progress' : 'idle') : 'unknown', ok: h.reachable ? true : null },
        { label: 'Auto-schedule',  value: h.scheduleHours ? `every ${h.scheduleHours}h` : 'unknown',    ok: h.scheduleHours ? true : null },
        { label: 'Last server run',value: h.lastRun ? new Date(h.lastRun).toLocaleString() : 'never',   ok: null },
      ]
      setDiagRows(rows)
    } finally {
      setDiagLoading(false)
    }
  }

  // ── Poll DB every 6 s while active ───────────────────────────────────────
  useEffect(() => {
    if (phase === 'idle' || phase === 'done') return

    const interval = setInterval(async () => {
      try {
        const s = await getSearchStatus()
        if (s.progress) setProgress(s.progress)
        if (s.status === 'scraping') setPhase('scraping')
        else if (s.status === 'scoring') setPhase('scoring')

        const cleared   = !s.requestedAt && !s.status
        const freshRun  = s.lastScrapedAt !== baseLastScraped.current
        if (cleared && freshRun) {
          setPhase('done')
          clearInterval(interval)
          setTimeout(() => router.refresh(), 2000)
        }
      } catch { /* keep polling */ }
    }, 6000)

    return () => clearInterval(interval)
  }, [phase, router])

  // ── Helpers ──────────────────────────────────────────────────────────────
  const lastRunText = lastScrapedAt
    ? `Last run ${new Date(lastScrapedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    : null

  const isActive = phase !== 'idle' && phase !== 'done'
  const hasWarning = diagRows.some(r => r.ok === false)

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="flex items-center gap-2">

        {/* Last run timestamp (idle only) */}
        {phase === 'idle' && lastRunText && (
          <span className="text-xs text-muted-foreground hidden sm:block">{lastRunText}</span>
        )}

        {/* Idle — search now button */}
        {phase === 'idle' && (
          <button
            onClick={handleRequest}
            disabled={isPending}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
              isPending && 'opacity-60 cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('size-3.5', isPending && 'animate-spin')} />
            Search now
          </button>
        )}

        {/* Active — phase indicator */}
        {isActive && (
          <div className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-1.5',
            hasWarning
              ? 'border-amber-500/30 bg-amber-500/8'
              : 'border-[#7FA36C]/30 bg-[#7FA36C]/8'
          )}>
            {hasWarning
              ? <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
              : <RefreshCw className="size-3.5 text-[#7FA36C] animate-spin shrink-0" />
            }
            <span className={cn('text-xs font-medium', hasWarning ? 'text-amber-500' : 'text-[#7FA36C]')}>
              {phaseLabel(phase, progress)}
            </span>
            {phase === 'scoring' && progress != null && progress.total > 0 && (
              <div className="ml-1 h-1 w-16 rounded-full bg-[#7FA36C]/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#7FA36C] transition-all duration-500"
                  style={{ width: `${Math.round((progress.scored / progress.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Done */}
        {phase === 'done' && (
          <div className="flex items-center gap-1.5 rounded-lg border border-[#7FA36C]/30 bg-[#7FA36C]/8 px-3 py-1.5">
            <CheckCircle2 className="size-3.5 text-[#7FA36C] shrink-0" />
            <span className="text-xs font-medium text-[#7FA36C]">{phaseLabel('done', progress)}</span>
          </div>
        )}

        {/* Debug toggle (active + done states) */}
        {phase !== 'idle' && (
          <button
            onClick={() => {
              const next = !debugOpen
              setDebugOpen(next)
              if (next && diagRows.length === 0) loadHealth()
            }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Debug info"
          >
            {debugOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        )}

        {/* Cancel / reset */}
        {(isActive || phase === 'done') && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
            title="Cancel and reset"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Debug panel */}
      {debugOpen && (
        <div className="w-full max-w-xs rounded-xl border border-border bg-card text-xs shadow-md overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
            <span className="font-semibold text-foreground">Scraper diagnostics</span>
            <button
              onClick={loadHealth}
              disabled={diagLoading}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn('size-3', diagLoading && 'animate-spin')} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {diagRows.length === 0 && diagLoading && (
              <p className="px-3 py-2 text-muted-foreground">Loading…</p>
            )}
            {diagRows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-3 px-3 py-2">
                <span className="text-muted-foreground shrink-0">{row.label}</span>
                <span className={cn(
                  'text-right font-mono break-all',
                  row.ok === true  && 'text-[#7FA36C]',
                  row.ok === false && 'text-destructive font-semibold',
                  row.ok === null  && 'text-foreground',
                )}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          {diagRows.length > 0 && (
            <div className="px-3 py-2 border-t border-border bg-muted/40">
              <p className="text-muted-foreground leading-relaxed">
                {(() => {
                  // Support both label sets: request-result rows and health rows
                  const scraperUrlOk = diagRows.find(r => r.label === 'SCRAPER_URL' || r.label === 'SCRAPER_URL set')?.ok
                  const reachableOk  = diagRows.find(r => r.label === 'Reachable' || r.label === 'Scraper called')?.ok
                  const rapidApiOk   = diagRows.find(r => r.label === 'RAPIDAPI_KEY')?.ok
                  if (scraperUrlOk === false) return '→ Add SCRAPER_URL + SCRAPER_SECRET to Vercel env vars and redeploy.'
                  if (reachableOk === false)  return '→ Scraper unreachable. Check Render dashboard — service may need redeploying as a Web Service.'
                  if (rapidApiOk === false)   return '→ Add RAPIDAPI_KEY to Render environment variables — required to fetch listings from Zillow.'
                  return '→ Everything looks good. Search will update as scores come in.'
                })()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
