import client from './client'
import type { Job, PaginatedResponse, JobQueryParams, CreateJobPayload, UpdateJobPayload } from '../types'

const PREFIX = '/api/v1'

export async function listJobs(params?: JobQueryParams): Promise<PaginatedResponse<Job>> {
  const res = await client.get(`${PREFIX}/jobs`, { params })
  return res.data.data
}

export async function getJob(id: string): Promise<Job> {
  const res = await client.get(`${PREFIX}/jobs/${id}`)
  return res.data.data
}

export async function createJob(payload: CreateJobPayload): Promise<Job> {
  const res = await client.post(`${PREFIX}/jobs`, payload)
  return res.data.data
}

export async function updateJob(id: string, payload: UpdateJobPayload): Promise<Job> {
  const res = await client.patch(`${PREFIX}/jobs/${id}`, payload)
  return res.data.data
}

export async function cancelJob(id: string): Promise<Job> {
  const res = await client.patch(`${PREFIX}/jobs/${id}/cancel`)
  return res.data.data
}

export async function deleteJob(id: string): Promise<void> {
  await client.delete(`${PREFIX}/jobs/${id}`)
}
