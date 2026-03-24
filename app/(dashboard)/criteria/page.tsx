import { createClient } from '@/lib/supabase/server'
import { CriteriaBuilder } from '@/components/criteria/CriteriaBuilder'
import { seedDefaultCriteria } from '@/app/actions/criteria'
import type { Criterion } from '@/components/criteria/CriterionCard'

async function getCriteriaAndVibe(userId: string): Promise<{
  criteria: Criterion[]
  vibeText: string
}> {
  const supabase = await createClient()

  const [{ data: criteriaData }, { data: profile }] = await Promise.all([
    supabase
      .from('criteria')
      .select('id, name, description, weight, sort_order, is_default, scoring_prompt')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('profiles')
      .select('vibe_text')
      .eq('id', userId)
      .single(),
  ])

  const criteria = (criteriaData ?? []).map((row) => ({
    id: row.id as string,
    name: (row.name as string) ?? '',
    description: (row.description as string) ?? '',
    weight: (row.weight as number) ?? 0,
    sort_order: (row.sort_order as number) ?? 0,
    is_default: (row.is_default as boolean) ?? false,
    scoring_prompt: (row.scoring_prompt as string | null) ?? null,
  }))

  return {
    criteria,
    vibeText: (profile?.vibe_text as string) ?? '',
  }
}

export default async function CriteriaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Auto-seed defaults if user has no criteria yet
  const { criteria, vibeText } = await getCriteriaAndVibe(user.id)
  let finalCriteria = criteria
  if (criteria.length === 0) {
    await seedDefaultCriteria()
    const { criteria: seeded } = await getCriteriaAndVibe(user.id)
    finalCriteria = seeded
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Criteria</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell Eden what matters — in your own words and with weighted sliders.
          Claude uses both to score and personalise every listing.
        </p>
      </div>

      <CriteriaBuilder initialCriteria={finalCriteria} initialVibeText={vibeText} />
    </div>
  )
}
