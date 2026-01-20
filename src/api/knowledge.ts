import request from '@/utils/request'

// 知识库基础信息
export interface KnowledgeBase {
  id: number
  created_at: string
  updated_at: string
  title: string
  category: string
  tags: string[]
  content: string
  summary: string
  author: string
  view_count: number
  like_count: number
  is_published: boolean
  metadata?: Record<string, string>
}

// 故障处理知识库
export interface TroubleshootingGuide extends KnowledgeBase {
  problem_type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  symptoms: string[]
  root_causes: string[]
  solutions: string[]
  prevention_tips: string[]
  related_cases: string[]
}

// 最佳实践文档
export interface BestPractice extends KnowledgeBase {
  domain: string
  applicability: string
  benefits: string[]
  implementation: string[]
  references: string[]
}

// 故障案例库
export interface CaseStudy extends KnowledgeBase {
  incident_date: string
  resolved_date?: string
  host_id: string
  hostname: string
  problem_type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  impact: string
  timeline: string
  resolution: string
  lessons_learned: string
  related_guides: string[]
}

// 列表响应
export interface KnowledgeListResponse<T> {
  items: T[]
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

// ========== 故障处理知识库 API ==========

// 获取故障处理知识库列表
export function listTroubleshootingGuides(params?: {
  problem_type?: string
  severity?: string
  keyword?: string
  page?: number
  page_size?: number
}) {
  return request<KnowledgeListResponse<TroubleshootingGuide>>({
    url: '/v1/knowledge/troubleshooting',
    method: 'get',
    params
  })
}

// 获取故障处理知识库详情
export function getTroubleshootingGuide(id: number) {
  return request<TroubleshootingGuide>({
    url: `/v1/knowledge/troubleshooting/${id}`,
    method: 'get'
  })
}

// 创建故障处理知识库
export function createTroubleshootingGuide(data: Partial<TroubleshootingGuide>) {
  return request<TroubleshootingGuide>({
    url: '/v1/knowledge/troubleshooting',
    method: 'post',
    data
  })
}

// 更新故障处理知识库
export function updateTroubleshootingGuide(id: number, data: Partial<TroubleshootingGuide>) {
  return request<TroubleshootingGuide>({
    url: `/v1/knowledge/troubleshooting/${id}`,
    method: 'put',
    data
  })
}

// 删除故障处理知识库
export function deleteTroubleshootingGuide(id: number) {
  return request({
    url: `/v1/knowledge/troubleshooting/${id}`,
    method: 'delete'
  })
}

// ========== 最佳实践文档 API ==========

// 获取最佳实践文档列表
export function listBestPractices(params?: {
  domain?: string
  keyword?: string
  page?: number
  page_size?: number
}) {
  return request<KnowledgeListResponse<BestPractice>>({
    url: '/v1/knowledge/best-practices',
    method: 'get',
    params
  })
}

// 获取最佳实践文档详情
export function getBestPractice(id: number) {
  return request<BestPractice>({
    url: `/v1/knowledge/best-practices/${id}`,
    method: 'get'
  })
}

// 创建最佳实践文档
export function createBestPractice(data: Partial<BestPractice>) {
  return request<BestPractice>({
    url: '/v1/knowledge/best-practices',
    method: 'post',
    data
  })
}

// 更新最佳实践文档
export function updateBestPractice(id: number, data: Partial<BestPractice>) {
  return request<BestPractice>({
    url: `/v1/knowledge/best-practices/${id}`,
    method: 'put',
    data
  })
}

// 删除最佳实践文档
export function deleteBestPractice(id: number) {
  return request({
    url: `/v1/knowledge/best-practices/${id}`,
    method: 'delete'
  })
}

// ========== 故障案例库 API ==========

// 获取故障案例库列表
export function listCaseStudies(params?: {
  problem_type?: string
  severity?: string
  host_id?: string
  keyword?: string
  page?: number
  page_size?: number
}) {
  return request<KnowledgeListResponse<CaseStudy>>({
    url: '/v1/knowledge/case-studies',
    method: 'get',
    params
  })
}

// 获取故障案例库详情
export function getCaseStudy(id: number) {
  return request<CaseStudy>({
    url: `/v1/knowledge/case-studies/${id}`,
    method: 'get'
  })
}

// 创建故障案例库
export function createCaseStudy(data: Partial<CaseStudy>) {
  return request<CaseStudy>({
    url: '/v1/knowledge/case-studies',
    method: 'post',
    data
  })
}

// 更新故障案例库
export function updateCaseStudy(id: number, data: Partial<CaseStudy>) {
  return request<CaseStudy>({
    url: `/v1/knowledge/case-studies/${id}`,
    method: 'put',
    data
  })
}

// 删除故障案例库
export function deleteCaseStudy(id: number) {
  return request({
    url: `/v1/knowledge/case-studies/${id}`,
    method: 'delete'
  })
}

// ========== LLM搜索 API ==========

// 流式搜索知识库（SSE）
export function streamKnowledgeSearch(
  params: {
    q: string
    category?: string
  },
  onChunk: (chunk: StreamChunk) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): () => void {
  // 构建查询参数
  const queryParams = new URLSearchParams({
    q: params.q
  })
  if (params.category) {
    queryParams.append('category', params.category)
  }

  // 获取API基础URL
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  const url = `${baseURL}/v1/knowledge/search/stream?${queryParams.toString()}`

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
