'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Bed, Bath, MapPin, X } from 'lucide-react'
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
  onDismiss?: () => void
}

function formatRent(rent: number): string {
  return `$${rent.toLocaleString()}/mo`
}

function PhotoCarousel({ images, address, isTogether }: {
  images: string[]
  address: string
  isTogether: boolean
}) {
  const [idx, setIdx] = useState(0)
  const total = images.length

  function prev(e: React.MouseEvent) {
    e.preventDefault()
    setIdx((i) => (i - 1 + total) % total)
  }
  function next(e: React.MouseEvent) {
    e.preventDefault()
    setIdx((i) => (i + 1) % total)
  }

  if (total === 0) {
    return (
      <div className="h-44 w-full bg-muted flex items-center justify-center relative">
        <span className="text-3xl">🏠</span>
        {isTogether && <TogetherBadge />}
      </div>
    )
  }

  return (
    <div className="relative h-44 w-full overflow-hidden bg-muted group">
      {/* Main image */}
      <img
        src={images[idx]}
        alt={`${address} photo ${idx + 1}`}
        className="h-full w-full object-cover transition-opacity duration-200"
      />

      {/* Together badge */}
      {isTogether && <TogetherBadge />}

      {/* Prev / Next — only shown when multiple images */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            aria-label="Previous photo"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            aria-label="Next photo"
          >
            <ChevronRight className="size-3.5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {images.slice(0, 8).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setIdx(i) }}
                className={cn(
                  'rounded-full transition-all',
                  i === idx
                    ? 'size-1.5 bg-white'
                    : 'size-1 bg-white/50 hover:bg-white/80'
                )}
              />
            ))}
          </div>

          {/* Photo count badge */}
          <div className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {idx + 1} / {total}
          </div>
        </>
      )}
    </div>
  )
}

function TogetherBadge() {
  return (
    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-[#8B6F8F]/30 bg-[#8B6F8F]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#8B6F8F] backdrop-blur-sm">
      <span>👫</span> Together
    </div>
  )
}

export function ListingCard({ listing, onDismiss }: ListingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isTogether = !!listing.household_id

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={cn(
        'group block rounded-2xl border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isTogether
          ? 'border-[#8B6F8F]/30 hover:border-[#8B6F8F]/50'
          : 'border-border'
      )}
    >
      <PhotoCarousel
        images={listing.images ?? []}
        address={listing.address}
        isTogether={isTogether}
      />

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
            <div className="flex items-center gap-1.5">
              <ScoreBadge score={listing.overall_score} className="shrink-0" />
              {onDismiss && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss() }}
                  className="rounded-md p-1 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-muted-foreground hover:bg-muted transition-all"
                  aria-label="Hide listing"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
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

        {/* Compromise rating bar */}
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

        {/* Expand */}
        <div>
          <button
            onClick={(e) => { e.preventDefault(); setExpanded((prev) => !prev) }}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            Why this score?
          </button>
          {expanded && (
            <div className={cn(
              'mt-3 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground bg-muted/40',
              isTogether ? 'border-[#8B6F8F]/20' : 'border-border'
            )}>
              Open the full listing to see the score breakdown.
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
