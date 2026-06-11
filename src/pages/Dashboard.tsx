import { useState, useEffect, useCallback } from 'react'
import CountCard from '../components/CountCard'
import { useSSE } from '../hooks/useSSE'
import { getHealth } from '../api/health'
import { listJobs } from '../api/jobs'
import type { JobStatus } from '../types'

interface StatusCounts {
  pending: number
  processing: number
  completed: number
  failed: number
  cancelled: number
}

const INITIAL_COUNTS: StatusCounts = {
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  cancelled: 0,
}

async function fetchAllStatusCounts(): Promise<StatusCounts> {
  const statuses: JobStatus[] = ['pending', 'processing', 'completed', 'failed', 'cancelled']
  const results = await Promise.all(
    statuses.map((status) => listJobs({ status, page: 1, limit: 1 }))
  )
  return {
    pending: results[0].total,
    processing: results[1].total,
    completed: results[2].total,
    failed: results[3].total,
    cancelled: results[4].total,
  }
}

export default function Dashboard() {
  const [counts, setCounts] = useState<StatusCounts>(INITIAL_COUNTS)
  const [isApiHealthy, setIsApiHealthy] = useState(false)
  const [isLoadingCounts, setIsLoadingCounts] = useState(true)

  // Fetch real counts on mount
  useEffect(() => {
    setIsLoadingCounts(true)
    fetchAllStatusCounts()
      .then(setCounts)
      .catch(() => setCounts(INITIAL_COUNTS))
      .finally(() => setIsLoadingCounts(false))
  }, [])

  useEffect(() => {
    getHealth()
      .then((res) => setIsApiHealthy(res.status === 'ok'))
      .catch(() => setIsApiHealthy(false))
  }, [])

  const increment = useCallback((status: JobStatus) => {
    setCounts((prev) => ({ ...prev, [status]: prev[status] + 1 }))
  }, [])

  const decrement = useCallback((status: JobStatus) => {
    setCounts((prev) => ({ ...prev, [status]: Math.max(0, prev[status] - 1) }))
  }, [])

  useSSE({
    // job.created → pending+1
    'job.created': () => increment('pending'),
    // job.started → pending-1, processing+1
    'job.started': () => {
      decrement('pending')
      increment('processing')
    },
    // job.completed → processing-1, completed+1
    'job.completed': () => {
      decrement('processing')
      increment('completed')
    },
    // job.failed → processing-1, failed+1
    'job.failed': () => {
      decrement('processing')
      increment('failed')
    },
    // job.cancelled → pending/processing-1, cancelled+1
    // We don't know which state it was in, so just increment cancelled
    'job.cancelled': () => increment('cancelled'),
  })

  const cards: { label: string; count: number; color: string }[] = [
    { label: 'Pending', count: counts.pending, color: 'gray' },
    { label: 'Processing', count: counts.processing, color: 'blue' },
    { label: 'Completed', count: counts.completed, color: 'green' },
    { label: 'Failed', count: counts.failed, color: 'red' },
    { label: 'Cancelled', count: counts.cancelled, color: 'yellow' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-3 h-3 rounded-full ${
              isApiHealthy ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={isApiHealthy ? 'API connected' : 'API disconnected'}
          />
          <span className="text-xs text-gray-500">
            {isApiHealthy ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {isLoadingCounts ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 text-center bg-gray-50 animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {cards.map((card) => (
            <CountCard key={card.label} label={card.label} count={card.count} color={card.color} />
          ))}
        </div>
      )}
    </div>
  )
}
