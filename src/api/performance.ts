import request from '@/utils/request'

// 流式数据块
export interface StreamChunk {
  content: string
  done: boolean
  error?: string
}

// 流式获取性能分析（SSE）
export function streamPerformanceAnalysis(
  params: {
    host_id: string
    hours?: number
  },
  onChunk: (chunk: StreamChunk) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): () => void {
  // 构建查询参数
  const queryParams = new URLSearchParams({
    host_id: params.host_id,
    hours: String(params.hours || 24)
  })

  // 获取API基础URL
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  const url = `${baseURL}/v1/performance/analysis/stream?${queryParams.toString()}`

  // 获取token
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let abortController: AbortController | null = null

  try {
    abortController = new AbortController()
    
    fetch(url, {
      method: 'GET',
      headers,
      signal: abortController.signal
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('Response body is not readable')
        }

        let buffer = ''

        const readStream = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              if (onComplete) {
                onComplete()
              }
              return
            }

            buffer += decoder.decode(value, { stream: true })
            
            const lines = buffer.split('\n\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6)) as StreamChunk
                  onChunk(data)
                  
                  if (data.done || data.error) {
                    if (data.error && onError) {
                      onError(new Error(data.error))
                    }
                    if (onComplete) {
                      onComplete()
                    }
                    return
                  }
                } catch (e) {
                  console.error('Failed to parse SSE data:', e, line)
                }
              }
            }

            readStream()
          }).catch(err => {
            if (err.name !== 'AbortError' && onError) {
              onError(err)
            }
          })
        }

        readStream()
      })
      .catch(err => {
        if (err.name !== 'AbortError' && onError) {
          onError(err)
        }
      })
  } catch (error) {
    if (onError) {
      onError(error as Error)
    }
  }

  return () => {
    if (abortController) {
      abortController.abort()
    }
  }
}
