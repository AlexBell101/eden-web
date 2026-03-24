'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Email helper ─────────────────────────────────────────────────────────────
async function sendInviteEmail(params: {
  toEmail: string
  inviterName: string
  householdName: string
  token: string
}) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.log(`[Eden] RESEND_API_KEY not set — skipping email. Token: ${params.token}`)
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${siteUrl}/join?token=${params.token}`
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'invite@eden.app'

  const { Resend } = await import('resend')
  const resend = new Resend(resendKey)

  try {
    await resend.emails.send({
      from: `Eden <${fromEmail}>`,
      to: params.toEmail,
      subject: `${params.inviterName} invited you to find a home together on Eden`,
      html: `
        <div style="max-width:520px;margin:0 auto;font-family:system-ui,sans-serif;background:#0D0F12;color:#F5F1EA;padding:40px 32px;border-radius:16px;">
          <p style="font-size:22px;font-weight:600;margin:0 0 8px 0;">eden</p>
          <p style="color:#B7B0A3;font-size:13px;margin:0 0 32px 0;">AI-guided home search</p>
          <h1 style="font-size:24px;font-weight:600;margin:0 0 12px 0;line-height:1.2;">
            ${params.inviterName} wants to find a home with you
          </h1>
          <p style="color:#B7B0A3;font-size:15px;line-height:1.6;margin:0 0 28px 0;">
            You've been invited to join <strong style="color:#F5F1EA;">${params.householdName}</strong> on Eden Together —
            where both of your criteria are combined so you can see exactly how each listing fits you individually, and as a pair.
          </p>
          <a href="${inviteUrl}" style="display:inline-block;background:#7FA36C;color:#0D0F12;font-weight:600;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
            Accept invite →
          </a>
          <p style="color:#666B75;font-size:12px;margin:32px 0 0 0;line-height:1.6;">
            This invite link expires after use. If you weren't expecting this, you can safely ignore it.
          </p>
        </div>
      `,
    })
    console.log(`[Eden] Invite email sent to ${params.toEmail}`)
  } catch (err) {
    console.error(`[Eden] Failed to send invite email:`, err)
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createHousehold(name: string) {
  // 1. Verify user with session client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 2. Use admin client for writes (bypasses RLS — user already verified above)
  const admin = createAdminClient()

  const { data: household, error } = await admin
    .from('households')
    .insert({ name: name || 'Our Home Search', created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  const { error: memberError } = await admin
    .from('household_members')
    .insert({ household_id: household.id, user_id: user.id, role: 'owner' })

  if (memberError) throw new Error(memberError.message)

  revalidatePath('/household')
}

export async function inviteMember(householdId: string, email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const admin = createAdminClient()

  const { data: invite, error } = await admin
    .from('household_invites')
    .insert({ household_id: householdId, email })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (!invite?.token) {
    revalidatePath('/household')
    return
  }

  // Get inviter's display name + household name for the email
  const [{ data: profile }, { data: household }] = await Promise.all([
    admin.from('profiles').select('display_name, email').eq('id', user.id).single(),
    admin.from('households').select('name').eq('id', householdId).single(),
  ])

  const inviterName = profile?.display_name || profile?.email?.split('@')[0] || 'Someone'
  const householdName = household?.name || 'Our Home Search'

  await sendInviteEmail({ toEmail: email, inviterName, householdName, token: invite.token })

  revalidatePath('/household')
}

export async function acceptInvite(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const admin = createAdminClient()

  const { data: invite, error } = await admin
    .from('household_invites')
    .select('*')
    .eq('token', token)
    .eq('accepted', false)
    .single()

  if (error || !invite) throw new Error('Invalid or expired invite')

  await admin.from('household_members').insert({
    household_id: invite.household_id,
    user_id: user.id,
    role: 'member',
  })

  await admin
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

  const admin = createAdminClient()

  await admin
    .from('household_members')
    .delete()
    .eq('user_id', user.id)

  revalidatePath('/household')
}
