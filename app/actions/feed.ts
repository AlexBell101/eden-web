'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function dismissListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('scores')
    .update({ dismissed: true, dismissed_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('listing_id', listingId)

  if (error) throw new Error(error.message)
  revalidatePath('/feed')
  revalidatePath('/history')
}

export async function restoreListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('scores')
    .update({ dismissed: false, dismissed_at: null })
    .eq('user_id', user.id)
    .eq('listing_id', listingId)

  if (error) throw new Error(error.message)
  revalidatePath('/feed')
  revalidatePath('/history')
}

export async function requestSearch() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('profiles')
    .update({ scrape_requested_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
}
