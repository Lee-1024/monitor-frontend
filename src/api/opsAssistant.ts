import request from '@/utils/request'

export interface OpsAssistantTimeRange {
  from: string
  to: string
}

export interface OpsAssistantChatRequest {
  message: string
  session_id?: string
  host_id?: string
  time_range?: OpsAssistantTimeRange
}

export interface OpsAssistantSession {
  session_id: string
  user_id: number
  title: string
  summary: string
  updated_at: string
  context?: {
    host_id?: string
    host_name?: string
    last_intent?: string
  }
}

export interface OpsAssistantToolCall {
  tool: string
  summary: string
  status?: 'running' | 'completed' | 'failed' | 'success'
  duration_ms?: number
}

export interface OpsAssistantEvidence {
  type: string
  source: string
  text: string
}

export interface OpsAssistantPossibleCause {
  cause: string
  probability: string
  evidence_refs?: string[]
}

export interface OpsAssistantRecommendation {
  priority: string
  action: string
  type: string
}

export interface OpsAssistantRelatedEntities {
  hosts?: string[]
  alerts?: string[]
  knowledge_items?: string[]
}

export interface OpsAssistantDiagnosisReport {
  title: string
  summary: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  evidence?: OpsAssistantEvidence[]
  possible_causes?: OpsAssistantPossibleCause[]
  recommendations?: OpsAssistantRecommendation[]
  related_entities?: OpsAssistantRelatedEntities
}

export interface OpsAssistantTimelineEvent {
  type: 'graph_node' | 'tool_call' | 'status'
  node?: string
  tool?: string
  status?: string
  summary?: string
  content?: string
  duration_ms?: number
}

export interface OpsAssistantChatResponse {
  session_id: string
  answer: string
  tool_calls: OpsAssistantToolCall[]
}

export interface OpsAssistantStreamEvent {
  type: 'content' | 'tool_call' | 'status' | 'done' | 'error' | 'graph_node' | 'report_delta' | 'report'
  content?: string
  tool?: string
  summary?: string
  session_id?: string
  message?: string
  node?: string
  status?: string
  duration_ms?: number
  section?: string
  report?: OpsAssistantDiagnosisReport
  data?: unknown
}

export function chatOpsAssistant(data: OpsAssistantChatRequest) {
  return request<OpsAssistantChatResponse>({
    url: '/v1/ops-assistant/chat',
    method: 'post',
    data,
    timeout: 60000
  })
}

export function listOpsAssistantSessions() {
  return request<OpsAssistantSession[]>({
    url: '/v1/ops-assistant/sessions',
    method: 'get'
  })
}

export function getOpsAssistantSession(sessionId: string) {
  return request<OpsAssistantSession>({
    url: `/v1/ops-assistant/sessions/${sessionId}`,
    method: 'get'
  })
}

export function deleteOpsAssistantSession(sessionId: string) {
  return request({
    url: `/v1/ops-assistant/sessions/${sessionId}`,
    method: 'delete'
  })
}

export function streamOpsAssistant(
  data: OpsAssistantChatRequest,
  onEvent: (event: OpsAssistantStreamEvent) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): () => void {
  const params = new URLSearchParams({ message: data.message })
  if (data.session_id) params.set('session_id', data.session_id)
  if (data.host_id) params.set('host_id', data.host_id)
  if (data.time_range?.from && data.time_range?.to) {
    params.set('from', data.time_range.from)
    params.set('to', data.time_range.to)
  }

  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  const url = `${baseURL}/v1/ops-assistant/chat/stream?${params.toString()}`
  const token = localStorage.getItem('token')
  const abortController = new AbortController()

  const headers: HeadersInit = {
    Accept: 'text/event-stream',
    'Cache-Control': 'no-cache'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  fetch(url, {
    method: 'GET',
    headers,
    signal: abortController.signal
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      const read = async (): Promise<void> => {
        try {
          const { done, value } = await reader.read()
          if (done) {
            onComplete?.()
            return
          }

          buffer += decoder.decode(value, { stream: true })
          const chunks = buffer.split('\n\n')
          buffer = chunks.pop() || ''

          for (const chunk of chunks) {
            const line = chunk.trim()
            if (!line.startsWith('data: ')) continue

            try {
              const event = JSON.parse(line.slice(6)) as OpsAssistantStreamEvent
              onEvent(event)
              await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
              if (event.type === 'done') {
                onComplete?.()
                return
              }
              if (event.type === 'error') {
                onError?.(new Error(event.message || '运维助手响应失败'))
                return
              }
            } catch (error) {
              onError?.(error as Error)
              return
            }
          }

          await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
          read()
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            onError?.(error)
          }
        }
      }

      read()
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        onError?.(error)
      }
    })

  return () => abortController.abort()
}
