import client from './client'
import type { HealthCheckResponse } from '../types'

export async function getHealth(): Promise<HealthCheckResponse> {
  const res = await client.get('/health')
  return res.data.data
}
