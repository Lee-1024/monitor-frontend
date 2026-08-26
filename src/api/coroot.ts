import request from '@/utils/request'

export interface CorootResponse<T = unknown> {
  enabled: boolean
  available: boolean
  data?: T
  error?: string
  checked_at: string
}

export function corootRows(payload: any, collection: string): any[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload[collection])) return payload[collection]
  if (Array.isArray(payload.items)) return payload.items
  if (payload.data) {
    const rows = corootRows(payload.data, collection)
    if (rows.length) return rows
  }
  if (payload.context) {
    const rows = corootRows(payload.context, collection)
    if (rows.length) return rows
  }
  if (payload.search) {
    const rows = corootRows(payload.search, collection)
    if (rows.length) return rows
  }
  for (const key of [collection, 'items', 'data', 'results', 'applications', 'incidents', 'nodes', 'edges', 'services', 'topology']) {
    if (Array.isArray(payload[key])) return payload[key]
    if (payload[key] && typeof payload[key] === 'object') {
      const rows = corootRows(payload[key], collection)
      if (rows.length) return rows
    }
  }
  return []
}

export function corootField(row: any, ...keys: string[]) {
  for (const key of keys) {
    const value = key.split('.').reduce((current, part) => current?.[part], row)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return '-'
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
