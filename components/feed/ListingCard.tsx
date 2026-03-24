'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Bed, Bath, MapPin } from 'lucide-react'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { cn } from '@/lib/utils'

export interface Listing {
  id: string
  address: string
  neighborhood: string | null
  rent: number
  bedrooms: number
  bathrooms: number
  images: string[]
  overall_score: number
  claude_reasoning: string | null
}

interface ListingCardProps {
  listing: Listing
}

function formatRent(rent: number): string {
  return `$${rent.toLocaleString()}/mo`
}

export function ListingCard({ listing }: ListingCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="block rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <h3 className="font-semibold text-foreground leading-snug truncate">{listing.address}</h3>
            {listing.neighborhood && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{listing.neighborhood}</span>
              </div>
            )}
          </div>
          <ScoreBadge score={listing.overall_score} className="shrink-0 mt-0.5" />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="text-foreground font-semibold text-base">{formatRent(listing.rent)}</span>
          <span className="flex items-center gap-1">
            <Bed className="size-4" />
            {listing.bedrooms} {listing.bedrooms === 1 ? 'bed' : 'beds'}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-4" />
            {listing.bathrooms} {listing.bathrooms === 1 ? 'bath' : 'baths'}
          </span>
        </div>

        {/* AI summary */}
        {listing.claude_reasoning && (
          <p className="text-sm text-muted-foreground leading-relaxed italic">&ldquo;{listing.claude_reasoning}&rdquo;</p>
        )}

        {/* Why this score */}
        <div>
          <button
            onClick={(e) => { e.preventDefault(); setExpanded((prev) => !prev) }}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            Why this score?
          </button>

          {expanded && (
            <div
              className={cn(
                'mt-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3',
                'text-sm text-muted-foreground'
              )}
            >
              Score breakdown coming soon.
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
