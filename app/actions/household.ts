'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createHousehold(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Create household
  const { data: household, error } = await supabase
    .from('households')
    .insert({ name, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Add creator as owner
  await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: user.id,
    role: 'owner',
  })

  revalidatePath('/household')
}

export async function inviteMember(householdId: string, email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Create invite record
  const { data: invite } = await supabase
    .from('household_invites')
    .insert({ household_id: householdId, email })
    .select()
    .single()

  // TODO: send email via Resend with invite link
  // The invite link will be: /join?token=<invite.token>
  console.log(`[Eden] Invite created for ${email}, token: ${invite?.token}`)

  revalidatePath('/household')
}

export async function acceptInvite(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Find the invite
  const { data: invite, error } = await supabase
    .from('household_invites')
    .select('*')
    .eq('token', token)
    .eq('accepted', false)
    .single()

  if (error || !invite) throw new Error('Invalid or expired invite')

  // Add user to household
  await supabase.from('household_members').insert({
    household_id: invite.household_id,
    user_id: user.id,
    role: 'member',
  })

  // Mark invite as accepted
  await supabase
    .from('household_invites')
    .update({ accepted: true })
    .eq('id', invite.id)

  revalidatePath('/household')
  return invite.household_id
}

export async function leaveHousehold() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('household_members')
    .delete()
    .eq('user_id', user.id)

  revalidatePath('/household')
}
