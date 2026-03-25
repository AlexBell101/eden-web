import { createClient } from '@/lib/supabase/server'
import { HistoryView } from '@/components/history/HistoryView'
import type { Listing } from '@/components/feed/ListingCard'

interface HistoryListing extends Listing {
  dismissed: boolean
  above_threshold: boolean
}

async function getAllScoredListings(userId: string): Promise<HistoryListing[]> {
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
      dismissed,
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
    .is('household_id', null)
    .order('overall_score', { ascending: false })

  if (error || !data) return []

  return data
    .filter((s) => s.listings)
    .map((s) => {
      const l = s.listings as unknown as {
        id: string; address: string; neighborhood: string | null
        rent: number; bedrooms: number; bathrooms: number; images: string[]
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
        household_id: null,
        household_score: null,
        compromise_rating: null,
        dismissed: s.dismissed ?? false,
        above_threshold: s.above_threshold ?? false,
      }
    })
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const listings = await getAllScoredListings(user.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every listing Eden has scored for you — including hidden ones.
        </p>
      </div>
      <HistoryView listings={listings} />
    </div>
  )
}
