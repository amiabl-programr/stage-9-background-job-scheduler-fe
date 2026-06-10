import client from './client'
import type { DeadLetterEntry } from '../types'

export async function listDeadLetter(): Promise<DeadLetterEntry[]> {
  const { data } = await client.get('/dead-letter')
  return data
}

export async function retryDeadLetter(id: string): Promise<void> {
  await client.post(`/dead-letter/${id}/retry`)
}
