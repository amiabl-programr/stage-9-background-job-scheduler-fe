import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE: z.string().url().default('http://localhost:3000/api/v1'),
})

const env = envSchema.parse(import.meta.env)

export default env
