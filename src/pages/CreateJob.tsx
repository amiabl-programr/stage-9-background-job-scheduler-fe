import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createJob } from '../api/jobs'
import type { JobPriority, RecurringInterval } from '../types'

type JobMode = 'immediate' | 'scheduled' | 'recurring'

interface FormState {
  type: string
  payloadJson: string
  priority: JobPriority
  mode: JobMode
  scheduledAt: string
  recurringInterval: RecurringInterval | ''
  dependsOn: string
}

interface FieldError {
  property: string
  constraints: Record<string, string>
}

const JOB_TYPE_OPTIONS = [
  { value: 'send_email', label: 'Send Email' },
  { value: '', label: 'Custom…' },
]

const PAYLOAD_TEMPLATES: Record<string, string> = {
  send_email: JSON.stringify(
    { to: 'user@example.com', subject: 'Hello', body: 'Your message here' },
    null,
    2
  ),
}

const INITIAL_FORM: FormState = {
  type: 'send_email',
  payloadJson: PAYLOAD_TEMPLATES['send_email'],
  priority: 2,
  mode: 'immediate',
  scheduledAt: '',
  recurringInterval: '',
  dependsOn: '',
}

export default function CreateJob() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [customType, setCustomType] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([])
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resolvedType = form.type === '' ? customType : form.type

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleTypeChange = (value: string) => {
    setField('type', value)
    if (value && PAYLOAD_TEMPLATES[value]) {
      setField('payloadJson', PAYLOAD_TEMPLATES[value])
    }
  }

  const handleModeChange = (mode: JobMode) => {
    setField('mode', mode)
    // Clear the irrelevant fields when switching mode
    setField('scheduledAt', '')
    setField('recurringInterval', '')
  }

  const getFieldError = (prop: string): string | undefined => {
    const match = fieldErrors.find((e) => e.property === prop)
    return match ? Object.values(match.constraints).join(', ') : undefined
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors([])
    setGeneralError(null)

    // Validate type
    if (!resolvedType.trim()) {
      setFieldErrors([{ property: 'type', constraints: { required: 'Job type is required' } }])
      return
    }

    // Parse payload
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(form.payloadJson)
      if (typeof payload !== 'object' || Array.isArray(payload) || payload === null) {
        throw new Error('Payload must be a JSON object, not an array or primitive')
      }
    } catch (err) {
      setFieldErrors([
        {
          property: 'payloadJson',
          constraints: {
            invalidJson: err instanceof Error ? err.message : 'Payload must be valid JSON',
          },
        },
      ])
      return
    }

    // Validate mode-specific fields
    if (form.mode === 'scheduled' && !form.scheduledAt) {
      setFieldErrors([
        { property: 'scheduledAt', constraints: { required: 'A scheduled time is required' } },
      ])
      return
    }
    if (form.mode === 'recurring' && !form.recurringInterval) {
      setFieldErrors([
        {
          property: 'recurringInterval',
          constraints: { required: 'Please select a recurring interval' },
        },
      ])
      return
    }

    // Parse dependency UUIDs
    const dependsOn = form.dependsOn
      ? form.dependsOn
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined

    setIsSubmitting(true)
    try {
      await createJob({
        type: resolvedType.trim(),
        payload,
        priority: form.priority,
        scheduledAt:
          form.mode === 'scheduled' && form.scheduledAt
            ? new Date(form.scheduledAt).toISOString()
            : undefined,
        recurringInterval:
          form.mode === 'recurring' && form.recurringInterval
            ? (form.recurringInterval as RecurringInterval)
            : undefined,
        dependsOn,
      })
      navigate('/jobs')
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: unknown } }
      const message = apiErr?.error?.message
      if (Array.isArray(message)) {
        setFieldErrors(message as FieldError[])
      } else {
        setGeneralError(String(message || 'Something went wrong. Please try again.'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Create Job</h1>
      <p className="text-sm text-gray-500 mb-6">
        Configure a new background job to be queued and processed.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Job Type */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Job Type <span className="text-red-500">*</span>
          </label>
          <select
            value={form.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm"
          >
            {JOB_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {form.type === '' && (
            <input
              placeholder="Enter custom job type, e.g. generate_report"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              className="mt-2 w-full border rounded px-3 py-1.5 text-sm"
              autoFocus
            />
          )}
          {getFieldError('type') && (
            <p className="text-red-600 text-xs mt-1">{getFieldError('type')}</p>
          )}
        </div>

        {/* Payload */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Payload <span className="text-red-500">*</span>
            <span className="ml-1 font-normal text-gray-400">(JSON object)</span>
          </label>
          <textarea
            value={form.payloadJson}
            onChange={(e) => setField('payloadJson', e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm font-mono h-28 resize-y"
            spellCheck={false}
          />
          {getFieldError('payloadJson') && (
            <p className="text-red-600 text-xs mt-1">{getFieldError('payloadJson')}</p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <div className="flex gap-2">
            {([1, 2, 3] as JobPriority[]).map((p) => {
              const labels: Record<JobPriority, string> = { 1: 'High', 2: 'Medium', 3: 'Low' }
              const activeColors: Record<JobPriority, string> = {
                1: 'bg-red-100 border-red-400 text-red-800',
                2: 'bg-yellow-100 border-yellow-400 text-yellow-800',
                3: 'bg-gray-100 border-gray-400 text-gray-800',
              }
              const isSelected = form.priority === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setField('priority', p)}
                  className={`flex-1 py-1.5 rounded border text-sm font-medium transition-colors ${
                    isSelected ? activeColors[p] : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {labels[p]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Job Mode */}
        <div>
          <label className="block text-sm font-medium mb-1">Execution Mode</label>
          <div className="flex gap-2">
            {(['immediate', 'scheduled', 'recurring'] as JobMode[]).map((mode) => {
              const labels: Record<JobMode, string> = {
                immediate: 'Run Now',
                scheduled: 'Schedule Once',
                recurring: 'Recurring',
              }
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleModeChange(mode)}
                  className={`flex-1 py-1.5 rounded border text-sm font-medium transition-colors ${
                    form.mode === mode
                      ? 'bg-blue-100 border-blue-400 text-blue-800'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {labels[mode]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Scheduled At — only shown in scheduled mode */}
        {form.mode === 'scheduled' && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Run At <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setField('scheduledAt', e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm"
              min={new Date().toISOString().slice(0, 16)}
            />
            {getFieldError('scheduledAt') && (
              <p className="text-red-600 text-xs mt-1">{getFieldError('scheduledAt')}</p>
            )}
          </div>
        )}

        {/* Recurring Interval — only shown in recurring mode */}
        {form.mode === 'recurring' && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Repeat Every <span className="text-red-500">*</span>
            </label>
            <select
              value={form.recurringInterval}
              onChange={(e) => setField('recurringInterval', e.target.value as RecurringInterval)}
              className="w-full border rounded px-3 py-1.5 text-sm"
            >
              <option value="">Select interval…</option>
              <option value="every_1_minute">Every 1 Minute</option>
              <option value="every_5_minutes">Every 5 Minutes</option>
              <option value="every_1_hour">Every 1 Hour</option>
            </select>
            {getFieldError('recurringInterval') && (
              <p className="text-red-600 text-xs mt-1">{getFieldError('recurringInterval')}</p>
            )}
          </div>
        )}

        {/* Dependencies */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Depends On
            <span className="ml-1 font-normal text-gray-400">(optional)</span>
          </label>
          <input
            placeholder="Comma-separated job UUIDs, e.g. abc123…, def456…"
            value={form.dependsOn}
            onChange={(e) => setField('dependsOn', e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            This job will not run until all listed jobs have completed.
          </p>
          {getFieldError('dependsOn') && (
            <p className="text-red-600 text-xs mt-1">{getFieldError('dependsOn')}</p>
          )}
        </div>

        {/* General error */}
        {generalError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            {generalError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Creating…' : 'Create Job'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="px-5 py-2 rounded border text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
        }
