import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { acceptInvite } from '@/app/actions/household'

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function JoinPage({ searchParams }: PageProps) {
  const { token } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Not logged in — redirect to login, come back after
    redirect(`/login?next=/join?token=${token}`)
  }

  if (!token) {
    redirect('/household')
  }

  try {
    await acceptInvite(token)
    redirect('/household?joined=true')
  } catch {
    redirect('/household?error=invalid_invite')
  }
}
