<template>
  <div class="agent-history-container">
    <div class="page-toolbar">
      <div class="toolbar-left">
        <el-button @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div>
          <h2>监控历史信息</h2>
          <div class="host-subtitle">
            {{ agent.hostname || hostId }} <span v-if="agent.ip">({{ agent.ip }})</span>
          </div>
        </div>
      </div>
      <div class="toolbar-actions">
        <el-segmented
          v-model="timeRange"
          :options="rangeOptions"
          @change="fetchHistory"
        />
        <el-button type="primary" :icon="Refresh" @click="fetchHistory">刷新</el-button>
      </div>
    </div>

    <el-card shadow="hover" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>主机信息</span>
          <el-tag :type="agent.status === 'online' ? 'success' : 'danger'">
            {{ agent.status === 'online' ? '在线' : '离线' }}
          </el-tag>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="主机ID">{{ agent.host_id }}</el-descriptions-item>
        <el-descriptions-item label="主机名">{{ agent.hostname }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ agent.ip }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ agent.os }}</el-descriptions-item>
        <el-descriptions-item label="架构">{{ agent.arch }}</el-descriptions-item>
        <el-descriptions-item label="最后上报">
          {{ agent.last_seen ? dayjs(agent.last_seen).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-title">
              <el-icon color="#409EFF" :size="20"><CpuIcon /></el-icon>
              <span>CPU使用率趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <CPUHistoryChart :data="cpuHistory" :loading="historyLoading" />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-title">
              <el-icon color="#F56C6C" :size="20"><MemoryIcon /></el-icon>
              <span>内存使用率趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <MemoryHistoryChart :data="memoryHistory" :loading="historyLoading" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-title">
              <el-icon color="#67C23A" :size="20"><NetworkIcon /></el-icon>
              <span>网络流量趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <NetworkHistoryChart :data="networkHistory" :loading="historyLoading" />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <div class="chart-title">
                <el-icon color="#E6A23C" :size="20"><DiskIcon /></el-icon>
                <span>磁盘使用趋势</span>
              </div>
              <el-tag v-if="diskPartitions.length > 0" type="info" size="small">
                {{ diskPartitions.length }} 个挂载点
              </el-tag>
            </div>
          </template>
          <div class="chart-container">
            <DiskHistoryChart
              v-if="diskPartitions.length > 0"
              :data="allDiskHistory"
              :loading="historyLoading"
              :mountpoints="diskPartitions.map(part => part.mountpoint || part._mountpoint)"
            />
            <el-empty v-else description="暂无磁盘挂载点数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import CpuIcon from '@/icons/CpuIcon.vue'
import MemoryIcon from '@/icons/MemoryIcon.vue'
import DiskIcon from '@/icons/DiskIcon.vue'
import NetworkIcon from '@/icons/NetworkIcon.vue'
import CPUHistoryChart from '@/components/CPUHistoryChart.vue'
import MemoryHistoryChart from '@/components/MemoryHistoryChart.vue'
import DiskHistoryChart from '@/components/DiskHistoryChart.vue'
import NetworkHistoryChart from '@/components/NetworkHistoryChart.vue'
import { getAgent } from '@/api/agent'
import { getHistoryMetrics, getLatestMetrics } from '@/api/metrics'
import type { Agent, ApiResponse, MetricPoint } from '@/types'
import {
  defaultMetricHistoryRange,
  getMetricHistoryInterval,
  metricHistoryRangeOptions,
  type MetricHistoryRangeValue
} from '@/utils/metricHistoryRanges'

const route = useRoute()
const hostId = route.params.id as string

const loading = ref(false)
const historyLoading = ref(false)
const agent = ref<Partial<Agent>>({})
const diskPartitions = ref<any[]>([])
const cpuHistory = ref<MetricPoint[]>([])
const memoryHistory = ref<MetricPoint[]>([])
const networkHistory = ref<MetricPoint[]>([])
const allDiskHistory = ref<Array<{ timestamp: string; values: Record<string, number> }>>([])
const timeRange = ref<MetricHistoryRangeValue>(defaultMetricHistoryRange.value)

const rangeOptions = computed(() => metricHistoryRangeOptions.map(option => ({
  label: option.label,
  value: option.value
})))

const fetchAgent = async () => {
  try {
    loading.value = true
    const res = await getAgent(hostId) as unknown as ApiResponse<Agent>
    agent.value = res.data || {}
  } catch (error) {
    ElMessage.error('获取主机信息失败')
  } finally {
    loading.value = false
  }
}

const updateDiskPartitions = (disk: any) => {
  if (!disk || typeof disk !== 'object') {
    diskPartitions.value = []
    return
  }

  if (Array.isArray(disk.partitions)) {
    diskPartitions.value = disk.partitions
    return
  }

  if (disk.mountpoint || disk._mountpoint || disk.total) {
    diskPartitions.value = [{
      mountpoint: disk.mountpoint || disk._mountpoint || '/',
      device: disk.device,
      fstype: disk.fstype,
      total: disk.total,
      used: disk.used,
      free: disk.free,
      used_percent: disk.used_percent
    }]
    return
  }

  diskPartitions.value = []
}

const fetchDiskPartitions = async () => {
  try {
    const res = await getLatestMetrics(hostId) as unknown as ApiResponse<any>
    updateDiskPartitions(res.data?.disk)
  } catch (error) {
    console.error('Failed to fetch disk partitions:', error)
    diskPartitions.value = []
  }
}

const fetchAllDiskHistory = async (interval: string) => {
  if (diskPartitions.value.length === 0) {
    allDiskHistory.value = []
    return
  }

  const results = await Promise.all(diskPartitions.value.map(async (part) => {
    const mountpoint = part.mountpoint || part._mountpoint
    if (!mountpoint) return null

    try {
      const res = await getHistoryMetrics({
        host_id: hostId,
        type: 'disk',
        start: timeRange.value,
        interval,
        mountpoint
      }) as unknown as ApiResponse<MetricPoint[]>
      return { mountpoint, data: res.data || [] }
    } catch (error) {
      console.error(`Failed to fetch disk history for ${mountpoint}:`, error)
      return { mountpoint, data: [] }
    }
  }))

  const timeMap = new Map<string, Record<string, number>>()
  results.filter(Boolean).forEach((result) => {
    const item = result as { mountpoint: string; data: MetricPoint[] }
    item.data.forEach((point) => {
      if (!timeMap.has(point.timestamp)) {
        timeMap.set(point.timestamp, {})
      }
      const values = timeMap.get(point.timestamp)!
      values[`${item.mountpoint}_used_percent`] = point.values.used_percent || 0
      values[`${item.mountpoint}_used`] = point.values.used || 0
      values[`${item.mountpoint}_total`] = point.values.total || 0
    })
  })

  allDiskHistory.value = Array.from(timeMap.entries())
    .map(([timestamp, values]) => ({ timestamp, values }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

const fetchHistory = async () => {
  try {
    historyLoading.value = true
    const interval = getMetricHistoryInterval(timeRange.value)
    const [cpuRes, memRes, netRes] = await Promise.all([
      getHistoryMetrics({ host_id: hostId, type: 'cpu', start: timeRange.value, interval }),
      getHistoryMetrics({ host_id: hostId, type: 'memory', start: timeRange.value, interval }),
      getHistoryMetrics({ host_id: hostId, type: 'network', start: timeRange.value, interval })
    ]) as unknown as [
      ApiResponse<MetricPoint[]>,
      ApiResponse<MetricPoint[]>,
      ApiResponse<MetricPoint[]>
    ]

    cpuHistory.value = cpuRes.data || []
    memoryHistory.value = memRes.data || []
    networkHistory.value = netRes.data || []
    await fetchAllDiskHistory(interval)
  } catch (error) {
    console.error('Failed to fetch history:', error)
    ElMessage.error('获取历史数据失败')
  } finally {
    historyLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchAgent(), fetchDiskPartitions()])
  await fetchHistory()
})
</script>

<style scoped>
.agent-history-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.toolbar-left,
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-left h2 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.host-subtitle {
  color: #606266;
  font-size: 13px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-card {
  height: 100%;
  border-radius: 8px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  min-height: 420px;
}

@media (max-width: 768px) {
  .agent-history-container {
    padding: 10px;
  }

  .page-toolbar,
  .toolbar-left,
  .toolbar-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
