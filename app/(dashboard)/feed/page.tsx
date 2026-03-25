import { createClient } from '@/lib/supabase/server'
import { type Listing } from '@/components/feed/ListingCard'
import { SearchTrigger } from '@/components/feed/SearchTrigger'
import { FeedGrid } from '@/components/feed/FeedGrid'

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
    .eq('dismissed', false)
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
    .select('score_threshold, scrape_requested_at, last_scraped_at, scrape_status')
    .eq('id', user.id)
    .single()

  const threshold = profile?.score_threshold ?? 7.0
  const [listings, householdName] = await Promise.all([
    getListingsWithScores(user.id, threshold),
    getHouseholdName(user.id),
  ])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your Feed</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Listings ranked by how well they match your criteria — scoring {threshold.toFixed(1)}+.
            </p>
          </div>
          <SearchTrigger
            lastScrapedAt={profile?.last_scraped_at ?? null}
            scrapeRequestedAt={profile?.scrape_requested_at ?? null}
            scrapeStatus={profile?.scrape_status ?? null}
          />
        </div>
      </div>

      <FeedGrid listings={listings} householdName={householdName} />
    </div>
  )
}
