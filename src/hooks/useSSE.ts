import { useEffect, useRef } from 'react'
import env from '../config/env'

type SSEEventHandler = (data: Record<string, unknown>) => void

const RECONNECT_DELAY = 3000

export function useSSE(handlers: Record<string, SSEEventHandler>) {
  const sourceRef = useRef<EventSource | null>(null)
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const url = `${env.VITE_API_BASE}/api/v1/jobs/events`

    const connect = () => {
      sourceRef.current?.close()
      const source = new EventSource(url)
      sourceRef.current = source

      source.onopen = () => console.log('SSE connected')

      source.onerror = () => {
        source.close()
        setTimeout(connect, RECONNECT_DELAY)
      }

      Object.keys(handlersRef.current).forEach((event) => {
        source.addEventListener(event, (e: MessageEvent) => {
          try {
            handlersRef.current[event]?.(JSON.parse(e.data))
          } catch {
            // ignore malformed data
          }
        })
      })
    }

    connect()
    return () => sourceRef.current?.close()
  }, [])
}
