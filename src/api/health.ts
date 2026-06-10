import client from './client'
import type { HealthCheckResponse } from '../types'

export async function getHealth(): Promise<HealthCheckResponse> {
  const { data } = await client.get('/health')
  return data
}
