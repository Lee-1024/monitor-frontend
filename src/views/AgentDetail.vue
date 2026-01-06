<!-- ============================================ -->
<!-- 文件: src/views/AgentDetail.vue -->
<!-- ============================================ -->
<template>
  <div class="agent-detail-container">
    <el-button @click="$router.back()" style="margin-bottom: 20px">
      <el-icon><ArrowLeft /></el-icon>
      返回
    </el-button>

    <!-- 基本信息 -->
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
          {{ dayjs(agent.last_seen).format('YYYY-MM-DD HH:mm:ss') }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 实时指标 -->
    <el-card shadow="hover" style="margin-top: 20px" v-loading="metricsLoading">
      <template #header>
        <div class="card-header">
          <span>实时指标</span>
          <el-button type="primary" :icon="Refresh" @click="fetchLatestMetrics">刷新</el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12">
          <div class="metric-card">
            <div class="metric-header">
              <el-icon color="#409EFF" :size="24"><CpuIcon /></el-icon>
              <span>CPU</span>
            </div>
            <div class="metric-value">{{ (latestMetrics.cpu?.usage_percent ?? 0).toFixed(1) }}%</div>
            <el-divider />
            <div class="metric-details">
              <div class="detail-item">
                <span>负载（1分钟）</span>
                <span>{{ (latestMetrics.cpu?.load_avg_1 ?? 0).toFixed(2) }}</span>
              </div>
              <div class="detail-item">
                <span>负载（5分钟）</span>
                <span>{{ (latestMetrics.cpu?.load_avg_5 ?? 0).toFixed(2) }}</span>
              </div>
              <div class="detail-item">
                <span>核心数</span>
                <span>{{ latestMetrics.cpu?.core_count || 0 }}</span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12">
          <div class="metric-card">
            <div class="metric-header">
              <el-icon color="#F56C6C" :size="24"><MemoryIcon /></el-icon>
              <span>内存</span>
            </div>
            <div class="metric-value">{{ (latestMetrics.memory?.used_percent ?? 0).toFixed(1) }}%</div>
            <el-divider />
            <div class="metric-details">
              <div class="detail-item">
                <span>总计</span>
                <span>{{ formatBytes(latestMetrics.memory?.total) }}</span>
              </div>
              <div class="detail-item">
                <span>已用</span>
                <span>{{ formatBytes(latestMetrics.memory?.used) }}</span>
              </div>
              <div class="detail-item">
                <span>可用</span>
                <span>{{ formatBytes(latestMetrics.memory?.available) }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :xs="24" :sm="12">
          <div class="metric-card">
            <div class="metric-header">
              <el-icon color="#E6A23C" :size="24"><DiskIcon /></el-icon>
              <span>磁盘</span>
              <el-select 
                v-if="diskPartitions.length > 1" 
                v-model="selectedDiskPartition" 
                size="small" 
                style="width: 150px; margin-left: 10px"
                @change="updateDiskDisplay"
              >
                <el-option
                  v-for="part in diskPartitions"
                  :key="part.mountpoint"
                  :label="part.mountpoint || '未知'"
                  :value="part.mountpoint"
                />
              </el-select>
            </div>
            <div class="metric-value">
              {{ getDiskUsedPercent() }}%
            </div>
            <el-divider />
            <div class="metric-details">
              <div class="detail-item">
                <span>挂载点</span>
                <span>{{ currentDiskData?._mountpoint || '/' }}</span>
              </div>
              <div class="detail-item">
                <span>总计</span>
                <span>{{ formatBytes(currentDiskData?.total) }}</span>
              </div>
              <div class="detail-item">
                <span>已用</span>
                <span>{{ formatBytes(currentDiskData?.used) }}</span>
              </div>
              <div class="detail-item">
                <span>可用</span>
                <span>{{ formatBytes(currentDiskData?.free) }}</span>
              </div>
              <div v-if="diskPartitions.length > 1" class="detail-item" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ebeef5;">
                <span style="font-size: 12px; color: #909399;">其他分区 ({{ diskPartitions.length - 1 }})</span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12">
          <div class="metric-card">
            <div class="metric-header">
              <el-icon color="#409EFF" :size="24"><NetworkIcon /></el-icon>
              <span>网络</span>
            </div>
            <div class="metric-value">
              {{ formatBytes(latestMetrics.network?.bytes_recv || 0) }}
            </div>
            <el-divider />
            <div class="metric-details">
              <div class="detail-item">
                <span>发送</span>
                <span>{{ formatBytes(latestMetrics.network?.bytes_sent || 0) }}</span>
              </div>
              <div class="detail-item">
                <span>接收</span>
                <span>{{ formatBytes(latestMetrics.network?.bytes_recv || 0) }}</span>
              </div>
              <div class="detail-item">
                <span>错误</span>
                <span>{{ (latestMetrics.network?.errin || 0) + (latestMetrics.network?.errout || 0) }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 历史趋势图 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>CPU使用率趋势</span>
              <el-select v-model="timeRange" @change="fetchHistory" style="width: 120px">
                <el-option label="1小时" value="-1h" />
                <el-option label="6小时" value="-6h" />
                <el-option label="24小时" value="-24h" />
                <el-option label="7天" value="-7d" />
              </el-select>
            </div>
          </template>
          <CPUHistoryChart :data="cpuHistory" :loading="historyLoading" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>内存使用率趋势</span>
              <el-select v-model="timeRange" @change="fetchHistory" style="width: 120px">
                <el-option label="1小时" value="-1h" />
                <el-option label="6小时" value="-6h" />
                <el-option label="24小时" value="-24h" />
                <el-option label="7天" value="-7d" />
              </el-select>
            </div>
          </template>
          <MemoryHistoryChart :data="memoryHistory" :loading="historyLoading" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>磁盘使用趋势</span>
              <el-select v-model="timeRange" @change="fetchHistory" style="width: 120px">
                <el-option label="1小时" value="-1h" />
                <el-option label="6小时" value="-6h" />
                <el-option label="24小时" value="-24h" />
                <el-option label="7天" value="-7d" />
              </el-select>
            </div>
          </template>
          <DiskHistoryChart :data="diskHistory" :loading="historyLoading" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>网络流量趋势</span>
              <el-select v-model="timeRange" @change="fetchHistory" style="width: 120px">
                <el-option label="1小时" value="-1h" />
                <el-option label="6小时" value="-6h" />
                <el-option label="24小时" value="-24h" />
                <el-option label="7天" value="-7d" />
              </el-select>
            </div>
          </template>
          <NetworkHistoryChart :data="networkHistory" :loading="historyLoading" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import CpuIcon from '@/icons/CpuIcon.vue'
import MemoryIcon from '@/icons/MemoryIcon.vue'
import DiskIcon from '@/icons/DiskIcon.vue'
import NetworkIcon from '@/icons/NetworkIcon.vue'
import { getAgent } from '@/api/agent'
import { getLatestMetrics, getHistoryMetrics } from '@/api/metrics'
import type { Agent, ApiResponse, MetricPoint } from '@/types'
import CPUHistoryChart from '@/components/CPUHistoryChart.vue'
import MemoryHistoryChart from '@/components/MemoryHistoryChart.vue'
import DiskHistoryChart from '@/components/DiskHistoryChart.vue'
import NetworkHistoryChart from '@/components/NetworkHistoryChart.vue'
import dayjs from 'dayjs'

const route = useRoute()
const hostId = route.params.id as string

const loading = ref(false)
const metricsLoading = ref(false)
const historyLoading = ref(false)
const agent = ref<Partial<Agent>>({})
const latestMetrics = ref<any>({})
const cpuHistory = ref<MetricPoint[]>([])
const memoryHistory = ref<MetricPoint[]>([])
const diskHistory = ref<MetricPoint[]>([])
const networkHistory = ref<MetricPoint[]>([])
const timeRange = ref('-1h')
const selectedDiskPartition = ref<string>('')
const diskPartitions = ref<any[]>([])
const currentDiskData = ref<any>(null)

let timer: any = null

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

const fetchLatestMetrics = async () => {
  try {
    metricsLoading.value = true
    const res = await getLatestMetrics(hostId) as unknown as ApiResponse<any>
    latestMetrics.value = res.data || {}
    
    // 处理磁盘分区数据
    updateDiskPartitions()
  } catch (error) {
    console.error('Failed to fetch latest metrics:', error)
  } finally {
    metricsLoading.value = false
  }
}

const updateDiskPartitions = () => {
  const disk = latestMetrics.value.disk
  if (!disk || typeof disk !== 'object') {
    diskPartitions.value = []
    currentDiskData.value = null
    return
  }
  
  // 构建分区列表
  const partitions: any[] = []
  
  // 主分区
  if (disk._mountpoint || disk.total) {
    partitions.push({
      mountpoint: disk._mountpoint || '/',
      total: disk.total,
      used: disk.used,
      free: disk.free,
      used_percent: disk.used_percent,
      ...disk
    })
  }
  
  // 其他分区
  if (Array.isArray(disk._partitions)) {
    disk._partitions.forEach((part: any) => {
      if (part._mountpoint) {
        partitions.push({
          mountpoint: part._mountpoint,
          total: part.total,
          used: part.used,
          free: part.free,
          used_percent: part.used_percent,
          ...part
        })
      }
    })
  }
  
  diskPartitions.value = partitions
  
  // 设置当前选中的分区
  if (partitions.length > 0) {
    if (!selectedDiskPartition.value || !partitions.find(p => p.mountpoint === selectedDiskPartition.value)) {
      selectedDiskPartition.value = partitions[0].mountpoint
    }
    updateDiskDisplay()
  } else {
    currentDiskData.value = null
  }
}

const updateDiskDisplay = () => {
  const partition = diskPartitions.value.find(p => p.mountpoint === selectedDiskPartition.value)
  if (partition) {
    currentDiskData.value = partition
  } else {
    currentDiskData.value = latestMetrics.value.disk || null
  }
}

const fetchHistory = async () => {
  try {
    historyLoading.value = true

    const [cpuRes, memRes, diskRes, netRes] = await Promise.all([
      getHistoryMetrics({
        host_id: hostId,
        type: 'cpu',
        start: timeRange.value,
        interval: '1m'
      }),
      getHistoryMetrics({
        host_id: hostId,
        type: 'memory',
        start: timeRange.value,
        interval: '1m'
      }),
      getHistoryMetrics({
        host_id: hostId,
        type: 'disk',
        start: timeRange.value,
        interval: '1m'
      }),
      getHistoryMetrics({
        host_id: hostId,
        type: 'network',
        start: timeRange.value,
        interval: '1m'
      })
    ]) as unknown as [
      ApiResponse<MetricPoint[]>,
      ApiResponse<MetricPoint[]>,
      ApiResponse<MetricPoint[]>,
      ApiResponse<MetricPoint[]>
    ]

    cpuHistory.value = cpuRes.data || []
    memoryHistory.value = memRes.data || []
    diskHistory.value = diskRes.data || []
    networkHistory.value = netRes.data || []
  } catch (error) {
    console.error('Failed to fetch history:', error)
  } finally {
    historyLoading.value = false
  }
}

const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const sizeIndex = Math.min(i, sizes.length - 1)
  const value = bytes / Math.pow(k, sizeIndex)
  return Math.round(value * 100) / 100 + ' ' + sizes[sizeIndex]
}

const getDiskUsedPercent = () => {
  const disk = currentDiskData.value || latestMetrics.value.disk
  if (!disk || typeof disk !== 'object') return '0.0'
  const usedPercent = disk.used_percent
  if (typeof usedPercent === 'number') {
    return usedPercent.toFixed(1)
  }
  // 如果没有 used_percent，尝试计算
  const total = typeof disk.total === 'number' ? disk.total : 0
  const used = typeof disk.used === 'number' ? disk.used : 0
  if (total > 0) {
    return ((used / total) * 100).toFixed(1)
  }
  return '0.0'
}

onMounted(() => {
  fetchAgent()
  fetchLatestMetrics()
  fetchHistory()
  
  // 每10秒自动刷新实时指标
  timer = setInterval(() => {
    fetchLatestMetrics()
  }, 10000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.agent-detail-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-card {
  padding: 20px;
  background: #f9fafc;
  border-radius: 8px;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.metric-value {
  font-size: 48px;
  font-weight: 600;
  color: #303133;
  text-align: center;
  margin: 20px 0;
}

.metric-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.detail-item span:first-child {
  color: #909399;
}

.detail-item span:last-child {
  color: #303133;
  font-weight: 500;
}

@media (max-width: 768px) {
  .agent-detail-container {
    padding: 10px;
  }
}
</style>