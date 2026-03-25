'use client'

import { useState, useTransition } from 'react'
import { ListingCard, type Listing } from '@/components/feed/ListingCard'
import { dismissListing } from '@/app/actions/feed'
import { Search } from 'lucide-react'

interface FeedGridProps {
  listings: Listing[]
  householdName: string | null
}

export function FeedGrid({ listings: initial, householdName }: FeedGridProps) {
  const [listings, setListings] = useState(initial)
  const [, startTransition] = useTransition()

  function handleDismiss(id: string) {
    // Optimistic: remove instantly
    setListings((prev) => prev.filter((l) => l.id !== id))
    startTransition(async () => {
      try {
        await dismissListing(id)
      } catch {
        // Restore on failure
        setListings(initial)
      }
    })
  }

  const togetherListings = listings.filter((l) => l.household_id)
  const soloListings = listings.filter((l) => !l.household_id)

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-20 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Search className="size-6 text-muted-foreground" />
        </div>
        <h2 className="text-base font-semibold text-foreground">Eden is searching...</h2>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          We&apos;re finding and scoring listings that match your criteria. Check back soon.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {togetherListings.length > 0 && householdName && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#8B6F8F]">
              👫 Eden Together — {householdName}
            </span>
            <div className="flex-1 h-px bg-[#8B6F8F]/20" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {togetherListings.map((listing) => (
              <ListingCard
                key={`together-${listing.id}`}
                listing={listing}
                onDismiss={() => handleDismiss(listing.id)}
              />
            ))}
          </div>
        </div>
      )}

      {soloListings.length > 0 && (
        <div className="space-y-4">
          {togetherListings.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                🌿 Your Feed
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {soloListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onDismiss={() => handleDismiss(listing.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
