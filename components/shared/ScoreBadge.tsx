import { cn } from '@/lib/utils'

interface ScoreBadgeProps {
  score: number
  className?: string
}

function getScoreStyle(score: number): string {
  if (score >= 8) {
    return 'bg-green-100 text-green-800 border-green-200'
  }
  if (score >= 6) {
    return 'bg-amber-100 text-amber-800 border-amber-200'
  }
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold tabular-nums',
        getScoreStyle(score),
        className
      )}
    >
      {score.toFixed(1)}
    </span>
  )
}
