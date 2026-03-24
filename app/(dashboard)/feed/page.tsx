import { createClient } from '@/lib/supabase/server'
import { ListingCard, type Listing } from '@/components/feed/ListingCard'
import { Search } from 'lucide-react'

async function getListingsWithScores(userId: string): Promise<Listing[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('scores')
    .select(`
      overall_score,
      claude_reasoning,
      above_threshold,
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
    .eq('above_threshold', true)
    .order('overall_score', { ascending: false })

  if (error || !data) return []

  return data
    .filter((s) => s.listings)
    .map((s) => {
      const l = s.listings as Record<string, unknown>
      return {
        id: l.id as string,
        address: (l.address as string) ?? 'Address unknown',
        neighborhood: (l.neighborhood as string) ?? '',
        rent: l.rent as number,
        bedrooms: l.bedrooms as number,
        bathrooms: l.bathrooms as number,
        images: (l.images as string[]) ?? [],
        overall_score: s.overall_score,
        claude_reasoning: s.claude_reasoning ?? '',
      }
    })
}

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // user is guaranteed by the dashboard layout, but satisfy TypeScript
  if (!user) return null

  const listings = await getListingsWithScores(user.id)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your Feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Listings ranked by how well they match your criteria.
        </p>
      </div>

      {/* Listing grid or empty state */}
      {listings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
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
