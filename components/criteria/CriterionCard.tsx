'use client'

import { useState } from 'react'
import { GripVertical, Pencil, Trash2, Lock, Check, X } from 'lucide-react'
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
                    disabled={criterion.is_default}
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
                    {criterion.is_default ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled
                        title="Default criteria cannot be deleted"
                        className="cursor-not-allowed"
                      >
                        <Lock className="size-3.5 text-muted-foreground/50" />
                      </Button>
                    ) : (
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
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {editing ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <Textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  className="text-sm min-h-[60px] resize-none"
                  placeholder="Describe what this criterion evaluates..."
                />
              </div>
            ) : (
              criterion.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {criterion.description}
                </p>
              )
            )}

            {/* Scoring prompt (edit mode only) */}
            {editing && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Custom scoring hint{' '}
                  <span className="font-normal">(optional, sent to Claude)</span>
                </label>
                <Textarea
                  value={draftScoringPrompt}
                  onChange={(e) => setDraftScoringPrompt(e.target.value)}
                  className="text-sm min-h-[48px] resize-none"
                  placeholder="e.g. Penalize if commute exceeds 45 minutes..."
                />
              </div>
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
