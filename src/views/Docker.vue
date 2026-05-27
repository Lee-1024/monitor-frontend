<template>
  <div class="docker-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>Docker容器趋势</span>
          <div class="header-actions">
            <el-select v-model="selectedHost" placeholder="选择主机" class="host-select" @change="reloadAll">
              <el-option label="全部主机" value="" />
              <el-option
                v-for="agent in agents"
                :key="agent.host_id"
                :label="`${agent.hostname || agent.host_id} (${agent.host_id})`"
                :value="agent.host_id"
              />
            </el-select>
            <el-radio-group v-model="chartMetricType" @change="loadHistory">
              <el-radio-button label="cpu">CPU</el-radio-button>
              <el-radio-button label="memory">内存</el-radio-button>
            </el-radio-group>
            <el-select v-model="chartTimeRange" class="range-select" @change="loadHistory">
              <el-option label="最近1小时" value="1h" />
              <el-option label="最近3小时" value="3h" />
              <el-option label="最近6小时" value="6h" />
              <el-option label="最近12小时" value="12h" />
              <el-option label="最近24小时" value="24h" />
            </el-select>
            <el-button type="primary" @click="loadHistory">
              <el-icon><Refresh /></el-icon>
              刷新图表
            </el-button>
          </div>
        </div>
      </template>
      <DockerHistoryChart :data="historyData" :loading="historyLoading" :metric-type="chartMetricType" />
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>Docker容器列表</span>
          <div class="header-actions">
            <el-select v-model="sortBy" class="sort-select">
              <el-option label="CPU占用降序" value="cpu_desc" />
              <el-option label="内存占用降序" value="memory_desc" />
              <el-option label="名称升序" value="name_asc" />
            </el-select>
            <el-button type="primary" @click="loadContainers">
              <el-icon><Refresh /></el-icon>
              刷新列表
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="sortedContainers" stripe empty-text="暂无Docker容器数据">
        <el-table-column prop="host_id" label="主机ID" width="150" />
        <el-table-column prop="name" label="容器名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="image" label="镜像" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStateType(row.state)">{{ row.state || 'unknown' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="CPU%" width="120">
          <template #default="{ row }">
            <el-progress :percentage="clampPercent(row.cpu_percent)" :color="getProgressColor(row.cpu_percent)" :format="() => `${row.cpu_percent.toFixed(1)}%`" />
          </template>
        </el-table-column>
        <el-table-column label="内存%" width="120">
          <template #default="{ row }">
            <el-progress :percentage="clampPercent(row.memory_percent)" :color="getProgressColor(row.memory_percent)" :format="() => `${row.memory_percent.toFixed(1)}%`" />
          </template>
        </el-table-column>
        <el-table-column label="内存用量" width="150">
          <template #default="{ row }">
            {{ formatBytes(row.memory_usage) }} / {{ formatBytes(row.memory_limit) }}
          </template>
        </el-table-column>
        <el-table-column label="网络IO" width="170">
          <template #default="{ row }">
            {{ formatBytes(row.network_rx) }} / {{ formatBytes(row.network_tx) }}
          </template>
        </el-table-column>
        <el-table-column label="磁盘IO" width="170">
          <template #default="{ row }">
            {{ formatBytes(row.block_read) }} / {{ formatBytes(row.block_write) }}
          </template>
        </el-table-column>
        <el-table-column prop="ports" label="端口" min-width="180" show-overflow-tooltip />
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            {{ dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <span>共 {{ pagination.total }} 条</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { axios } from '@/utils/request'
import type { Agent, ApiResponse } from '@/types'
import { getDockerContainers, getDockerHistory, type DockerContainer, type DockerHistoryPoint } from '@/api/docker'
import DockerHistoryChart from '@/components/DockerHistoryChart.vue'

const loading = ref(false)
const historyLoading = ref(false)
const selectedHost = ref('')
const sortBy = ref('cpu_desc')
const agents = ref<Agent[]>([])
const containers = ref<DockerContainer[]>([])
const historyData = ref<DockerHistoryPoint[]>([])
const chartMetricType = ref<'cpu' | 'memory'>('cpu')
const chartTimeRange = ref('1h')
const pagination = ref({ page: 1, pageSize: 10, total: 0 })

const sortedContainers = computed(() => {
  const rows = [...containers.value]
  if (sortBy.value === 'memory_desc') return rows.sort((a, b) => b.memory_percent - a.memory_percent)
  if (sortBy.value === 'name_asc') return rows.sort((a, b) => a.name.localeCompare(b.name))
  return rows.sort((a, b) => b.cpu_percent - a.cpu_percent)
})

async function loadAgents() {
  try {
    const res = await axios.get('/v1/agents', { params: { page: 1, page_size: 100 } }) as unknown as ApiResponse<{ agents: Agent[] }>
    agents.value = res.data?.agents || []
  } catch (error) {
    console.error('Failed to load agents:', error)
  }
}

async function loadContainers() {
  try {
    loading.value = true
    const params: Record<string, any> = {
      page: pagination.value.page,
      page_size: pagination.value.pageSize
    }
    if (selectedHost.value) params.host_id = selectedHost.value
    const res = await getDockerContainers(params)
    containers.value = res.data?.containers || []
    pagination.value.total = res.data?.total || 0
  } catch (error: any) {
    ElMessage.error(`加载Docker容器失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  try {
    historyLoading.value = true
    const hours = Number(chartTimeRange.value.replace('h', ''))
    const end = dayjs()
    const start = end.subtract(hours, 'hour')
    const params: Record<string, any> = {
      metric_type: chartMetricType.value,
      top_n: 10,
      start: start.toISOString(),
      end: end.toISOString(),
      limit: 5000
    }
    if (selectedHost.value) params.host_id = selectedHost.value
    const res = await getDockerHistory(params)
    historyData.value = res.data || []
  } catch (error: any) {
    ElMessage.error(`加载Docker趋势失败: ${error.message}`)
    historyData.value = []
  } finally {
    historyLoading.value = false
  }
}

function reloadAll() {
  pagination.value.page = 1
  loadContainers()
  loadHistory()
}

function handleSizeChange(size: number) {
  pagination.value.pageSize = size
  pagination.value.page = 1
  loadContainers()
}

function handlePageChange(page: number) {
  pagination.value.page = page
  loadContainers()
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(value || 0, 100))
}

function getProgressColor(value: number) {
  if (value > 90) return '#f56c6c'
  if (value > 75) return '#e6a23c'
  return '#67c23a'
}

function getStateType(state: string) {
  if (state === 'running') return 'success'
  if (state === 'exited' || state === 'stopped') return 'info'
  if (state === 'dead') return 'danger'
  return 'warning'
}

function formatBytes(bytes: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

onMounted(() => {
  loadAgents()
  loadContainers()
  loadHistory()
})
</script>

<style scoped>
.docker-container {
  padding: 20px;
}

.table-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-size: 18px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.host-select {
  width: 220px;
}

.range-select,
.sort-select {
  width: 140px;
}

.pagination-row {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #606266;
  font-size: 14px;
}
</style>
