import request from '@/utils/request'

// 巡检记录信息
export interface InspectionRecord {
  id: number
  created_at: string
  report_id: number
  host_id: string
  hostname: string
  status: 'online' | 'offline' | 'warning' | 'critical'
  os: string
  arch: string
  uptime_seconds: number
  last_seen: string
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  metrics: Record<string, any>
  issues: string[]
  warnings: string[]
  recommendations: string[]
  service_count: number
  service_running: number
  service_stopped: number
  service_failed: number
  anomaly_count: number
  alert_count: number
  critical_alert_count: number
}

// 巡检日报信息
export interface InspectionReport {
  id: number
  created_at: string
  date: string
  start_time: string
  end_time?: string
  status: 'running' | 'completed' | 'failed'
  total_hosts: number
  online_hosts: number
  offline_hosts: number
  warning_hosts: number
  critical_hosts: number
  summary: string
  report_content: string
  key_findings: string
  recommendations: string
  generated_by: string
  records?: InspectionRecord[]
}

// 列表响应
export interface InspectionReportListResponse {
  items: InspectionReport[]
  total: number
  page: number
  page_size: number
}

// 流式数据块
export interface StreamChunk {
  content: string
  done: boolean
  error?: string
}

// 执行巡检
export function runInspection(date?: string) {
  return request<{
    report_id: number
    date: string
    status: string
  }>({
    url: '/v1/inspection/run',
    method: 'post',
    params: date ? { date } : undefined
  })
}

// 获取巡检报告列表
export function listInspectionReports(params?: {
  page?: number
  page_size?: number
}) {
  return request<InspectionReportListResponse>({
    url: '/v1/inspection/reports',
    method: 'get',
    params
  })
}

// 获取巡检报告详情
export function getInspectionReport(id: number) {
  return request<InspectionReport>({
    url: `/v1/inspection/reports/${id}`,
    method: 'get'
  })
}

// 流式生成巡检日报（SSE）
export function streamInspectionReport(
  reportId: number,
  onChunk: (chunk: StreamChunk) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): () => void {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  const url = `${baseURL}/v1/inspection/reports/${reportId}/stream`

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
