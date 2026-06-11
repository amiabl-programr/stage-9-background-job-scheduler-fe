import { useState, useEffect, useCallback, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job, JobStatus, JobPriority, JobQueryParams } from '../types'
import { listJobs, cancelJob } from '../api/jobs'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import Pagination from '../components/Pagination'
import ConfirmModal from '../components/ConfirmModal'

const CANCELLABLE_STATUSES: JobStatus[] = ['pending', 'processing']

export default function JobList() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<JobQueryParams>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const LIMIT = 20

  // ✅ loadJobs removed from useCallback + useEffect combo
  useEffect(() => {
    let isMounted = true

    const loadJobs = async () => {
      setIsLoading(true)
      setFetchError(null)

      try {
        const res = await listJobs({
          ...filters,
          page,
          limit: LIMIT,
        })

        if (!isMounted) return

        setJobs(res.data)
        setTotal(res.total)
      } catch {
        if (!isMounted) return
        setFetchError('Failed to load jobs. Please try again.')
        setJobs([])
      } finally {
        if (!isMounted) return
        setIsLoading(false)
      }
    }

    loadJobs()

    return () => {
      isMounted = false
    }
  }, [filters, page])

  const handleCancelConfirm = async () => {
    if (!cancelTargetId) return
    try {
      await cancelJob(cancelTargetId)
      setCancelTargetId(null)

      // reload after cancel
      setIsLoading(true)
      const res = await listJobs({ ...filters, page, limit: LIMIT })
      setJobs(res.data)
      setTotal(res.total)
      setIsLoading(false)
    } catch {
      // handled globally
    }
  }

  const handleFilterStatus = (value: string) => {
    setFilters((prev) => ({ ...prev, status: (value || undefined) as JobStatus | undefined }))
    setPage(1)
  }

  const handleFilterType = (value: string) => {
    setFilters((prev) => ({ ...prev, type: value || undefined }))
    setPage(1)
  }

  const handleFilterPriority = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      priority: (value ? Number(value) : undefined) as JobPriority | undefined,
    }))
    setPage(1)
  }

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <button
          onClick={() => navigate('/jobs/create')}
          className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
        >
          + Create Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filters.status ?? ''}
          onChange={(e) => handleFilterStatus(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          placeholder="Filter by type"
          value={filters.type ?? ''}
          onChange={(e) => handleFilterType(e.target.value)}
          className="border rounded px-2 py-1 text-sm w-36"
        />

        <select
          value={filters.priority ?? ''}
          onChange={(e) => handleFilterPriority(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">All Priority</option>
          <option value="1">HIGH</option>
          <option value="2">MEDIUM</option>
          <option value="3">LOW</option>
        </select>
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2 font-medium">ID</th>
              <th className="p-2 font-medium">Type</th>
              <th className="p-2 font-medium">Priority</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium">Retries</th>
              <th className="p-2 font-medium">Created</th>
              <th className="p-2 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-400 text-sm">
                  Loading...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No jobs found
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <Fragment key={job.id}>
                  <tr
                    className="border-t cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleExpanded(job.id)}
                  >
                    <td className="p-2 font-mono text-xs">{job.id.slice(0, 8)}…</td>
                    <td className="p-2">{job.type}</td>
                    <td className="p-2">
                      <PriorityBadge priority={job.priority} />
                    </td>
                    <td className="p-2">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="p-2">{job.retryCount}</td>
                    <td className="p-2 text-xs">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2">
                      {CANCELLABLE_STATUSES.includes(job.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setCancelTargetId(job.id)
                          }}
                          className="text-red-600 text-xs hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>

                  {expandedId === job.id && (
                    <tr>
                      <td colSpan={7} className="p-3 bg-gray-50 text-xs border-t">
                        <div className="grid grid-cols-2 gap-2">
                          <div><strong>ID:</strong> {job.id}</div>
                          <div><strong>Status:</strong> {job.status}</div>
                          <div><strong>Priority:</strong> {job.priority}</div>
                          <div><strong>Effective Priority:</strong> {job.effectivePriority}</div>
                          <div><strong>Retries:</strong> {job.retryCount}</div>
                          <div><strong>Last Error:</strong> {job.lastError ?? '—'}</div>
                          <div>
                            <strong>Scheduled At:</strong>{' '}
                            {job.scheduledAt ? new Date(job.scheduledAt).toLocaleString() : '—'}
                          </div>
                          <div>
                            <strong>Recurring:</strong> {job.recurringInterval ?? '—'}
                          </div>
                          <div>
                            <strong>Started At:</strong>{' '}
                            {job.startedAt ? new Date(job.startedAt).toLocaleString() : '—'}
                          </div>
                          <div>
                            <strong>Completed At:</strong>{' '}
                            {job.completedAt ? new Date(job.completedAt).toLocaleString() : '—'}
                          </div>
                          <div className="col-span-2">
                            <strong>Depends On:</strong>{' '}
                            {job.dependsOn.length ? job.dependsOn.join(', ') : '—'}
                          </div>
                          <div className="col-span-2">
                            <strong>Payload:</strong>
                          </div>
                          <pre className="col-span-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(job.payload, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />

      <ConfirmModal
        open={!!cancelTargetId}
        title="Cancel Job"
        message="Are you sure you want to cancel this job? This cannot be undone."
        confirmLabel="Yes, Cancel Job"
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelTargetId(null)}
      />
    </div>
  )
}
