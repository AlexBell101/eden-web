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

export async function cancelSearch() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('profiles')
    .update({
      scrape_requested_at: null,
      scrape_status: null,
      scrape_progress: null,
    })
    .eq('id', user.id)

  revalidatePath('/feed')
}

export async function requestSearch(): Promise<{
  dbUpdated: boolean
  scraperCalled: boolean
  scraperResponse: string | null
  scraperUrlConfigured: boolean
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Always set the DB flag first
  const { error: dbError } = await supabase
    .from('profiles')
    .update({
      scrape_requested_at: new Date().toISOString(),
      scrape_status: 'queued',
      scrape_progress: null,
    })
    .eq('id', user.id)

  const scraperUrl = process.env.SCRAPER_URL
  const scraperSecret = process.env.SCRAPER_SECRET

  if (!scraperUrl) {
    return {
      dbUpdated: !dbError,
      scraperCalled: false,
      scraperResponse: null,
      scraperUrlConfigured: false,
      error: dbError?.message ?? null,
    }
  }

  try {
    const res = await fetch(`${scraperUrl}/run`, {
      method: 'POST',
      headers: scraperSecret ? { Authorization: `Bearer ${scraperSecret}` } : {},
      signal: AbortSignal.timeout(8000),
    })
    const body = await res.json().catch(() => null)
    return {
      dbUpdated: !dbError,
      scraperCalled: true,
      scraperResponse: res.ok ? (body?.status ?? 'ok') : `HTTP ${res.status}`,
      scraperUrlConfigured: true,
      error: res.ok ? null : `Scraper returned ${res.status}`,
    }
  } catch (err) {
    return {
      dbUpdated: !dbError,
      scraperCalled: true,
      scraperResponse: null,
      scraperUrlConfigured: true,
      error: err instanceof Error ? err.message : 'Failed to reach scraper',
    }
  }
}

export async function checkScraperHealth(): Promise<{
  urlConfigured: boolean
  reachable: boolean
  busy: boolean
  lastRun: string | null
  scheduleHours: number | null
  rapidApiKeySet: boolean | null
  error: string | null
}> {
  const scraperUrl = process.env.SCRAPER_URL
  const scraperSecret = process.env.SCRAPER_SECRET

  if (!scraperUrl) {
    return { urlConfigured: false, reachable: false, busy: false, lastRun: null, scheduleHours: null, rapidApiKeySet: null, error: 'SCRAPER_URL not set in environment' }
  }

  try {
    const res = await fetch(`${scraperUrl}/health`, {
      headers: scraperSecret ? { Authorization: `Bearer ${scraperSecret}` } : {},
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      return { urlConfigured: true, reachable: false, busy: false, lastRun: null, scheduleHours: null, rapidApiKeySet: null, error: `HTTP ${res.status}` }
    }
    const data = await res.json()
    return {
      urlConfigured: true,
      reachable: true,
      busy: data.busy ?? false,
      lastRun: data.last_run ?? null,
      scheduleHours: data.schedule_hours ?? null,
      rapidApiKeySet: data.rapidapi_key_set ?? null,
      error: null,
    }
  } catch (err) {
    return {
      urlConfigured: true,
      reachable: false,
      busy: false,
      lastRun: null,
      scheduleHours: null,
      rapidApiKeySet: null,
      error: err instanceof Error ? err.message : 'Unreachable',
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
