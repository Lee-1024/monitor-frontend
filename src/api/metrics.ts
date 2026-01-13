import request from '@/utils/request'
import type { LatestMetrics, MetricPoint, Overview, ApiResponse } from '@/types'

// 获取最新指标
export const getLatestMetrics = (hostId: string) => {
  return request<ApiResponse<LatestMetrics>>({
    url: '/v1/metrics/latest',
    method: 'get',
    params: { host_id: hostId }
  })
}

// 获取历史指标
export const getHistoryMetrics = (params: {
  host_id: string
  type: string
  start?: string
  end?: string
  interval?: string
  mountpoint?: string  // 磁盘专用参数
}) => {
  return request<ApiResponse<MetricPoint[]>>({
    url: '/v1/metrics/history',
    method: 'get',
    params
  })
}

// 获取概览
export const getOverview = () => {
  return request<ApiResponse<Overview>>({
    url: '/v1/stats/overview',
    method: 'get'
  })
}

// 获取Top指标
export const getTopMetrics = (params: {
  type: string
  limit?: number
  order?: string
}) => {
  return request<ApiResponse<any[]>>({
    url: '/v1/stats/top',
    method: 'get',
    params
  })
}