import { createClient } from '@/lib/supabase/server'
import { ListingCard, type Listing } from '@/components/feed/ListingCard'
import { Search } from 'lucide-react'

async function getListingsWithScores(userId: string, threshold: number): Promise<Listing[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('scores')
    .select(`
      overall_score,
      claude_reasoning,
      above_threshold,
      household_id,
      household_score,
      compromise_rating,
      listings (
        id,
        address,
        neighborhood,
        rent,
        bedrooms,
        bathrooms,
        images
      )
    `)
    .eq('user_id', userId)
    .gte('overall_score', threshold)
    .order('overall_score', { ascending: false })

  if (error || !data) return []

  return data
    .filter((s) => s.listings)
    .map((s) => {
      const l = s.listings as unknown as {
        id: string
        address: string
        neighborhood: string | null
        rent: number
        bedrooms: number
        bathrooms: number
        images: string[]
      }
      return {
        id: l.id,
        address: l.address ?? 'Address unknown',
        neighborhood: l.neighborhood ?? '',
        rent: l.rent,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        images: l.images ?? [],
        overall_score: s.overall_score,
        claude_reasoning: s.claude_reasoning ?? '',
        household_id: s.household_id ?? null,
        household_score: s.household_score ?? null,
        compromise_rating: s.compromise_rating ?? null,
      }
    })
}

async function getHouseholdName(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('household_members')
    .select('households(name)')
    .eq('user_id', userId)
    .maybeSingle()
  const hh = data?.households
  if (!hh || Array.isArray(hh)) return null
  return (hh as { name: string }).name ?? null
}

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('score_threshold')
    .eq('id', user.id)
    .single()

  const threshold = profile?.score_threshold ?? 7.0
  const [listings, householdName] = await Promise.all([
    getListingsWithScores(user.id, threshold),
    getHouseholdName(user.id),
  ])

  const togetherListings = listings.filter((l) => l.household_id)
  const soloListings = listings.filter((l) => !l.household_id)

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your Feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Listings ranked by how well they match your criteria — scoring {threshold.toFixed(1)}+.
        </p>
      </div>

      {listings.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Together section */}
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
                  <ListingCard key={`together-${listing.id}`} listing={listing} />
                ))}
              </div>
            </div>
          )}

          {/* Solo section */}
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
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState() {
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
