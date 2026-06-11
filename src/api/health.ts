import client from './client'
import type { HealthCheckResponse } from '../types'

// /health is excluded from the api/v1 global prefix on the BE.
// It also bypasses the ResponseInterceptor, so the response IS the payload —
// read res.data directly, not res.data.data.
export async function getHealth(): Promise<HealthCheckResponse> {
  const res = await client.get('/health')
  return res.data
}
