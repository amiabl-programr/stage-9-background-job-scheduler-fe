import client from './client'
import type { Job, PaginatedResponse, JobQueryParams, CreateJobPayload, UpdateJobPayload } from '../types'

export async function listJobs(params?: JobQueryParams): Promise<PaginatedResponse<Job>> {
  const { data } = await client.get('/jobs', { params })
  return data
}

export async function getJob(id: string): Promise<Job> {
  const { data } = await client.get(`/jobs/${id}`)
  return data
}

export async function createJob(payload: CreateJobPayload): Promise<Job> {
  const { data } = await client.post('/jobs', payload)
  return data
}

export async function updateJob(id: string, payload: UpdateJobPayload): Promise<Job> {
  const { data } = await client.patch(`/jobs/${id}`, payload)
  return data
}

export async function cancelJob(id: string): Promise<Job> {
  const { data } = await client.patch(`/jobs/${id}/cancel`)
  return data
}

export async function deleteJob(id: string): Promise<void> {
  await client.delete(`/jobs/${id}`)
}
