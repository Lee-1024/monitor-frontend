import { axios } from '@/utils/request'
import type { ApiResponse } from '@/types'

export interface DockerContainer {
  id: number
  host_id: string
  timestamp: string
  container_id: string
  name: string
  image: string
  state: string
  status: string
  created_unix: number
  started_at: string
  restart_count: number
  ports: string
  cpu_percent: number
  memory_usage: number
  memory_limit: number
  memory_percent: number
  network_rx: number
  network_tx: number
  block_read: number
  block_write: number
}

export interface DockerHistoryPoint {
  timestamp: string
  container_name: string
  cpu_percent: number
  memory_percent: number
  memory_usage: number
}

export function getDockerContainers(params: Record<string, any>) {
  return axios.get('/v1/docker/containers', { params }) as unknown as Promise<ApiResponse<{
    containers: DockerContainer[]
    total: number
    page: number
    page_size: number
  }>>
}

export function getDockerHistory(params: Record<string, any>) {
  return axios.get('/v1/docker/history', { params }) as unknown as Promise<ApiResponse<DockerHistoryPoint[]>>
}
