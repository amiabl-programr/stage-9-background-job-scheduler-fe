import { useEffect, useRef } from 'react'
import env from '../config/env'

type SSEEventHandler = (data: Record<string, unknown>) => void

const RECONNECT_DELAY_MS = 3000

export function useSSE(handlers: Record<string, SSEEventHandler>) {
  const sourceRef = useRef<EventSource | null>(null)
  const handlersRef = useRef(handlers)

  // Keep handlersRef current without re-subscribing the SSE connection
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const sseUrl = `${env.VITE_API_BASE}/api/v1/jobs/events`

    const connect = () => {
      sourceRef.current?.close()
      const source = new EventSource(sseUrl)
      sourceRef.current = source

      source.onopen = () => console.log('[SSE] connected')

      source.onerror = () => {
        source.close()
        setTimeout(connect, RECONNECT_DELAY_MS)
      }

      Object.keys(handlersRef.current).forEach((eventName) => {
        source.addEventListener(eventName, (e: MessageEvent) => {
          try {
            handlersRef.current[eventName]?.(JSON.parse(e.data as string))
          } catch {
            // ignore malformed event data
          }
        })
      })
    }

    connect()
    return () => sourceRef.current?.close()
  }, [])
}
