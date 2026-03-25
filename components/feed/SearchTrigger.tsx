'use client'

import { useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { requestSearch } from '@/app/actions/feed'
import { cn } from '@/lib/utils'

interface SearchTriggerProps {
  lastScrapedAt: string | null
  scrapeRequestedAt: string | null
}

export function SearchTrigger({ lastScrapedAt, scrapeRequestedAt }: SearchTriggerProps) {
  const [requested, setRequested] = useState(!!scrapeRequestedAt)
  const [isPending, startTransition] = useTransition()

  function handleRequest() {
    startTransition(async () => {
      try {
        await requestSearch()
        setRequested(true)
      } catch {
        // silent fail
      }
    })
  }

  const lastRunText = lastScrapedAt
    ? `Last run ${new Date(lastScrapedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    : 'Never run'

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">{lastRunText}</span>
      {requested ? (
        <span className="flex items-center gap-1.5 text-xs font-medium text-[#7FA36C]">
          <span className="size-1.5 rounded-full bg-[#7FA36C] animate-pulse" />
          Searching…
        </span>
      ) : (
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
    </div>
  )
}
