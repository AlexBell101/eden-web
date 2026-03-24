'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface CriterionInput {
  id?: string
  name: string
  description: string
  weight: number // 0.0 to 1.0 (normalized)
  scoring_prompt?: string | null
  sort_order: number
  is_default?: boolean
}

function normalizeWeights(criteria: CriterionInput[]): CriterionInput[] {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0)
  if (total === 0) return criteria
  return criteria.map((c) => ({ ...c, weight: c.weight / total }))
}

export async function saveCriteria(criteria: CriterionInput[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const normalized = normalizeWeights(criteria)

  const rows = normalized.map((c) => ({
    ...(c.id ? { id: c.id } : {}),
    user_id: user.id,
    name: c.name,
    description: c.description,
    weight: c.weight,
    scoring_prompt: c.scoring_prompt ?? null,
    sort_order: c.sort_order,
    is_default: c.is_default ?? false,
  }))

  const { error } = await supabase
    .from('criteria')
    .upsert(rows, { onConflict: 'id' })

  if (error) throw new Error(error.message)

  revalidatePath('/criteria')
}

export async function addCriterion(criterion: Omit<CriterionInput, 'id'>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('criteria')
    .insert({
      user_id: user.id,
      name: criterion.name,
      description: criterion.description,
      weight: criterion.weight,
      scoring_prompt: criterion.scoring_prompt ?? null,
      sort_order: criterion.sort_order,
      is_default: false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/criteria')
  return data
}

export async function deleteCriterion(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('criteria')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/criteria')
}
