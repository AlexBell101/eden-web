'use client'

import { useState } from 'react'
import { GripVertical, Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface Criterion {
  id: string
  name: string
  description: string
  weight: number // 0.0 to 1.0
  scoring_prompt?: string | null
  sort_order: number
  is_default: boolean
}

interface CriterionCardProps {
  criterion: Criterion
  /** Normalized percentage (0–100) this criterion represents across all criteria */
  displayPercent: number
  onPercentChange: (id: string, newPercent: number) => void
  onChange: (updated: Criterion) => void
  onDelete: (id: string) => void
  disabled?: boolean
}

export function CriterionCard({
  criterion,
  displayPercent,
  onPercentChange,
  onChange,
  onDelete,
  disabled,
}: CriterionCardProps) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(criterion.name)
  const [draftDescription, setDraftDescription] = useState(criterion.description)
  const [draftScoringPrompt, setDraftScoringPrompt] = useState(
    criterion.scoring_prompt ?? ''
  )

  function handleSliderChange(values: number[]) {
    onPercentChange(criterion.id, values[0])
  }

  function handleEditSave() {
    onChange({
      ...criterion,
      name: draftName.trim() || criterion.name,
      description: draftDescription,
      scoring_prompt: draftScoringPrompt || null,
    })
    setEditing(false)
  }

  function handleEditCancel() {
    setDraftName(criterion.name)
    setDraftDescription(criterion.description)
    setDraftScoringPrompt(criterion.scoring_prompt ?? '')
    setEditing(false)
  }

  return (
    <Card
      className={cn(
        'transition-shadow',
        disabled && 'opacity-60',
        editing && 'ring-2 ring-ring'
      )}
    >
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          {/* Drag handle (visual only) */}
          <div className="mt-0.5 cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0">
            <GripVertical className="size-4" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {editing ? (
                  <Input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="h-7 text-sm font-semibold"
                    placeholder="Criterion name"
                  />
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {criterion.name}
                    </span>
                    {criterion.is_default && (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                        Default
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {editing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleEditSave}
                      title="Save"
                    >
                      <Check className="size-3.5 text-emerald-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleEditCancel}
                      title="Cancel"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditing(true)}
                      title="Edit"
                      disabled={disabled}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(criterion.id)}
                      title="Delete criterion"
                      disabled={disabled}
                      className="hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {editing ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  What Claude looks for{' '}
                  <span className="font-normal">— be specific, this drives the score</span>
                </label>
                <Textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  className="text-sm min-h-[72px] resize-none"
                  placeholder="e.g. Private outdoor space or dog park within 5 min walk. Pet-friendly building essential."
                />
              </div>
            ) : (
              criterion.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {criterion.description}
                </p>
              )
            )}

            {/* Weight slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  Weight
                </label>
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  {displayPercent}%
                </span>
              </div>
              <Slider
                min={1}
                max={97}
                step={1}
                value={[displayPercent]}
                onValueChange={handleSliderChange}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
