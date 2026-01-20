import request from '@/utils/request'

export interface PredictionResult {
  current_value: number
  predicted_value: number
  predicted_time: string
  growth_rate: number
  days_to_threshold: number
  trend: 'increasing' | 'decreasing' | 'stable'
  confidence: number
  recommendation: string
}

export interface CapacityPrediction {
  resource_type: 'cpu' | 'memory' | 'disk'
  current_usage: number
  threshold: number
  days_to_threshold: number
  predicted_date: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  recommendation: string
}

export interface LLMAnalysis {
  summary: string
  analysis: string
  recommendations: string[]
  cost_optimization?: string
  risks?: string[]
}

export interface CapacityPredictionResponse {
  prediction: PredictionResult
  capacity: CapacityPrediction
  host: {
    host_id: string
    hostname: string
  }
  llm_analysis?: LLMAnalysis
  llm_task_id?: string // LLM任务ID
}

export interface CostOptimizationResponse {
  host_id: string
  hostname: string
  recommendation: string
  predictions: Record<string, PredictionResult>
}

// 获取容量预测
export function getCapacityPrediction(params: {
  host_id: string
  type?: 'cpu' | 'memory' | 'disk'
  days?: number
  threshold?: number
  enable_llm?: boolean // 是否启用AI分析
}) {
  return request<CapacityPredictionResponse>({
    url: '/v1/predictions/capacity',
    method: 'get',
    params: {
      ...params,
      enable_llm: params.enable_llm ? 'true' : 'false'
    },
    timeout: params.enable_llm ? 30000 : 30000 // 30秒超时
  })
}

// 获取成本优化建议
export function getCostOptimization(hostId: string) {
  return request<CostOptimizationResponse & { llm_task_id?: string }>({
    url: '/v1/predictions/cost-optimization',
    method: 'get',
    params: { host_id: hostId },
    timeout: 30000 // 30秒超时，LLM分析改为异步
  })
}

// LLM任务状态
export interface LLMTask {
  id: string
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
  result?: any
  error?: string
}

// 获取LLM任务状态
export function getLLMTaskStatus(taskId: string) {
  return request<LLMTask>({
    url: `/v1/predictions/task/${taskId}`,
    method: 'get',
    timeout: 10000
  })
}

// 流式数据块
export interface StreamChunk {
  content: string
  done: boolean
  error?: string
}

// 流式获取成本优化建议（SSE）
export function streamCostOptimization(
  params: {
    host_id: string
  },
  onChunk: (chunk: StreamChunk) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): () => void {
  // 构建查询参数
  const queryParams = new URLSearchParams({
    host_id: params.host_id
  })

  // 获取API基础URL
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  const url = `${baseURL}/v1/predictions/cost-optimization/stream?${queryParams.toString()}`

  // 获取token
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let eventSource: EventSource | null = null
  let abortController: AbortController | null = null

  try {
    // 使用fetch API支持自定义headers（EventSource不支持）
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

            // 解码数据
            buffer += decoder.decode(value, { stream: true })
            
            // 处理SSE格式的数据（以\n\n分隔）
            const lines = buffer.split('\n\n')
            buffer = lines.pop() || '' // 保留最后一个不完整的数据块

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6)) as StreamChunk
                  onChunk(data)
                  
                  // 如果完成或出错，停止读取
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

            // 继续读取
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

  // 返回取消函数
  return () => {
    if (abortController) {
      abortController.abort()
    }
    if (eventSource) {
      eventSource.close()
    }
  }
}

// 流式获取容量分析（SSE）
export function streamCapacityAnalysis(
  params: {
    host_id: string
    type?: 'cpu' | 'memory' | 'disk'
    days?: number
    threshold?: number
  },
  onChunk: (chunk: StreamChunk) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): () => void {
  // 构建查询参数
  const queryParams = new URLSearchParams({
    host_id: params.host_id,
    type: params.type || 'cpu',
    days: String(params.days || 30),
    threshold: String(params.threshold || 80)
  })

  // 获取API基础URL
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  const url = `${baseURL}/v1/predictions/capacity/stream?${queryParams.toString()}`

  // 获取token
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let eventSource: EventSource | null = null
  let abortController: AbortController | null = null

  try {
    // 使用fetch API支持自定义headers（EventSource不支持）
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

            // 解码数据
            buffer += decoder.decode(value, { stream: true })
            
            // 处理SSE格式的数据（以\n\n分隔）
            const lines = buffer.split('\n\n')
            buffer = lines.pop() || '' // 保留最后一个不完整的数据块

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6)) as StreamChunk
                  onChunk(data)
                  
                  // 如果完成或出错，停止读取
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

            // 继续读取
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

  // 返回取消函数
  return () => {
    if (abortController) {
      abortController.abort()
    }
    if (eventSource) {
      eventSource.close()
    }
  }
}
