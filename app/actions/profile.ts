'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ProfileData {
  display_name: string | null
  score_threshold: number | null
  max_rent: number | null
  min_bedrooms: number | null
  pet_required: boolean
  pet_type: string | null
  notification_preference: string | null
  notification_time: string | null
  target_city: string | null
  search_bounds: object | null
  listing_type: string
}

export async function updateProfile(data: ProfileData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        ...data,
      },
      { onConflict: 'id' }
    )

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}
