import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job, JobStatus, JobPriority, JobQueryParams } from '../types'
import { listJobs, cancelJob } from '../api/jobs'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import Pagination from '../components/Pagination'
import ConfirmModal from '../components/ConfirmModal'

export default function JobList() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20
  const [filters, setFilters] = useState<JobQueryParams>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)

  useEffect(() => {
    listJobs({ ...filters, page, limit })
      .then((res) => {
        setJobs(res.data)
        setTotal(res.total)
      })
      .catch(() => setJobs([]))
  }, [filters, page])

  const handleCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancelJob(cancelTarget)
      setCancelTarget(null)
      listJobs({ ...filters, page, limit })
        .then((res) => {
          setJobs(res.data)
          setTotal(res.total)
        })
        .catch(() => setJobs([]))
    } catch {
      // error handled by interceptor
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <button
          onClick={() => navigate('/jobs/create')}
          className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm"
        >
          + Create Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filters.status ?? ''}
          onChange={(e) => {
            setFilters((f) => ({ ...f, status: (e.target.value || undefined) as JobStatus | undefined }))
            setPage(1)
          }}
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
          placeholder="Type"
          value={filters.type ?? ''}
          onChange={(e) => {
            setFilters((f) => ({ ...f, type: e.target.value || undefined }))
            setPage(1)
          }}
          className="border rounded px-2 py-1 text-sm w-32"
        />
        <select
          value={filters.priority ?? ''}
          onChange={(e) => {
            setFilters((f) => ({ ...f, priority: (e.target.value ? Number(e.target.value) : undefined) as JobPriority | undefined }))
            setPage(1)
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">All Priority</option>
          <option value="1">HIGH</option>
          <option value="2">MEDIUM</option>
          <option value="3">LOW</option>
        </select>
      </div>

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
            {jobs.map((job) => (
              <>
                <tr
                  key={job.id}
                  className="border-t cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                >
                  <td className="p-2 font-mono text-xs">{job.id.slice(0, 8)}...</td>
                  <td className="p-2">{job.type}</td>
                  <td className="p-2"><PriorityBadge priority={job.priority} /></td>
                  <td className="p-2"><StatusBadge status={job.status} /></td>
                  <td className="p-2">{job.retryCount}</td>
                  <td className="p-2 text-xs">{new Date(job.createdAt).toLocaleDateString()}</td>
                  <td className="p-2">
                    {job.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setCancelTarget(job.id)
                        }}
                        className="text-red-600 text-xs hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === job.id && (
                  <tr key={`${job.id}-expanded`}>
                    <td colSpan={7} className="p-3 bg-gray-50 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div><strong>ID:</strong> {job.id}</div>
                        <div><strong>Status:</strong> {job.status}</div>
                        <div><strong>Priority:</strong> {job.priority}</div>
                        <div><strong>Retries:</strong> {job.retryCount}</div>
                        <div><strong>Last Error:</strong> {job.lastError || '—'}</div>
                        <div><strong>Scheduled:</strong> {job.scheduledAt ? new Date(job.scheduledAt).toLocaleString() : '—'}</div>
                        <div><strong>Recurring:</strong> {job.recurringInterval || '—'}</div>
                        <div><strong>Depends On:</strong> {job.dependsOn.length ? job.dependsOn.join(', ') : '—'}</div>
                        <div className="col-span-2"><strong>Payload:</strong></div>
                        <pre className="col-span-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(job.payload, null, 2)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">No jobs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />

      <ConfirmModal
        open={!!cancelTarget}
        title="Cancel Job"
        message="Are you sure you want to cancel this job?"
        confirmLabel="Cancel Job"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
