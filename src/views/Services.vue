<template>
  <div class="services-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>服务状态监控</span>
          <div class="header-actions">
            <el-select v-model="selectedHost" placeholder="选择主机" style="width: 200px" @change="loadServices">
              <el-option label="全部主机" value="" />
              <el-option
                v-for="agent in agents"
                :key="agent.host_id"
                :label="`${agent.hostname || agent.host_id} (${agent.host_id})`"
                :value="agent.host_id"
              />
            </el-select>
            <el-button type="primary" @click="loadServices" style="margin-left: 10px">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="services"
        stripe
        style="width: 100%"
        empty-text="暂无数据"
      >
        <el-table-column prop="host_id" label="主机ID" width="150" />
        <el-table-column prop="name" label="服务名称" width="200" />
        <el-table-column label="端口" width="100">
          <template #default="{ row }">
            <span v-if="row.port">{{ row.port }}</span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="端口状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.port" :type="row.port_accessible ? 'success' : 'danger'">
              {{ row.port_accessible ? '可访问' : '不可访问' }}
            </el-tag>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="服务状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开机自启" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="运行时长" width="150">
          <template #default="{ row }">
            {{ formatUptime(row.uptime_seconds) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            {{ dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { axios } from '@/utils/request'
import type { Agent, ApiResponse } from '@/types'

interface ServiceInfo {
  id: number
  host_id: string
  timestamp: string
  name: string
  status: string
  enabled: boolean
  description: string
  uptime_seconds: number
  port?: number              // 服务端口（可选）
  port_accessible?: boolean  // 端口是否可访问（可选）
}

const loading = ref(false)
const selectedHost = ref('')
const agents = ref<Agent[]>([])
const services = ref<ServiceInfo[]>([])

const loadAgents = async () => {
  try {
    const res = await axios.get('/v1/agents', { params: { page: 1, page_size: 100 } }) as unknown as ApiResponse<{ agents: Agent[] }>
    agents.value = res.data?.agents || []
  } catch (error) {
    console.error('Failed to load agents:', error)
  }
}

const loadServices = async () => {
  try {
    loading.value = true
    const params: any = {}
    if (selectedHost.value) {
      params.host_id = selectedHost.value
    }
    
    const res = await axios.get('/v1/services', { params }) as unknown as ApiResponse<ServiceInfo[]>
    services.value = res.data || []
  } catch (error) {
    ElMessage.error('加载服务状态失败')
  } finally {
    loading.value = false
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'running':
      return 'success'
    case 'stopped':
      return 'info'
    case 'failed':
      return 'danger'
    default:
      return 'warning'
  }
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    failed: '失败',
    unknown: '未知'
  }
  return statusMap[status] || status
}

const formatUptime = (seconds: number) => {
  if (seconds <= 0) return '-'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) {
    return `${days}天${hours}小时${minutes}分钟`
  } else if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

onMounted(() => {
  loadAgents()
  loadServices()
})
</script>

<style scoped>
.services-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
}
</style>

