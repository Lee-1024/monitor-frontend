import request from '@/utils/request'

export interface ServerProbeTarget {
  id: number
  created_at: string
  updated_at: string
  name: string
  type: 'tcp' | 'http'
  host: string
  port: number
  url: string
  interval_seconds: number
  timeout_seconds: number
  enabled: boolean
  description: string
  last_status: 'unknown' | 'up' | 'down'
  last_checked_at?: string
  last_success_at?: string
  last_error: string
  last_latency_ms: number
}

export interface ServerProbeResult {
  id: number
  created_at: string
  target_id: number
  checked_at: string
  status: 'up' | 'down'
  latency_ms: number
  error: string
  http_status?: number
}

export function getServerProbeTargets() {
  return request<ServerProbeTarget[]>({
    url: '/v1/server-probes',
    method: 'get'
  })
}

export function createServerProbeTarget(data: Partial<ServerProbeTarget>) {
  return request<ServerProbeTarget>({
    url: '/v1/server-probes',
    method: 'post',
    data
  })
}

export function updateServerProbeTarget(id: number, data: Partial<ServerProbeTarget>) {
  return request<ServerProbeTarget>({
    url: `/v1/server-probes/${id}`,
    method: 'put',
    data
  })
}

export function deleteServerProbeTarget(id: number) {
  return request({
    url: `/v1/server-probes/${id}`,
    method: 'delete'
  })
}

export function testServerProbeTarget(id: number) {
  return request<ServerProbeResult>({
    url: `/v1/server-probes/${id}/test`,
    method: 'post'
  })
}

export function getServerProbeResults(id: number, limit = 50) {
  return request<ServerProbeResult[]>({
    url: `/v1/server-probes/${id}/results`,
    method: 'get',
    params: { limit }
  })
}
