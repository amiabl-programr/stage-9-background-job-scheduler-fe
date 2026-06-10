import { useState, useEffect } from 'react'
import { listDeadLetter, retryDeadLetter } from '../api/deadLetter'
import type { DeadLetterEntry } from '../types'

export default function DeadLetterQueue() {
  const [entries, setEntries] = useState<DeadLetterEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)

  const fetch = async () => {
    try {
      const data = await listDeadLetter()
      setEntries(data)
    } catch {
      setEntries([])
    }
  }

  useEffect(() => {
    fetch()
  }, [])

  const handleRetry = async (id: string) => {
    setRetrying(id)
    try {
      await retryDeadLetter(id)
      fetch()
    } catch {
      // handled by interceptor
    } finally {
      setRetrying(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dead Letter Queue</h1>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2 font-medium">Job ID</th>
              <th className="p-2 font-medium">Type</th>
              <th className="p-2 font-medium">Error</th>
              <th className="p-2 font-medium">Retries</th>
              <th className="p-2 font-medium">Created</th>
              <th className="p-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <>
                <tr
                  key={entry.id}
                  className="border-t cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <td className="p-2 font-mono text-xs">{entry.jobId.slice(0, 8)}...</td>
                  <td className="p-2">{entry.jobSnapshot?.type || '—'}</td>
                  <td className="p-2 text-xs max-w-xs truncate">{entry.errorMessage}</td>
                  <td className="p-2">{entry.finalRetryCount}</td>
                  <td className="p-2 text-xs">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  <td className="p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRetry(entry.id)
                      }}
                      disabled={retrying === entry.id}
                      className="text-blue-600 text-xs hover:underline disabled:opacity-40"
                    >
                      {retrying === entry.id ? 'Retrying...' : 'Retry'}
                    </button>
                  </td>
                </tr>
                {expandedId === entry.id && (
                  <tr key={`${entry.id}-expanded`}>
                    <td colSpan={6} className="p-3 bg-gray-50 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div><strong>DLQ ID:</strong> {entry.id}</div>
                        <div><strong>Job ID:</strong> {entry.jobId}</div>
                        <div className="col-span-2">
                          <strong>Error:</strong> {entry.errorMessage}
                        </div>
                        <div className="col-span-2"><strong>Job Snapshot:</strong></div>
                        <pre className="col-span-2 bg-gray-100 p-2 rounded overflow-auto max-h-60">
                          {JSON.stringify(entry.jobSnapshot, null, 2)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">No dead letter entries</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
