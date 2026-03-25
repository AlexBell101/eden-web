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

  // Separate existing rows (real UUID) from new ones (temp_ client id).
  // They must be sent in two separate DB calls — mixing rows with and without
  // an id field causes PostgREST to include id as a column for all rows,
  // sending NULL for the new ones which Postgres rejects as a PK violation.
  const isRealId = (id?: string) => !!id && !id.startsWith('temp_')

  const baseFields = (c: CriterionInput, i: number) => ({
    user_id: user.id,
    name: c.name,
    description: c.description,
    weight: c.weight,
    scoring_prompt: c.scoring_prompt ?? null,
    sort_order: c.sort_order ?? i,
    is_default: c.is_default ?? false,
  })

  const existingRows = normalized
    .filter((c) => isRealId(c.id))
    .map((c, i) => ({ id: c.id as string, ...baseFields(c, i) }))

  const newRows = normalized
    .filter((c) => !isRealId(c.id))
    .map((c, i) => baseFields(c, existingRows.length + i))

  if (existingRows.length > 0) {
    const { error } = await supabase
      .from('criteria')
      .upsert(existingRows, { onConflict: 'id' })
    if (error) throw new Error(error.message)
  }

  if (newRows.length > 0) {
    const { error } = await supabase.from('criteria').insert(newRows)
    if (error) throw new Error(error.message)
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
    name: 'Walkability',
    description: 'Proximity to shops, cafés, restaurants, and everyday errands on foot.',
    weight: 0.25,
    is_default: true,
  },
  {
    name: 'Natural light',
    description: 'Sunlight throughout the day — windows, orientation, open layout.',
    weight: 0.20,
    is_default: true,
  },
  {
    name: 'Value for money',
    description: 'Rent (or price) relative to size, quality, and location.',
    weight: 0.20,
    is_default: true,
  },
  {
    name: 'Neighborhood feel',
    description: 'Character, safety, energy, and vibe of the surrounding area.',
    weight: 0.20,
    is_default: true,
  },
  {
    name: 'Space & layout',
    description: 'Room sizes, storage, flow between spaces, outdoor area.',
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
