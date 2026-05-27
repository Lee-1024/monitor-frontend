<template>
  <div class="gpu-page">
    <div class="summary-grid">
      <el-card v-for="item in summaryCards" :key="item.label" class="summary-card">
        <div class="summary-label">{{ item.label }}</div>
        <div class="summary-value">{{ item.value }}</div>
      </el-card>
    </div>

    <div class="chart-grid">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>GPU 使用率 Top</span>
            <el-button type="primary" @click="loadData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>
        <div ref="utilChartRef" class="chart"></div>
      </el-card>
      <el-card>
        <template #header>
          <div class="card-header">
            <span>显存使用率 Top</span>
          </div>
        </template>
        <div ref="memoryChartRef" class="chart"></div>
      </el-card>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>GPU 设备列表</span>
          <el-select v-model="selectedHost" clearable placeholder="全部主机" class="host-select" @change="loadData">
            <el-option
              v-for="agent in agents"
              :key="agent.host_id"
              :label="`${agent.hostname || agent.host_id} (${agent.host_id})`"
              :value="agent.host_id"
            />
          </el-select>
        </div>
      </template>
      <el-table v-loading="loading" :data="filteredDevices" stripe empty-text="暂无 GPU 数据">
        <el-table-column prop="hostname" label="主机" min-width="160" show-overflow-tooltip />
        <el-table-column prop="vendor" label="厂商" width="100" />
        <el-table-column prop="name" label="型号" min-width="180" show-overflow-tooltip />
        <el-table-column label="GPU 使用率" width="150">
          <template #default="{ row }">
            <el-progress :percentage="clampPercent(row.utilization_percent)" :format="() => `${formatNumber(row.utilization_percent)}%`" />
          </template>
        </el-table-column>
        <el-table-column label="显存" width="180">
          <template #default="{ row }">
            {{ formatBytes(row.memory_used) }} / {{ formatBytes(row.memory_total) }}
          </template>
        </el-table-column>
        <el-table-column label="显存使用率" width="130">
          <template #default="{ row }">{{ formatNumber(row.memory_used_percent) }}%</template>
        </el-table-column>
        <el-table-column label="温度" width="100">
          <template #default="{ row }">{{ formatNumber(row.temperature) }}°C</template>
        </el-table-column>
        <el-table-column label="功耗" width="110">
          <template #default="{ row }">{{ formatNumber(row.power_watts) }} W</template>
        </el-table-column>
        <el-table-column prop="uuid" label="UUID" min-width="180" show-overflow-tooltip />
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss') }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { axios } from '@/utils/request'
import { getLatestMetrics, getOverview, getTopMetrics } from '@/api/metrics'
import type { Agent, ApiResponse, GPUDeviceMetrics, Overview } from '@/types'

type GPUDeviceRow = GPUDeviceMetrics & {
  host_id: string
  hostname: string
  timestamp: string
}

const loading = ref(false)
const selectedHost = ref('')
const agents = ref<Agent[]>([])
const devices = ref<GPUDeviceRow[]>([])
const overview = ref<Overview | null>(null)
const utilChartRef = ref<HTMLElement>()
const memoryChartRef = ref<HTMLElement>()
let utilChart: echarts.ECharts | null = null
let memoryChart: echarts.ECharts | null = null

const filteredDevices = computed(() => {
  if (!selectedHost.value) return devices.value
  return devices.value.filter((device) => device.host_id === selectedHost.value)
})

const summaryCards = computed(() => {
  const visible = filteredDevices.value
  const avgMem = visible.length
    ? visible.reduce((sum, device) => sum + (device.memory_used_percent || 0), 0) / visible.length
    : 0
  const maxTemp = visible.reduce((max, device) => Math.max(max, device.temperature || 0), 0)
  const hostCount = new Set(visible.map((device) => device.host_id)).size

  return [
    { label: 'GPU 主机', value: String(hostCount) },
    { label: 'GPU 设备', value: String(visible.length || overview.value?.gpu_devices || 0) },
    { label: '平均使用率', value: `${formatNumber(overview.value?.avg_gpu || 0)}%` },
    { label: '平均显存', value: `${formatNumber(avgMem)}%` },
    { label: '最高温度', value: `${formatNumber(maxTemp)}°C` }
  ]
})

async function loadAgents() {
  const res = await axios.get('/v1/agents', { params: { page: 1, page_size: 100 } }) as unknown as ApiResponse<{ agents: Agent[] }>
  agents.value = res.data?.agents || []
}

async function loadData() {
  loading.value = true
  try {
    const overviewRes = await getOverview() as unknown as ApiResponse<Overview>
    overview.value = overviewRes.data

    const rows: GPUDeviceRow[] = []
    const targets = selectedHost.value ? agents.value.filter((agent) => agent.host_id === selectedHost.value) : agents.value
    await Promise.all(targets.map(async (agent) => {
      try {
        const res = await getLatestMetrics(agent.host_id) as unknown as ApiResponse<any>
        const gpuDevices = res.data?.gpu?.devices || []
        for (const device of gpuDevices) {
          rows.push({
            ...device,
            host_id: agent.host_id,
            hostname: agent.hostname || agent.host_id,
            timestamp: res.data.timestamp
          })
        }
      } catch (error) {
        console.error(`Failed to load GPU metrics for ${agent.host_id}:`, error)
      }
    }))
    devices.value = rows.sort((a, b) => (b.utilization_percent || 0) - (a.utilization_percent || 0))
    await renderCharts()
  } catch (error: any) {
    ElMessage.error(`加载 GPU 数据失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

async function renderCharts() {
  await nextTick()
  const utilRes = await getTopMetrics({ type: 'gpu', limit: 10, order: 'desc' }) as unknown as ApiResponse<any[]>
  const utilTop = utilRes.data || []
  renderBar(utilChart, utilTop, '#409eff')

  const memoryTop = [...filteredDevices.value]
    .sort((a, b) => (b.memory_used_percent || 0) - (a.memory_used_percent || 0))
    .slice(0, 10)
    .map((device) => ({ hostname: device.hostname, device: device.name, value: device.memory_used_percent }))
  renderBar(memoryChart, memoryTop, '#67c23a')
}

function renderBar(chart: echarts.ECharts | null, data: any[], color: string) {
  if (!chart) return
  chart.setOption({
    grid: { left: 80, right: 32, top: 20, bottom: 28 },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    yAxis: {
      type: 'category',
      data: data.map((item) => item.device || item.hostname || item.host_id || 'GPU').reverse()
    },
    series: [{
      type: 'bar',
      data: data.map((item) => Number(item.value || 0).toFixed(1)).reverse(),
      itemStyle: { color },
      label: { show: true, position: 'right', formatter: '{c}%' }
    }]
  })
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(value || 0, 100))
}

function formatNumber(value: number) {
  return Number(value || 0).toFixed(1)
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return `${size.toFixed(1)} ${units[index]}`
}

onMounted(async () => {
  await nextTick()
  if (utilChartRef.value) utilChart = echarts.init(utilChartRef.value)
  if (memoryChartRef.value) memoryChart = echarts.init(memoryChartRef.value)
  window.addEventListener('resize', resizeCharts)
  await loadAgents()
  await loadData()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  utilChart?.dispose()
  memoryChart?.dispose()
})

function resizeCharts() {
  utilChart?.resize()
  memoryChart?.resize()
}
</script>

<style scoped>
.gpu-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(140px, 1fr));
  gap: 12px;
}

.summary-card {
  border-radius: 6px;
}

.summary-label {
  color: #606266;
  font-size: 13px;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chart {
  height: 320px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.host-select {
  width: 260px;
}

@media (max-width: 1200px) {
  .summary-grid,
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
