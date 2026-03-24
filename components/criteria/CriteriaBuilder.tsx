'use client'

import { useState, useTransition } from 'react'
import { Plus, Save, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CriterionCard, type Criterion } from '@/components/criteria/CriterionCard'
import { WeightVisualizer } from '@/components/criteria/WeightVisualizer'
import { saveCriteria, deleteCriterion } from '@/app/actions/criteria'
import { cn } from '@/lib/utils'

interface CriteriaBuilderProps {
  initialCriteria: Criterion[]
}

function computeNormalizedPercents(criteria: Criterion[]): Map<string, number> {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0)
  const map = new Map<string, number>()
  criteria.forEach((c) => {
    map.set(c.id, total > 0 ? Math.round((c.weight / total) * 100) : 0)
  })
  return map
}

const EMPTY_DRAFT = {
  name: '',
  description: '',
  scoringPrompt: '',
  weight: 50,
}

export function CriteriaBuilder({ initialCriteria }: CriteriaBuilderProps) {
  const [criteria, setCriteria] = useState<Criterion[]>(initialCriteria)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const normalizedPercents = computeNormalizedPercents(criteria)

  const totalRawWeight = criteria.reduce((sum, c) => sum + c.weight, 0)
  // Warn if no criteria or all weights are zero
  const hasWeightWarning = criteria.length > 0 && totalRawWeight === 0

  function handlePercentChange(id: string, newPercent: number) {
    setCriteria((prev) => {
      const others = prev.filter((c) => c.id !== id)
      const remaining = Math.max(1, 100 - newPercent)
      const othersTotal = others.reduce((sum, c) => sum + c.weight, 0)
      return prev.map((c) => {
        if (c.id === id) return { ...c, weight: newPercent / 100 }
        // Scale others proportionally to fill remaining %
        const scaled = othersTotal > 0
          ? (c.weight / othersTotal) * (remaining / 100)
          : remaining / 100 / others.length
        return { ...c, weight: scaled }
      })
    })
    setSaveSuccess(false)
  }

  function handleCriterionChange(updated: Criterion) {
    setCriteria((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    )
    setSaveSuccess(false)
  }

  function handleDelete(id: string) {
    setCriteria((prev) => prev.filter((c) => c.id !== id))
    setSaveSuccess(false)
    // Optimistically remove; server action will confirm on next save
    startTransition(async () => {
      try {
        await deleteCriterion(id)
      } catch {
        // Criterion may not exist on server yet (new unsaved), ignore
      }
    })
  }

  function handleAddDraftChange(
    field: keyof typeof EMPTY_DRAFT,
    value: string | number
  ) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function handleAddCriterion() {
    if (!draft.name.trim()) return

    const newCriterion: Criterion = {
      // Temporary client-side ID until saved; will be replaced by Supabase UUID
      id: `temp_${Date.now()}`,
      name: draft.name.trim(),
      description: draft.description.trim(),
      weight: draft.weight / 100,
      scoring_prompt: draft.scoringPrompt.trim() || null,
      sort_order: criteria.length,
      is_default: false,
    }

    setCriteria((prev) => [...prev, newCriterion])
    setDraft(EMPTY_DRAFT)
    setDialogOpen(false)
    setSaveSuccess(false)
  }

  function handleSave() {
    setSaveError(null)
    setSaveSuccess(false)

    startTransition(async () => {
      try {
        await saveCriteria(
          criteria.map((c, i) => ({ ...c, sort_order: i }))
        )
        setSaveSuccess(true)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save criteria')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Weight visualizer */}
      {criteria.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Weight Distribution
          </h2>
          <WeightVisualizer
            criteria={criteria.map((c) => ({
              id: c.id,
              name: c.name,
              weight: c.weight,
            }))}
          />
        </div>
      )}

      {/* Weight warning */}
      {hasWeightWarning && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/20">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            All criteria weights are zero. Please set at least one weight above zero.
          </p>
        </div>
      )}

      {/* Criteria list */}
      <div className="space-y-3">
        {criteria.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No criteria yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add criteria to tell Eden what matters most to you.
            </p>
          </div>
        ) : (
          criteria.map((criterion) => (
            <CriterionCard
              key={criterion.id}
              criterion={criterion}
              displayPercent={normalizedPercents.get(criterion.id) ?? 0}
              onPercentChange={handlePercentChange}
              onChange={handleCriterionChange}
              onDelete={handleDelete}
              disabled={isPending}
            />
          ))
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-3.5">
        {/* Left: criterion count */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {criteria.length} {criteria.length === 1 ? 'criterion' : 'criteria'}
          </span>
          {saveSuccess && (
            <Badge variant="success" className="text-[10px] h-5">
              Saved
            </Badge>
          )}
          {saveError && (
            <span className="text-xs text-destructive">{saveError}</span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Add dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isPending}>
                <Plus className="size-3.5" />
                Add Criterion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Custom Criterion</DialogTitle>
                <DialogDescription>
                  Define a new criterion Eden will use when scoring listings.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={draft.name}
                    onChange={(e) => handleAddDraftChange('name', e.target.value)}
                    placeholder="e.g. Natural light"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={draft.description}
                    onChange={(e) =>
                      handleAddDraftChange('description', e.target.value)
                    }
                    placeholder="What does this criterion measure?"
                    className="min-h-[72px] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Initial weight{' '}
                    <span className="font-normal text-muted-foreground">
                      (raw value, normalized on save)
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="range"
                        min={1}
                        max={100}
                        value={draft.weight}
                        onChange={(e) =>
                          handleAddDraftChange('weight', Number(e.target.value))
                        }
                        className="w-full accent-primary"
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums w-10 text-right">
                      {draft.weight}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Scoring hint{' '}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <Textarea
                    value={draft.scoringPrompt}
                    onChange={(e) =>
                      handleAddDraftChange('scoringPrompt', e.target.value)
                    }
                    placeholder="Custom instructions for Claude when scoring this criterion..."
                    className="min-h-[56px] resize-none"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDraft(EMPTY_DRAFT)
                    setDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddCriterion} disabled={!draft.name.trim()}>
                  Add Criterion
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={isPending || criteria.length === 0}
            className={cn(isPending && 'opacity-75')}
          >
            <Save className="size-3.5" />
            {isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
