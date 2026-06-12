import { useEffect, useRef } from 'react'
import env from '../config/env'

type SSEEventHandler = (data: Record<string, unknown>) => void

const RECONNECT_DELAY_MS = 3000
const MAX_RETRIES = 5

export function useSSE(handlers: Record<string, SSEEventHandler>) {
  const sourceRef = useRef<EventSource | null>(null)
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const base = env?.VITE_API_BASE
    if (!base) return

    const sseUrl = `${base}/api/v1/jobs/events`

    let retryCount = 0

    const connect = () => {
      sourceRef.current?.close()

      const source = new EventSource(sseUrl)
      sourceRef.current = source

      source.onopen = () => console.log('[SSE] connected')

      source.onerror = () => {
        source.close()

        if (retryCount >= MAX_RETRIES) return

        retryCount++
        setTimeout(connect, RECONNECT_DELAY_MS)
      }

      Object.keys(handlersRef.current).forEach((eventName) => {
        source.addEventListener(eventName, (e: MessageEvent) => {
          try {
            handlersRef.current[eventName]?.(JSON.parse(e.data))
          } catch {
            // ignore malformed events
          }
        })
      })
    }

    connect()

    return () => sourceRef.current?.close()
  }, [])
}
