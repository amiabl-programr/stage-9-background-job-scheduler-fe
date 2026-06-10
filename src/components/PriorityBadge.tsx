import type { JobPriority } from '../types'

const labels: Record<JobPriority, string> = { 1: 'HIGH', 2: 'MEDIUM', 3: 'LOW' }
const styles: Record<JobPriority, string> = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-yellow-100 text-yellow-800',
  3: 'bg-gray-100 text-gray-800',
}

export default function PriorityBadge({ priority }: { priority: JobPriority }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[priority]}`}>
      {labels[priority]}
    </span>
  )
}
