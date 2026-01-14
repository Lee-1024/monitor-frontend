import { axios } from '@/utils/request'
import type { ApiResponse } from '@/types'

export interface ServiceInfo {
  id: number
  host_id: string
  timestamp: string
  name: string
  status: string
  enabled: boolean
  description: string
  uptime_seconds: number
  port?: number              // 服务端口（可选，由 Agent 定期检查）
  port_accessible?: boolean  // 端口是否可访问（可选，由 Agent 定期检查）
}

// 获取服务状态
export function getServices(hostId?: string) {
  const params: any = {}
  if (hostId) {
    params.host_id = hostId
  }
  return axios.get<ServiceInfo[]>('/v1/services', { params })
}

