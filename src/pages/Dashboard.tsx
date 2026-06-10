import { useState, useEffect } from 'react'
import CountCard from '../components/CountCard'
import { useSSE } from '../hooks/useSSE'
import { getHealth } from '../api/health'
import type { JobStatus } from '../types'

interface Counts {
  pending: number
  processing: number
  completed: number
  failed: number
  cancelled: number
}

export default function Dashboard() {
  const [counts, setCounts] = useState<Counts>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  })
  const [healthy, setHealthy] = useState(false)

  useEffect(() => {
    getHealth()
      .then((res) => setHealthy(res.status === 'ok'))
      .catch(() => setHealthy(false))
  }, [])

  const increment = (status: JobStatus) => {
    setCounts((prev) => ({ ...prev, [status]: prev[status] + 1 }))
  }

  useSSE({
    'job.created': () => increment('pending'),
    'job.started': () => increment('processing'),
    'job.completed': () => increment('completed'),
    'job.failed': () => increment('failed'),
    'job.cancelled': () => increment('cancelled'),
  })

  const cards = [
    { label: 'Pending', count: counts.pending, color: 'gray' },
    { label: 'Processing', count: counts.processing, color: 'blue' },
    { label: 'Completed', count: counts.completed, color: 'green' },
    { label: 'Failed', count: counts.failed, color: 'red' },
    { label: 'Cancelled', count: counts.cancelled, color: 'yellow' },
  ] as const

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span
          className={`inline-block w-3 h-3 rounded-full ${healthy ? 'bg-green-500' : 'bg-red-500'}`}
          title={healthy ? 'API connected' : 'API disconnected'}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((c) => (
          <CountCard key={c.label} label={c.label} count={c.count} color={c.color} />
        ))}
      </div>
    </div>
  )
}
