import request from '@/utils/request'

export interface CorootResponse<T = unknown> {
  enabled: boolean
  available: boolean
  data?: T
  error?: string
  checked_at: string
}

export function getCorootOverview() {
  return request<CorootResponse>({ url: '/v1/coroot/overview', method: 'get' })
}

export function getCorootResource(resource: string, params?: Record<string, string | number | boolean>) {
  return request<CorootResponse>({ url: `/v1/coroot/${resource}`, method: 'get', params })
}

export function createCorootSession() {
  return request<{ expires_in: number }>({ url: '/v1/integrations/coroot/session', method: 'post' })
}
