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

  const [{ data: listing }, { data: scoreRow }, { data: criteria }] = await Promise.all([
    supabase.from('listings').select('*').eq('id', id).single(),
    supabase
      .from('scores')
      .select('*')
      .eq('listing_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('criteria').select('*').eq('user_id', user.id),
  ])

  if (!listing) {
    notFound()
  }

  return (
    <ListingDetail
      listing={listing}
      score={scoreRow ?? null}
      criteria={criteria ?? []}
    />
  )
}
