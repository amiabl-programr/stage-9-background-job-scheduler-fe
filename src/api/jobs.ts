import client from './client'
import type {
  Job,
  PaginatedResponse,
  JobQueryParams,
  CreateJobPayload,
  UpdateJobPayload,
} from '../types'

export async function listJobs(params?: JobQueryParams): Promise<PaginatedResponse<Job>> {
  const res = await client.get('/api/v1/jobs', { params })
  return res.data.data
}

export async function getJob(id: string): Promise<Job> {
  const res = await client.get(`/api/v1/jobs/${id}`)
  return res.data.data
}

export async function createJob(payload: CreateJobPayload): Promise<Job> {
  const res = await client.post('/api/v1/jobs', payload)
  return res.data.data
}

export async function updateJob(id: string, payload: UpdateJobPayload): Promise<Job> {
  const res = await client.patch(`/api/v1/jobs/${id}`, payload)
  return res.data.data
}

export async function cancelJob(id: string): Promise<Job> {
  const res = await client.patch(`/api/v1/jobs/${id}/cancel`)
  return res.data.data
}

export async function deleteJob(id: string): Promise<void> {
  await client.delete(`/api/v1/jobs/${id}`)
}
