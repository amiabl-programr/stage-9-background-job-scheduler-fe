import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createJob } from '../api/jobs'
import type { JobPriority, RecurringInterval } from '../types'

interface FormData {
  type: string
  payload: string
  priority: JobPriority
  scheduledAt: string
  recurringInterval: RecurringInterval | ''
  dependsOn: string
}

interface FieldError {
  property: string
  constraints: Record<string, string>
}

export default function CreateJob() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormData>({
    type: '',
    payload: '{}',
    priority: 2,
    scheduledAt: '',
    recurringInterval: '',
    dependsOn: '',
  })
  const [errors, setErrors] = useState<FieldError[]>([])
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setSubmitting(true)

    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(form.payload)
    } catch {
      setErrors([{ property: 'payload', constraints: { invalidJson: 'Payload must be valid JSON' } }])
      setSubmitting(false)
      return
    }

    try {
      await createJob({
        type: form.type,
        payload,
        priority: form.priority,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
        recurringInterval: (form.recurringInterval || undefined) as RecurringInterval | undefined,
        dependsOn: form.dependsOn
          ? form.dependsOn.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      })
      navigate('/jobs')
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: unknown } }
      const msg = apiErr?.error?.message
      if (Array.isArray(msg)) {
        setErrors(msg as FieldError[])
      } else {
        setErrors([{ property: 'general', constraints: { general: String(msg || 'Unknown error') } }])
      }
    } finally {
      setSubmitting(false)
    }
  }

  const getError = (prop: string) =>
    errors.find((e) => e.property === prop)?.constraints &&
    Object.values(errors.find((e) => e.property === prop)!.constraints).join(', ')

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Job</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type *</label>
          <input
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm"
            required
          />
          {getError('type') && <p className="text-red-600 text-xs mt-1">{getError('type')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Payload *</label>
          <textarea
            value={form.payload}
            onChange={(e) => set('payload', e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm font-mono h-24"
            required
          />
          {getError('payload') && <p className="text-red-600 text-xs mt-1">{getError('payload')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => set('priority', Number(e.target.value) as JobPriority)}
            className="w-full border rounded px-3 py-1.5 text-sm"
          >
            <option value={1}>HIGH</option>
            <option value={2}>MEDIUM</option>
            <option value={3}>LOW</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Scheduled At</label>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => set('scheduledAt', e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Recurring Interval</label>
          <select
            value={form.recurringInterval}
            onChange={(e) => set('recurringInterval', e.target.value as RecurringInterval | '')}
            className="w-full border rounded px-3 py-1.5 text-sm"
          >
            <option value="">None</option>
            <option value="every_1_minute">Every 1 Minute</option>
            <option value="every_5_minutes">Every 5 Minutes</option>
            <option value="every_1_hour">Every 1 Hour</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Depends On</label>
          <input
            placeholder="Comma-separated job UUIDs"
            value={form.dependsOn}
            onChange={(e) => set('dependsOn', e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm"
          />
        </div>

        {getError('general') && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            {getError('general')}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Job'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="px-4 py-1.5 rounded border text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
