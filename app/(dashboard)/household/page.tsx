import { createClient } from '@/lib/supabase/server'
import { HouseholdSetup } from '@/components/household/HouseholdSetup'

export default async function HouseholdPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check if user is already in a household
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role, households(id, name)')
    .eq('user_id', user.id)
    .maybeSingle()

  let members: Array<{ user_id: string; display_name: string | null; email: string | null }> = []
  let invites: Array<{ email: string; accepted: boolean }> = []

  if (membership?.household_id) {
    const [{ data: membersData }, { data: invitesData }] = await Promise.all([
      supabase
        .from('household_members')
        .select('user_id, profiles(display_name, email)')
        .eq('household_id', membership.household_id),
      supabase
        .from('household_invites')
        .select('email, accepted')
        .eq('household_id', membership.household_id),
    ])

    members = (membersData || []).map((m: any) => ({
      user_id: m.user_id,
      display_name: m.profiles?.display_name ?? null,
      email: m.profiles?.email ?? null,
    }))

    invites = invitesData || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Eden Together 🌿</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find a home you&apos;ll both love. Invite a partner or roommate to combine your criteria.
        </p>
      </div>
      <HouseholdSetup
        userId={user.id}
        household={membership ? { id: membership.household_id, name: (membership.households as any)?.name } : null}
        role={membership?.role ?? null}
        members={members}
        invites={invites}
      />
    </div>
  )
}
