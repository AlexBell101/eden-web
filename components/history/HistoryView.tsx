'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, RotateCcw } from 'lucide-react'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { restoreListing } from '@/app/actions/feed'
import { cn } from '@/lib/utils'
import type { Listing } from '@/components/feed/ListingCard'

interface HistoryListing extends Listing {
  dismissed: boolean
  above_threshold: boolean
}

interface HistoryViewProps {
  listings: HistoryListing[]
}

type Filter = 'all' | 'hidden'

export function HistoryView({ listings: initial }: HistoryViewProps) {
  const [listings, setListings] = useState(initial)
  const [filter, setFilter] = useState<Filter>('all')
  const [, startTransition] = useTransition()

  function handleRestore(id: string) {
    setListings((prev) =>
      prev.map((l) => l.id === id ? { ...l, dismissed: false } : l)
    )
    startTransition(async () => {
      try {
        await restoreListing(id)
      } catch {
        setListings(initial)
      }
    })
  }

  const visible = filter === 'hidden'
    ? listings.filter((l) => l.dismissed)
    : listings

  const hiddenCount = listings.filter((l) => l.dismissed).length

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {([
          { key: 'all', label: 'All', icon: Eye, count: listings.length },
          { key: 'hidden', label: 'Hidden', icon: EyeOff, count: hiddenCount },
        ] as const).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === key
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Icon className="size-3.5" />
            {label}
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
              filter === key ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Listings */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            {filter === 'hidden' ? 'No hidden listings' : 'No scored listings yet'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === 'hidden'
              ? 'Listings you hide from your feed will appear here.'
              : 'Eden will score listings as they are found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((listing) => (
            <div
              key={listing.id}
              className={cn(
                'flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-opacity',
                listing.dismissed && 'opacity-50'
              )}
            >
              {/* Score */}
              <ScoreBadge score={listing.overall_score} className="shrink-0" />

              {/* Address + meta */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/listing/${listing.id}`}
                  className="font-medium text-sm text-foreground hover:underline truncate block"
                >
                  {listing.address}
                </Link>
                <p className="text-xs text-muted-foreground truncate">
                  ${listing.rent?.toLocaleString()}/mo · {listing.bedrooms}bd · {listing.bathrooms}ba
                  {listing.neighborhood ? ` · ${listing.neighborhood}` : ''}
                </p>
              </div>

              {/* Status + action */}
              {listing.dismissed ? (
                <button
                  onClick={() => handleRestore(listing.id)}
                  className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <RotateCcw className="size-3" />
                  Restore
                </button>
              ) : (
                listing.above_threshold ? (
                  <span className="text-[10px] font-medium text-[#7FA36C] shrink-0">In feed</span>
                ) : (
                  <span className="text-[10px] font-medium text-muted-foreground shrink-0">Below threshold</span>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
