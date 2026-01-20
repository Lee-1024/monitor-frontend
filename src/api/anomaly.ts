import request from '@/utils/request'

// 异常事件信息
export interface AnomalyEvent {
  id: number
  created_at: string
  updated_at: string
  host_id: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  metric_type?: string
  timestamp: string
  value: number
  expected_value?: number
  deviation: number
  confidence: number
  message: string
  root_cause?: string
  related_logs?: LogInfo[]
  related_metrics?: Record<string, any>
  recommendations?: string[]
  is_resolved: boolean
  resolved_at?: string
  resolved_by?: string
}

// 日志信息
export interface LogInfo {
  id: number
  host_id: string
  timestamp: string
  source: string
  level: string
  message: string
  tags?: Record<string, string>
}

// 异常统计信息
export interface AnomalyStatistics {
  total_anomalies: number
  unresolved_count: number
  by_severity: Record<string, number>
  by_type: Record<string, number>
  recent_anomalies: AnomalyEvent[]
}

// 检测异常响应
export interface DetectAnomaliesResponse {
  anomalies: AnomalyEvent[]
  count: number
  llm_summary?: string // LLM生成的总结
}

// 检测异常
export function detectAnomalies(params: {
  host_id: string
  metric_type?: string
  hours?: number
}) {
  return request<DetectAnomaliesResponse>({
    url: '/v1/anomalies/detect',
    method: 'post',
    params,
    timeout: 120000 // 120秒超时（LLM分析需要更多时间）
  })
}

// 获取异常事件列表
export function getAnomalyEvents(params: {
  host_id?: string
  severity?: string
  type?: string
  is_resolved?: boolean
  limit?: number
}) {
  return request<{ events: AnomalyEvent[]; count: number }>({
    url: '/v1/anomalies/events',
    method: 'get',
    params
  })
}

// 获取异常事件详情
export function getAnomalyEventDetail(id: number) {
  return request<AnomalyEvent>({
    url: `/v1/anomalies/events/${id}`,
    method: 'get'
  })
}

// 标记异常事件为已解决
export function resolveAnomalyEvent(id: number) {
  return request({
    url: `/v1/anomalies/events/${id}/resolve`,
    method: 'post'
  })
}

// 获取异常统计信息
export function getAnomalyStatistics(hostId?: string) {
  return request<AnomalyStatistics>({
    url: '/v1/anomalies/statistics',
    method: 'get',
    params: hostId ? { host_id: hostId } : {}
  })
}

// 流式数据块
export interface StreamChunk {
  content: string
  done: boolean
  error?: string
}

// 流式获取异常分析（SSE）
export function streamAnomalyAnalysis(
  params: {
    host_id: string
    metric_type?: string
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
  if (params.metric_type) {
    queryParams.append('metric_type', params.metric_type)
  }

  // 获取API基础URL
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  const url = `${baseURL}/v1/anomalies/detect/stream?${queryParams.toString()}`

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
