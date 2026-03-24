'use client'

import Link from 'next/link'
import { ArrowLeft, Home, ExternalLink, MapPin, Check, X } from 'lucide-react'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Listing {
  id: string
  address: string
  neighborhood: string | null
  city: string | null
  rent: number
  bedrooms: number
  bathrooms: number
  sqft: number | null
  images: string[] | null
  pet_policy: string | null
  laundry: string | null
  parking: string | null
  furnished: boolean | null
  date_posted: string | null
  url: string | null
}

interface CriterionScore {
  score: number
  reasoning: string
}

interface Score {
  overall_score: number
  claude_reasoning: string | null
  criteria_scores: Record<string, CriterionScore> | null
  red_flags: string[] | null
  highlights: string[] | null
}

interface Criterion {
  id: string
  name: string
}

interface HouseholdMemberScore {
  user_id: string
  display_name: string | null
  email: string | null
  overall_score: number
  criteria_scores: Record<string, CriterionScore> | null
  highlights: string[] | null
  red_flags: string[] | null
  claude_reasoning: string | null
}

interface ListingDetailProps {
  listing: Listing
  score: Score | null
  criteria: Criterion[]
  householdScores?: HouseholdMemberScore[]
  currentUserId?: string
}

function formatRent(rent: number): string {
  return `$${rent.toLocaleString()}/mo`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ScoreBar({ score, color }: { score: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100))
  const barClass = color
    ? ''
    : score >= 8
      ? 'score-bar-great'
      : score >= 6
        ? 'score-bar-good'
        : 'score-bar-low'

  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn('h-full rounded-full transition-all', barClass)}
        style={{ width: `${pct}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  )
}

function memberName(m: HouseholdMemberScore) {
  return m.display_name || m.email?.split('@')[0] || 'Partner'
}

function scoreColor(score: number) {
  if (score >= 8) return '#7FA36C'
  if (score >= 6) return '#B98A52'
  return '#666B75'
}

export function ListingDetail({ listing, score, criteria, householdScores = [], currentUserId }: ListingDetailProps) {
  const criteriaMap = Object.fromEntries(criteria.map((c) => [c.id, c.name]))
  const criteriaEntries = score?.criteria_scores ? Object.entries(score.criteria_scores) : []
  const isTogetherListing = householdScores.length > 1

  // The household narrative (shared by all members — use any member's claude_reasoning)
  const householdNarrative = isTogetherListing
    ? householdScores.find((m) => m.claude_reasoning)?.claude_reasoning
    : null

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Feed
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight leading-snug">
            {listing.address}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {listing.neighborhood && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                <MapPin className="size-3" />
                {listing.neighborhood}
              </span>
            )}
            <span className="text-xl font-semibold text-foreground">
              {formatRent(listing.rent)}
            </span>
            {isTogetherListing && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#8B6F8F]/30 bg-[#8B6F8F]/10 px-2.5 py-0.5 text-xs font-semibold text-[#8B6F8F]">
                👫 Together
              </span>
            )}
          </div>
        </div>
        {score && (
          <ScoreBadge score={score.overall_score} className="text-base px-3 py-1" />
        )}
      </div>

      {/* Image gallery */}
      {listing.images && listing.images.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {listing.images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${listing.address} photo ${i + 1}`}
              className="h-52 w-80 shrink-0 rounded-xl object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Home className="size-10" />
            <span className="text-sm">No photos available</span>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: score breakdown (2/3) */}
        <div className="space-y-6 lg:col-span-2">

          {/* ── TOGETHER MODE ── */}
          {isTogetherListing && (
            <div className="rounded-xl border border-[#8B6F8F]/25 bg-[#8B6F8F]/5 overflow-hidden">
              {/* Household narrative */}
              {householdNarrative && (
                <div className="px-5 py-4 border-b border-[#8B6F8F]/15">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8B6F8F] mb-2">
                    👫 Eden Together
                  </p>
                  <blockquote className="text-sm leading-relaxed text-foreground italic">
                    &ldquo;{householdNarrative}&rdquo;
                  </blockquote>
                </div>
              )}

              {/* Per-member scores side by side */}
              <div className={cn(
                'grid divide-x divide-[#8B6F8F]/15',
                householdScores.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
              )}>
                {householdScores.map((m) => {
                  const isMe = m.user_id === currentUserId
                  const memberCriteriaEntries = m.criteria_scores
                    ? Object.entries(m.criteria_scores)
                    : []
                  return (
                    <div key={m.user_id} className="px-5 py-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {memberName(m)} {isMe && <span className="text-[10px] text-muted-foreground font-normal">(you)</span>}
                          </p>
                        </div>
                        <span
                          className="text-lg font-bold tabular-nums"
                          style={{ color: scoreColor(m.overall_score) }}
                        >
                          {m.overall_score.toFixed(1)}
                        </span>
                      </div>

                      {/* Mini score bars */}
                      {memberCriteriaEntries.length > 0 && (
                        <div className="space-y-2">
                          {memberCriteriaEntries.slice(0, 4).map(([cid, data]) => (
                            <div key={cid} className="space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs text-muted-foreground truncate">
                                  {criteriaMap[cid] ?? cid}
                                </span>
                                <span
                                  className="text-xs font-semibold tabular-nums shrink-0"
                                  style={{ color: scoreColor(data.score) }}
                                >
                                  {data.score.toFixed(0)}
                                </span>
                              </div>
                              <ScoreBar score={data.score} color={scoreColor(data.score)} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Highlights */}
                      {m.highlights && m.highlights.length > 0 && (
                        <ul className="space-y-1">
                          {m.highlights.slice(0, 2).map((h, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-[#7FA36C]">
                              <Check className="mt-0.5 size-3 shrink-0" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Red flags */}
                      {m.red_flags && m.red_flags.length > 0 && (
                        <ul className="space-y-1">
                          {m.red_flags.slice(0, 2).map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-destructive">
                              <X className="mt-0.5 size-3 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── SOLO / PERSONAL SCORE ── */}
          {score ? (
            <>
              {/* Claude's Take */}
              {score.claude_reasoning && !isTogetherListing && (
                <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Eden&apos;s Take
                  </h2>
                  <blockquote className="text-sm leading-relaxed text-foreground italic">
                    &ldquo;{score.claude_reasoning}&rdquo;
                  </blockquote>
                </div>
              )}

              {/* Red flags */}
              {score.red_flags && score.red_flags.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Red Flags
                  </h2>
                  <ul className="space-y-1.5">
                    {score.red_flags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-destructive">
                        <X className="mt-0.5 size-4 shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Highlights */}
              {score.highlights && score.highlights.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Highlights
                  </h2>
                  <ul className="space-y-1.5">
                    {score.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#7FA36C' }}>
                        <Check className="mt-0.5 size-4 shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Per-criteria score bars */}
              {criteriaEntries.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Score Breakdown
                  </h2>
                  <div className="space-y-5">
                    {criteriaEntries.map(([criterionId, data]) => (
                      <div key={criterionId} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {criteriaMap[criterionId] ?? criterionId}
                          </span>
                          <span
                            className="text-sm font-semibold tabular-nums"
                            style={{ color: scoreColor(data.score) }}
                          >
                            {data.score.toFixed(1)}
                          </span>
                        </div>
                        <ScoreBar score={data.score} />
                        {data.reasoning && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {data.reasoning}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-8 text-center text-sm text-muted-foreground">
              No score available for this listing yet.
            </div>
          )}
        </div>

        {/* Right: listing details sidebar (1/3) */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4">
              <span className="text-2xl font-bold text-foreground">
                {formatRent(listing.rent)}
              </span>
              <span className="ml-1 text-sm text-muted-foreground">/ month</span>
            </div>

            <dl className="space-y-3 text-sm">
              <DetailRow label="Beds" value={`${listing.bedrooms} ${listing.bedrooms === 1 ? 'bedroom' : 'bedrooms'}`} />
              <DetailRow label="Baths" value={`${listing.bathrooms} ${listing.bathrooms === 1 ? 'bathroom' : 'bathrooms'}`} />
              {listing.sqft && (
                <DetailRow label="Size" value={`${listing.sqft.toLocaleString()} sqft`} />
              )}
              {listing.neighborhood && (
                <DetailRow label="Neighborhood" value={listing.neighborhood} />
              )}
              {listing.city && (
                <DetailRow label="City" value={listing.city} />
              )}
              {listing.pet_policy && (
                <DetailRow label="Pets" value={listing.pet_policy} />
              )}
              {listing.laundry && (
                <DetailRow label="Laundry" value={listing.laundry} />
              )}
              {listing.parking && (
                <DetailRow label="Parking" value={listing.parking} />
              )}
              {listing.furnished !== null && (
                <DetailRow label="Furnished" value={listing.furnished ? 'Yes' : 'No'} />
              )}
              {listing.date_posted && (
                <DetailRow label="Posted" value={formatDate(listing.date_posted)} />
              )}
            </dl>

            {listing.url && (
              <div className="mt-5">
                <Button asChild className="w-full" variant="outline">
                  <a href={listing.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 size-4" />
                    View Original Listing
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  )
}
