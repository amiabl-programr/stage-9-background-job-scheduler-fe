import client from './client'
import type { DeadLetterEntry, Job } from '../types'

export async function listDeadLetter(): Promise<DeadLetterEntry[]> {
  const res = await client.get('/api/v1/dead-letter')
  return res.data.data
}

// BE returns the newly created Job (201), not void
export async function retryDeadLetter(id: string): Promise<Job> {
  const res = await client.post(`/api/v1/dead-letter/${id}/retry`)
  return res.data.data
}
