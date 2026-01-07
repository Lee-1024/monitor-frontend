// Agent信息
export interface Agent {
  host_id: string
  hostname: string
  ip: string
  os: string
  arch: string
  tags: Record<string, string>
  status: 'online' | 'offline'
  last_seen: string
  created_at: string
}

// 指标数据点
export interface MetricPoint {
  timestamp: string
  values: Record<string, number>
}

// 最新指标
export interface LatestMetrics {
  host_id: string
  timestamp: string
  cpu: {
    usage_percent: number
    load_avg_1: number
    load_avg_5: number
    load_avg_15: number
    core_count: number
  }
  memory: {
    total: number
    used: number
    free: number
    used_percent: number
    available: number
  }
  disk: Record<string, any>
  network: Record<string, any>
}

// 概览统计
export interface Overview {
  total_agents: number
  online_agents: number
  offline_agents: number
  avg_cpu: number
  avg_memory: number
  total_metrics: number
}

// API响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页响应
export interface PaginatedResponse<T> {
  agents?: T[]
  users?: T[]
  total: number
  page: number
  page_size: number
}