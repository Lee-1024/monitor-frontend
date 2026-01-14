// ============================================
// 文件: api/alert.ts
// ============================================
import request from '@/utils/request'
import type { ApiResponse } from '@/types'

// 通知渠道相关类型
export interface NotificationChannel {
  id: number
  created_at: string
  updated_at: string
  type: 'email' | 'dingtalk' | 'wechat' | 'feishu'
  name: string
  enabled: boolean
  config: Record<string, string>
  description: string
}

// 告警规则相关类型
export interface AlertRule {
  id: number
  created_at: string
  updated_at: string
  name: string
  description: string
  enabled: boolean
  severity: 'critical' | 'warning' | 'info'
  metric_type: 'cpu' | 'memory' | 'disk' | 'network' | 'host_down' | 'service_port'
  host_id: string
  mountpoint?: string  // 挂载点（仅用于 disk 指标）
  service_port?: number  // 服务端口（仅用于 service_port 指标）
  condition: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'
  threshold: number
  duration: number
  inhibit_duration: number // 抑制持续时间（秒）
  notify_channels: string[]
  receivers: string[]
  silence_start?: string
  silence_end?: string
}

// 告警历史相关类型
export interface AlertHistory {
  id: number
  created_at: string
  rule_id: number
  rule_name: string
  host_id: string
  hostname: string
  severity: string
  status: 'firing' | 'resolved'
  fired_at: string
  resolved_at?: string
  metric_type: string
  metric_value: number
  threshold: number
  message: string
  labels: Record<string, string>
  notify_status: string
  notify_error?: string
}

// 告警静默相关类型
export interface AlertSilence {
  id: number
  created_at: string
  updated_at: string
  name: string
  rule_ids: number[]
  host_ids: string[]
  start_time: string
  end_time: string
  enabled: boolean
  comment: string
  creator: string
}

// ============================================
// 通知渠道API
// ============================================

export const getNotificationChannels = (enabled?: boolean) => {
  const params: any = {}
  if (enabled !== undefined) {
    params.enabled = enabled
  }
  return request<NotificationChannel[]>({
    url: '/v1/alerts/channels',
    method: 'get',
    params
  })
}

export const createNotificationChannel = (channel: Partial<NotificationChannel>) => {
  return request<NotificationChannel>({
    url: '/v1/alerts/channels',
    method: 'post',
    data: channel
  })
}

export const updateNotificationChannel = (id: number, channel: Partial<NotificationChannel>) => {
  return request<NotificationChannel>({
    url: `/v1/alerts/channels/${id}`,
    method: 'put',
    data: channel
  })
}

export const deleteNotificationChannel = (id: number) => {
  return request({
    url: `/v1/alerts/channels/${id}`,
    method: 'delete'
  })
}

export const testNotificationChannel = (channel: Partial<NotificationChannel>) => {
  return request({
    url: '/v1/alerts/channels/test',
    method: 'post',
    data: channel
  })
}

// ============================================
// 告警规则API
// ============================================

export const getAlertRules = (enabled?: boolean) => {
  const params: any = {}
  if (enabled !== undefined) {
    params.enabled = enabled
  }
  return request<AlertRule[]>({
    url: '/v1/alerts/rules',
    method: 'get',
    params
  })
}

export const createAlertRule = (rule: Partial<AlertRule>) => {
  return request<AlertRule>({
    url: '/v1/alerts/rules',
    method: 'post',
    data: rule
  })
}

export const updateAlertRule = (id: number, rule: Partial<AlertRule>) => {
  return request<AlertRule>({
    url: `/v1/alerts/rules/${id}`,
    method: 'put',
    data: rule
  })
}

export const deleteAlertRule = (id: number) => {
  return request({
    url: `/v1/alerts/rules/${id}`,
    method: 'delete'
  })
}

// ============================================
// 告警历史API
// ============================================

export const getAlertHistory = (params?: {
  rule_id?: number
  host_id?: string
  status?: string
  limit?: number
}) => {
  return request<AlertHistory[]>({
    url: '/v1/alerts/history',
    method: 'get',
    params
  })
}

export const deleteAlertHistory = (id: number) => {
  return request({
    url: `/v1/alerts/history/${id}`,
    method: 'delete'
  })
}

export const deleteAlertHistories = (ids: number[]) => {
  return request({
    url: '/v1/alerts/history/batch',
    method: 'delete',
    data: { ids }
  })
}

// 获取未读告警数量（firing状态的告警）
export const getUnreadAlertCount = () => {
  return request<number>({
    url: '/v1/alerts/history/unread-count',
    method: 'get'
  })
}

// ============================================
// 告警静默API
// ============================================

export const getAlertSilences = (enabled?: boolean) => {
  const params: any = {}
  if (enabled !== undefined) {
    params.enabled = enabled
  }
  return request<AlertSilence[]>({
    url: '/v1/alerts/silences',
    method: 'get',
    params
  })
}

export const createAlertSilence = (silence: Partial<AlertSilence>) => {
  return request<AlertSilence>({
    url: '/v1/alerts/silences',
    method: 'post',
    data: silence
  })
}

export const updateAlertSilence = (id: number, silence: Partial<AlertSilence>) => {
  return request<AlertSilence>({
    url: `/v1/alerts/silences/${id}`,
    method: 'put',
    data: silence
  })
}

export const deleteAlertSilence = (id: number) => {
  return request({
    url: `/v1/alerts/silences/${id}`,
    method: 'delete'
  })
}

