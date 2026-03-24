'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { updateProfile } from '@/app/actions/profile'
import { MapRegionSelector } from '@/components/settings/MapRegionSelector'
import { cn } from '@/lib/utils'

interface SearchBounds {
  sw_lat: number
  sw_lng: number
  ne_lat: number
  ne_lng: number
  label: string
}

interface Profile {
  id: string
  display_name: string | null
  score_threshold: number | null
  max_rent: number | null
  min_bedrooms: number | null
  pet_required: boolean | null
  pet_type: string | null
  notification_preference: string | null
  notification_time: string | null
  target_city: string | null
  search_bounds: SearchBounds | null
}

interface SettingsFormProps {
  profile: Profile | null
}

const BEDROOM_OPTIONS = [
  { value: '0', label: 'Studio' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3+' },
]

export function SettingsForm({ profile }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [scoreThreshold, setScoreThreshold] = useState<number>(
    profile?.score_threshold ?? 7.0
  )
  const [maxRent, setMaxRent] = useState(
    profile?.max_rent != null ? String(profile.max_rent) : ''
  )
  const [minBedrooms, setMinBedrooms] = useState(
    profile?.min_bedrooms != null ? String(profile.min_bedrooms) : '1'
  )
  const [petRequired, setPetRequired] = useState(profile?.pet_required ?? false)
  const [petType, setPetType] = useState(profile?.pet_type ?? '')
  const [notificationPreference, setNotificationPreference] = useState(
    profile?.notification_preference ?? 'none'
  )
  const [notificationTime, setNotificationTime] = useState(
    profile?.notification_time ?? '08:00'
  )
  const [targetCity, setTargetCity] = useState(profile?.target_city ?? '')
  const [searchBounds, setSearchBounds] = useState<SearchBounds | null>(
    profile?.search_bounds ?? null
  )
  const [listingType, setListingType] = useState(profile?.listing_type ?? 'for_rent')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)

    startTransition(async () => {
      await updateProfile({
        display_name: displayName || null,
        score_threshold: scoreThreshold,
        max_rent: maxRent ? Number(maxRent) : null,
        min_bedrooms: minBedrooms ? Number(minBedrooms) : null,
        pet_required: petRequired,
        pet_type: petRequired ? petType || null : null,
        notification_preference: notificationPreference,
        notification_time:
          notificationPreference === 'email' ? notificationTime || null : null,
        target_city: searchBounds?.label ?? targetCity ?? null,
        search_bounds: searchBounds ?? null,
        listing_type: listingType,
      })
      setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-xl">
      {/* Display name */}
      <FieldGroup label="Display name" htmlFor="display-name">
        <Input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
        />
      </FieldGroup>

      {/* Score threshold */}
      <FieldGroup
        label={`Minimum score to surface listings — ${scoreThreshold.toFixed(1)}`}
        htmlFor="score-threshold"
      >
        <Slider
          id="score-threshold"
          min={1}
          max={10}
          step={0.5}
          value={[scoreThreshold]}
          onValueChange={([val]) => setScoreThreshold(val)}
          className="mt-2"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>1.0</span>
          <span>10.0</span>
        </div>
      </FieldGroup>

      {/* Max rent */}
      <FieldGroup label="Max rent" htmlFor="max-rent">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            $
          </span>
          <Input
            id="max-rent"
            type="number"
            min={0}
            step={50}
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            placeholder="No cap"
            className="pl-7"
          />
        </div>
      </FieldGroup>

      {/* Min bedrooms */}
      <FieldGroup label="Min bedrooms" htmlFor="min-bedrooms">
        <div className="flex gap-2">
          {BEDROOM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMinBedrooms(opt.value)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                minBedrooms === opt.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FieldGroup>

      {/* Pet required */}
      <FieldGroup label="Pets" htmlFor="pet-required">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            id="pet-required"
            aria-checked={petRequired}
            onClick={() => setPetRequired((prev) => !prev)}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              petRequired ? 'bg-foreground' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
                petRequired ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
          <span className="text-sm text-foreground">Pet-friendly required</span>
        </div>
        {petRequired && (
          <div className="mt-3">
            <Input
              type="text"
              value={petType}
              onChange={(e) => setPetType(e.target.value)}
              placeholder="e.g. dog, cat, large dog..."
            />
          </div>
        )}
      </FieldGroup>

      {/* Notification preference */}
      <FieldGroup label="Notifications" htmlFor="notification-preference">
        <div className="space-y-2">
          {[
            { value: 'email', label: 'Daily email digest' },
            { value: 'none', label: 'None' },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2.5"
            >
              <input
                type="radio"
                name="notification-preference"
                value={opt.value}
                checked={notificationPreference === opt.value}
                onChange={() => setNotificationPreference(opt.value)}
                className="accent-foreground"
              />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
        </div>
        {notificationPreference === 'email' && (
          <div className="mt-3">
            <Label htmlFor="notification-time" className="mb-1 block text-xs text-muted-foreground">
              Send at
            </Label>
            <Input
              id="notification-time"
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              className="w-36"
            />
          </div>
        )}
      </FieldGroup>

      {/* Listing type */}
      <FieldGroup label="I'm looking to">
        <div className="flex gap-2">
          {[
            { value: 'for_rent', label: '🏠 Rent' },
            { value: 'for_sale', label: '🔑 Buy' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setListingType(opt.value)}
              className={cn(
                'rounded-lg border px-5 py-2 text-sm font-medium transition-colors',
                listingType === opt.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FieldGroup>

      {/* Search area */}
      <FieldGroup label="Search area">
        <p className="text-xs text-muted-foreground mb-2">
          Search for a neighborhood or city, then zoom to your ideal area and click "Use this area".
        </p>
        <MapRegionSelector
          value={searchBounds}
          onChange={(bounds) => {
            setSearchBounds(bounds)
            setTargetCity(bounds.label)
          }}
        />
      </FieldGroup>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save settings'}
        </Button>
        {saved && !isPending && (
          <span className="text-sm text-green-600">Settings saved.</span>
        )}
      </div>
    </form>
  )
}

function FieldGroup({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}
