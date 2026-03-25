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

  // Always set the DB flag first — scraper will honour it even on next scheduled run
  await supabase
    .from('profiles')
    .update({
      scrape_requested_at: new Date().toISOString(),
      scrape_status: 'queued',
      scrape_progress: null,
    })
    .eq('id', user.id)

  // Best-effort: wake the scraper server immediately.
  // Fails silently if SCRAPER_URL is not set or server is unreachable.
  const scraperUrl = process.env.SCRAPER_URL
  const scraperSecret = process.env.SCRAPER_SECRET
  if (scraperUrl) {
    try {
      await fetch(`${scraperUrl}/run`, {
        method: 'POST',
        headers: scraperSecret ? { Authorization: `Bearer ${scraperSecret}` } : {},
        signal: AbortSignal.timeout(5000),
      })
    } catch {
      // Scraper unreachable — DB flag is set, will run on next scheduled run
    }
  }
}

export async function getSearchStatus(): Promise<{
  status: string | null
  progress: { found: number; scored: number; total: number; new_scores: number } | null
  lastScrapedAt: string | null
  requestedAt: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: null, progress: null, lastScrapedAt: null, requestedAt: null }

  const { data } = await supabase
    .from('profiles')
    .select('scrape_status, scrape_progress, last_scraped_at, scrape_requested_at')
    .eq('id', user.id)
    .single()

  return {
    status: data?.scrape_status ?? null,
    progress: data?.scrape_progress ?? null,
    lastScrapedAt: data?.last_scraped_at ?? null,
    requestedAt: data?.scrape_requested_at ?? null,
  }
}
