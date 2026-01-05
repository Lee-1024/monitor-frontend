import request from '@/utils/request'
import type { Agent, ApiResponse, PaginatedResponse } from '@/types'

// 获取Agent列表
export const getAgents = (params?: {
  status?: string
  page?: number
  page_size?: number
}) => {
  return request<ApiResponse<PaginatedResponse<Agent>>>({
    url: '/v1/agents',
    method: 'get',
    params
  })
}

// 获取单个Agent
export const getAgent = (hostId: string) => {
  return request<ApiResponse<Agent>>({
    url: `/v1/agents/${hostId}`,
    method: 'get'
  })
}

// 删除Agent
export const deleteAgent = (hostId: string) => {
  return request<ApiResponse>({
    url: `/v1/agents/${hostId}`,
    method: 'delete'
  })
}