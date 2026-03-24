import { cn } from '@/lib/utils'

export interface CriterionWeight {
  id: string
  name: string
  weight: number // 0.0 to 1.0
}

interface WeightVisualizerProps {
  criteria: CriterionWeight[]
  className?: string
}

// Distinct colors for up to 6 criteria
const SEGMENT_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
]

const LABEL_COLORS = [
  'text-blue-600 dark:text-blue-400',
  'text-violet-600 dark:text-violet-400',
  'text-emerald-600 dark:text-emerald-400',
  'text-amber-600 dark:text-amber-400',
  'text-rose-600 dark:text-rose-400',
  'text-cyan-600 dark:text-cyan-400',
]

const DOT_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
]

export function WeightVisualizer({ criteria, className }: WeightVisualizerProps) {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0)

  if (criteria.length === 0) {
    return (
      <div
        className={cn(
          'h-3 rounded-full bg-muted flex items-center justify-center',
          className
        )}
      >
        <span className="text-xs text-muted-foreground">No criteria</span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {criteria.map((criterion, i) => {
          const pct = total > 0 ? (criterion.weight / total) * 100 : 0
          return (
            <div
              key={criterion.id}
              className={cn('h-full transition-all duration-300', SEGMENT_COLORS[i % SEGMENT_COLORS.length])}
              style={{ width: `${pct}%` }}
              title={`${criterion.name}: ${Math.round(pct)}%`}
            />
          )
        })}
      </div>

      {/* Labels */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {criteria.map((criterion, i) => {
          const pct = total > 0 ? Math.round((criterion.weight / total) * 100) : 0
          return (
            <div key={criterion.id} className="flex items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  DOT_COLORS[i % DOT_COLORS.length]
                )}
              />
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {criterion.name}
              </span>
              <span
                className={cn(
                  'text-xs font-medium tabular-nums shrink-0',
                  LABEL_COLORS[i % LABEL_COLORS.length]
                )}
              >
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
