import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListingDetail } from '@/components/listing/ListingDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch listing, current user's score, criteria, and household membership in parallel
  const [
    { data: listing },
    { data: scoreRow },
    { data: criteria },
    { data: membership },
  ] = await Promise.all([
    supabase.from('listings').select('*').eq('id', id).single(),
    supabase
      .from('scores')
      .select('*')
      .eq('listing_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('criteria').select('*').eq('user_id', user.id),
    supabase
      .from('household_members')
      .select('household_id, role')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (!listing) {
    notFound()
  }

  // If user is in a household, fetch all member scores for this listing
  let householdScores: Array<{
    user_id: string
    display_name: string | null
    email: string | null
    overall_score: number
    criteria_scores: Record<string, { score: number; reasoning: string }> | null
    highlights: string[] | null
    red_flags: string[] | null
    claude_reasoning: string | null
  }> = []

  if (membership?.household_id) {
    // Get all members of this household
    const { data: members } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', membership.household_id)

    if (members && members.length > 1) {
      const memberIds = members.map((m) => m.user_id)

      const [{ data: allScores }, { data: profiles }] = await Promise.all([
        supabase
          .from('scores')
          .select('user_id, overall_score, criteria_scores, highlights, red_flags, claude_reasoning')
          .eq('listing_id', id)
          .in('user_id', memberIds),
        supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', memberIds),
      ])

      if (allScores && profiles) {
        const profileMap = Object.fromEntries(
          profiles.map((p) => [p.id, { display_name: p.display_name, email: p.email }])
        )
        householdScores = allScores.map((s) => ({
          user_id: s.user_id,
          display_name: profileMap[s.user_id]?.display_name ?? null,
          email: profileMap[s.user_id]?.email ?? null,
          overall_score: s.overall_score,
          criteria_scores: s.criteria_scores,
          highlights: s.highlights,
          red_flags: s.red_flags,
          claude_reasoning: s.claude_reasoning,
        }))
      }
    }
  }

  return (
    <ListingDetail
      listing={listing}
      score={scoreRow ?? null}
      criteria={criteria ?? []}
      householdScores={householdScores}
      currentUserId={user.id}
    />
  )
}
