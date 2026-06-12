import { useEffect, useRef } from 'react'
import env from '../config/env'

type SSEData = Record<string, unknown>

type Handler = (data: SSEData) => void

const MAX_RETRIES = 5

export function useSSE(handlers: Record<string, Handler>) {
  const handlersRef = useRef(handlers)
  const sourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const base = env?.VITE_API_BASE
    if (!base) return

    const url = `${base}/api/v1/jobs/events`

    let retry = 0
    let stopped = false

    const connect = () => {
      if (stopped) return

      try {
        sourceRef.current?.close()

        const source = new EventSource(url)
        sourceRef.current = source

        source.onopen = () => {
          retry = 0
          console.log('[SSE] connected')
        }

        source.onerror = () => {
          source.close()

          if (retry >= MAX_RETRIES) {
            console.warn('[SSE] max retries reached, stopping SSE')
            return
          }

          retry++

          setTimeout(() => {
            connect()
          }, Math.min(3000 * retry, 15000))
        }

        Object.keys(handlersRef.current).forEach((event) => {
          source.addEventListener(event, (e: MessageEvent) => {
            try {
              if (!e?.data) return

              const data: SSEData =
                typeof e.data === 'string'
                  ? JSON.parse(e.data)
                  : (e.data as SSEData)

              handlersRef.current[event]?.(data)
            } catch (err) {
              console.warn('[SSE parse error]', err)
            }
          })
        })
      } catch (err) {
        console.error('[SSE fatal error]', err)
      }
    }

    connect()

    return () => {
      stopped = true
      sourceRef.current?.close()
    }
  }, [])
}
