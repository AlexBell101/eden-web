'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createHousehold, inviteMember, leaveHousehold } from '@/app/actions/household'
import { cn } from '@/lib/utils'

interface Member {
  user_id: string
  display_name: string | null
  email: string | null
}

interface Invite {
  email: string
  accepted: boolean
}

interface HouseholdSetupProps {
  userId: string
  household: { id: string; name: string | null } | null
  role: string | null
  members: Member[]
  invites: Invite[]
}

export function HouseholdSetup({ userId, household, role, members, invites }: HouseholdSetupProps) {
  const [isPending, startTransition] = useTransition()
  const [householdName, setHouseholdName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [message, setMessage] = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await createHousehold(householdName || 'Our Home Search')
      setMessage('Household created!')
    })
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!household || !inviteEmail) return
    startTransition(async () => {
      await inviteMember(household.id, inviteEmail)
      setInviteEmail('')
      setMessage(`Invite sent to ${inviteEmail}`)
    })
  }

  function handleLeave() {
    if (!confirm('Leave this household? This cannot be undone.')) return
    startTransition(async () => {
      await leaveHousehold()
      setMessage('You have left the household.')
    })
  }

  // No household yet
  if (!household) {
    return (
      <div className="max-w-lg space-y-8">
        {/* Explainer */}
        <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-3">
          <div className="text-4xl">👫</div>
          <h2 className="text-lg font-semibold">Find a place you&apos;ll both love</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Create a household and invite your partner or roommate. Eden will score listings
            against both of your criteria and tell you — by name — who will love what about each place.
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {[
              '🎯 Individual scores for each person',
              '🤝 A combined household score',
              '💬 Claude narrates who the listing appeals to and why',
              '🔍 Dealbreaker detection for both of you',
            ].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Household name</label>
            <Input
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g. Alex & Hannah's Search"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create household'}
          </Button>
          {message && <p className="text-sm text-green-600">{message}</p>}
        </form>
      </div>
    )
  }

  // Has household
  return (
    <div className="max-w-lg space-y-8">
      {/* Household header */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{household.name || 'Your Household'}</h2>
            <p className="text-sm text-muted-foreground capitalize">{role}</p>
          </div>
          <span className="text-3xl">🏠</span>
        </div>

        {/* Members */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Members</p>
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {(m.display_name || m.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{m.display_name || m.email}</p>
                {m.display_name && <p className="text-xs text-muted-foreground">{m.email}</p>}
              </div>
              {m.user_id === userId && (
                <span className="ml-auto text-xs text-muted-foreground">you</span>
              )}
            </div>
          ))}
        </div>

        {/* Pending invites */}
        {invites.filter(i => !i.accepted).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending Invites</p>
            {invites.filter(i => !i.accepted).map((invite) => (
              <div key={invite.email} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                {invite.email}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite form */}
      <form onSubmit={handleInvite} className="space-y-3">
        <p className="text-sm font-medium">Invite someone</p>
        <div className="flex gap-2">
          <Input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="partner@email.com"
            className="flex-1"
          />
          <Button type="submit" disabled={isPending || !inviteEmail}>
            {isPending ? 'Sending…' : 'Invite'}
          </Button>
        </div>
        {message && <p className="text-sm text-green-600">{message}</p>}
      </form>

      {/* Leave */}
      <div className="pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleLeave}
          disabled={isPending}
          className="text-sm text-destructive hover:underline"
        >
          Leave household
        </button>
      </div>
    </div>
  )
}
