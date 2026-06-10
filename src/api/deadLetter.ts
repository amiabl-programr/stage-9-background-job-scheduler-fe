import client from './client'
import type { DeadLetterEntry } from '../types'

const PREFIX = '/api/v1'

export async function listDeadLetter(): Promise<DeadLetterEntry[]> {
  const res = await client.get(`${PREFIX}/dead-letter`)
  return res.data.data
}

export async function retryDeadLetter(id: string): Promise<void> {
  await client.post(`${PREFIX}/dead-letter/${id}/retry`)
}
