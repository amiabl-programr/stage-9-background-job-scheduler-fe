export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type JobPriority = 1 | 2 | 3

export type RecurringInterval = 'every_1_minute' | 'every_5_minutes' | 'every_1_hour'

export interface CreateJobPayload {
  type: string
  payload: Record<string, unknown>
  priority?: JobPriority
  scheduledAt?: string
  recurringInterval?: RecurringInterval
  dependsOn?: string[]
}

export interface Job {
  id: string
  type: string
  payload: Record<string, unknown>
  priority: JobPriority
  status: JobStatus
  retryCount: number
  lastError: string | null
  scheduledAt: string | null
  recurringInterval: RecurringInterval | null
  startedAt: string | null
  completedAt: string | null
  effectivePriority: number
  dependsOn: string[]
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface JobQueryParams {
  status?: JobStatus
  type?: string
  priority?: JobPriority
  page?: number
  limit?: number
}

export interface UpdateJobPayload {
  status?: JobStatus
  priority?: JobPriority
}

export interface DeadLetterEntry {
  id: string
  jobId: string
  errorMessage: string
  finalRetryCount: number
  jobSnapshot: Job
  createdAt: string
}

export interface SSEEvent {
  jobId?: string
  type?: string
  priority?: JobPriority
  status?: JobStatus
  error?: string
  attempt?: number
  maxRetries?: number
  delayMs?: number
  count?: number
  threshold?: number
  lastJobId?: string
}

export interface HealthCheckResponse {
  status: string
  timestamp: string
}

export interface ApiError {
  statusCode: number
  message: string | { property: string; constraints: Record<string, string> }[]
  error: string
}
