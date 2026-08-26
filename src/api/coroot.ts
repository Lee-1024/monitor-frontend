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
    if (value !== undefined && value !== null && value !== '') return formatCorootValue(value)
  }
  return '-'
}

export function formatCorootValue(value: any): string | number {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (Array.isArray(value)) return value.map(item => formatCorootValue(item)).join(', ')
  if (value && typeof value === 'object') {
    if (value.name) return String(value.name)
    if (value.status) return String(value.status)
    if (value.value !== undefined) return formatCorootValue(value.value)
    return Object.entries(value).map(([key, item]) => `${key}: ${formatCorootValue(item)}`).join('; ')
  }
  return '-'
}

export function parseCorootApplicationID(id: unknown) {
  const parts = String(id || '').split(':')
  if (parts.length < 4) return { name: String(id || '-'), namespace: '-', kind: '-' }
  return { name: parts.slice(3).join(':'), namespace: parts[1] || '-', kind: parts[2] || '-' }
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
