import { z } from 'zod'

const envSchema = z.object({
  // Bare origin only — no trailing slash, no /api/v1.
  // API modules append /api/v1/... themselves.
  // The SSE hook also derives its full URL from this value.
  VITE_API_BASE: z.string().url().default('http://localhost:3000'),
})

const env = envSchema.parse(import.meta.env)

export default env
