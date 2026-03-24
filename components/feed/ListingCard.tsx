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
  household_id: string | null
  household_score: number | null
  compromise_rating: number | null
}

interface ListingCardProps {
  listing: Listing
}

function formatRent(rent: number): string {
  return `$${rent.toLocaleString()}/mo`
}

export function ListingCard({ listing }: ListingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isTogether = !!listing.household_id

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={cn(
        'block rounded-2xl border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isTogether
          ? 'border-[#8B6F8F]/30 hover:border-[#8B6F8F]/50'
          : 'border-border'
      )}
    >
      {/* Photo */}
      {listing.images && listing.images.length > 0 ? (
        <div className="h-44 w-full overflow-hidden bg-muted relative">
          <img
            src={listing.images[0]}
            alt={listing.address}
            className="h-full w-full object-cover"
          />
          {isTogether && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-[#8B6F8F]/30 bg-[#8B6F8F]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#8B6F8F] backdrop-blur-sm">
              <span>👫</span> Together
            </div>
          )}
        </div>
      ) : (
        <div className="h-44 w-full bg-muted flex items-center justify-center relative">
          <span className="text-3xl">🏠</span>
          {isTogether && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-[#8B6F8F]/30 bg-[#8B6F8F]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#8B6F8F]">
              <span>👫</span> Together
            </div>
          )}
        </div>
      )}

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
          <div className="shrink-0 mt-0.5 flex flex-col items-end gap-1">
            <ScoreBadge score={listing.overall_score} className="shrink-0" />
            {isTogether && listing.household_score != null && (
              <span className="text-[10px] text-[#8B6F8F] font-medium">
                {listing.household_score.toFixed(1)} together
              </span>
            )}
          </div>
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
          <p className="text-sm text-muted-foreground leading-relaxed italic line-clamp-3">
            &ldquo;{listing.claude_reasoning}&rdquo;
          </p>
        )}

        {/* Compromise rating */}
        {isTogether && listing.compromise_rating != null && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-[#8B6F8F]"
                style={{ width: `${(listing.compromise_rating / 10) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-[#8B6F8F] font-medium shrink-0">
              {listing.compromise_rating.toFixed(1)} compromise
            </span>
          </div>
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
                'mt-3 rounded-xl border border-dashed px-4 py-3',
                'text-sm text-muted-foreground bg-muted/40',
                isTogether ? 'border-[#8B6F8F]/20' : 'border-border'
              )}
            >
              Open the full listing to see the score breakdown.
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
