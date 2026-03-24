import { createClient } from '@/lib/supabase/server'
import { CriteriaBuilder } from '@/components/criteria/CriteriaBuilder'
import type { Criterion } from '@/components/criteria/CriterionCard'

async function getCriteria(userId: string): Promise<Criterion[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('criteria')
    .select('id, name, description, weight, sort_order, is_default, scoring_prompt')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id as string,
    name: (row.name as string) ?? '',
    description: (row.description as string) ?? '',
    weight: (row.weight as number) ?? 0,
    sort_order: (row.sort_order as number) ?? 0,
    is_default: (row.is_default as boolean) ?? false,
    scoring_prompt: (row.scoring_prompt as string | null) ?? null,
  }))
}

export default async function CriteriaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // User is guaranteed by the dashboard layout
  if (!user) return null

  const criteria = await getCriteria(user.id)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Criteria</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define and weight the factors Eden uses to score listings for you.
          Weights are normalized automatically — set them relative to each other.
        </p>
      </div>

      <CriteriaBuilder initialCriteria={criteria} />
    </div>
  )
}
