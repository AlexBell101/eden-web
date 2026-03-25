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

  // DELETE + INSERT instead of upsert.
  // Supabase RLS UPDATE policies can silently block upsert (no error returned,
  // but 0 rows written). DELETE and INSERT policies are both confirmed working,
  // so we wipe and rewrite the user's full criteria set on every save.
  const { error: deleteError } = await supabase
    .from('criteria')
    .delete()
    .eq('user_id', user.id)

  if (deleteError) throw new Error(deleteError.message)

  if (normalized.length > 0) {
    const rows = normalized.map((c, i) => ({
      user_id: user.id,
      name: c.name,
      description: c.description,
      weight: c.weight,
      scoring_prompt: c.scoring_prompt ?? null,
      sort_order: c.sort_order ?? i,
      is_default: c.is_default ?? false,
    }))

    const { error: insertError } = await supabase.from('criteria').insert(rows)
    if (insertError) throw new Error(insertError.message)
  }

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

const DEFAULT_CRITERIA: Omit<CriterionInput, 'sort_order'>[] = [
  {
    name: 'Dog-friendly & outdoor access',
    description: 'Private outdoor space (garden, yard, balcony) or a dog park nearby. Pet-friendly building policy is essential. Look for mentions of parks, trails, or green space within walking distance.',
    weight: 0.25,
    is_default: true,
  },
  {
    name: 'SF access',
    description: 'Reasonable commute to San Francisco without needing a car every day — BART, Caltrain, ferry, or a short drive. Does not need to be daily-commute close, but occasional trips should feel easy.',
    weight: 0.20,
    is_default: true,
  },
  {
    name: 'Character & feel',
    description: 'Modern interior finish OR interesting exterior (Victorian, craftsman, converted warehouse, interesting architecture). Should not feel like a generic apartment block. A blank canvas is fine if the bones are good.',
    weight: 0.20,
    is_default: true,
  },
  {
    name: 'Walkable neighbourhood',
    description: 'Restaurants, cafés, and everyday errands reachable on foot. Not a dealbreaker but a strong plus — neighbourhoods with street life, local spots, and energy score higher.',
    weight: 0.20,
    is_default: true,
  },
  {
    name: 'Value for money',
    description: 'Rent relative to size, quality, and location. Penalise listings that are overpriced for what they offer or the area.',
    weight: 0.15,
    is_default: true,
  },
]

export async function seedDefaultCriteria() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Only seed if user has no criteria
  const { count } = await supabase
    .from('criteria')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (count && count > 0) return // already has criteria

  const rows = DEFAULT_CRITERIA.map((c, i) => ({
    user_id: user.id,
    name: c.name,
    description: c.description,
    weight: c.weight,
    scoring_prompt: null,
    sort_order: i,
    is_default: true,
  }))

  const { error } = await supabase.from('criteria').insert(rows)
  if (error) throw new Error(error.message)

  revalidatePath('/criteria')
}

export async function saveVibeText(vibeText: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, vibe_text: vibeText }, { onConflict: 'id' })

  if (error) throw new Error(error.message)
  revalidatePath('/criteria')
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
