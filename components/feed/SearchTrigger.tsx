'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle2 } from 'lucide-react'
import { requestSearch, getSearchStatus } from '@/app/actions/feed'
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

function phaseLabel(phase: Phase, progress: Progress | null): string {
  switch (phase) {
    case 'queued':   return 'Queued — scraper starting…'
    case 'scraping': return 'Finding listings on Zillow…'
    case 'scoring':
      if (progress && progress.total > 0) {
        return `Scoring ${progress.scored} of ${progress.total} listings…`
      }
      return 'Scoring listings…'
    case 'done':
      if (progress && progress.new_scores > 0) {
        return `Done — ${progress.new_scores} new listing${progress.new_scores === 1 ? '' : 's'} scored`
      }
      return 'Done — feed updated'
    default: return ''
  }
}

export function SearchTrigger({ lastScrapedAt, scrapeRequestedAt, scrapeStatus }: SearchTriggerProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>(() => {
    if (!scrapeRequestedAt && !scrapeStatus) return 'idle'
    if (scrapeStatus === 'scraping') return 'scraping'
    if (scrapeStatus === 'scoring') return 'scoring'
    if (scrapeRequestedAt) return 'queued'
    return 'idle'
  })
  const [progress, setProgress] = useState<Progress | null>(null)
  const [isPending, startTransition] = useTransition()

  // Track the last_scraped_at at request time so we can detect completion
  const baseLastScraped = useRef(lastScrapedAt)

  function handleRequest() {
    startTransition(async () => {
      try {
        await requestSearch()
        setPhase('queued')
        baseLastScraped.current = lastScrapedAt
      } catch {
        // silent
      }
    })
  }

  // Poll every 6s while active
  useEffect(() => {
    if (phase === 'idle' || phase === 'done') return

    const interval = setInterval(async () => {
      try {
        const status = await getSearchStatus()

        if (status.progress) {
          setProgress(status.progress)
        }

        if (status.status === 'scraping') {
          setPhase('scraping')
        } else if (status.status === 'scoring') {
          setPhase('scoring')
        }

        // Detect completion: scrape_requested_at cleared + last_scraped_at changed
        const isCleared = !status.requestedAt && !status.status
        const hasNewRun = status.lastScrapedAt !== baseLastScraped.current
        if (isCleared && hasNewRun) {
          setPhase('done')
          clearInterval(interval)
          // Refresh feed after a short pause so user sees the Done message
          setTimeout(() => router.refresh(), 2000)
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 6000)

    return () => clearInterval(interval)
  }, [phase, router])

  const lastRunText = lastScrapedAt
    ? `Last run ${new Date(lastScrapedAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })}`
    : null

  return (
    <div className="flex items-center gap-3 shrink-0">
      {lastRunText && phase === 'idle' && (
        <span className="text-xs text-muted-foreground hidden sm:block">{lastRunText}</span>
      )}

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

      {(phase === 'queued' || phase === 'scraping' || phase === 'scoring') && (
        <div className="flex items-center gap-2 rounded-lg border border-[#7FA36C]/30 bg-[#7FA36C]/8 px-3 py-1.5">
          <RefreshCw className="size-3.5 text-[#7FA36C] animate-spin shrink-0" />
          <span className="text-xs font-medium text-[#7FA36C]">
            {phaseLabel(phase, progress)}
          </span>
          {phase === 'scoring' && progress && progress.total > 0 && (
            <div className="ml-1 h-1 w-16 rounded-full bg-[#7FA36C]/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#7FA36C] transition-all duration-500"
                style={{ width: `${Math.round((progress.scored / progress.total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="flex items-center gap-1.5 rounded-lg border border-[#7FA36C]/30 bg-[#7FA36C]/8 px-3 py-1.5">
          <CheckCircle2 className="size-3.5 text-[#7FA36C] shrink-0" />
          <span className="text-xs font-medium text-[#7FA36C]">
            {phaseLabel('done', progress)}
          </span>
        </div>
      )}
    </div>
  )
}
