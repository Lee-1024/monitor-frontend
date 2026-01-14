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
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="metric-card metric-card-cpu">
            <div class="metric-header">
              <div class="metric-icon-wrapper cpu-icon">
                <el-icon :size="28"><CpuIcon /></el-icon>
              </div>
              <span class="metric-title">CPU</span>
            </div>
            <div class="metric-value-wrapper">
              <div class="metric-value">{{ (latestMetrics.cpu?.usage_percent ?? 0).toFixed(1) }}%</div>
              <el-progress 
                :percentage="Math.min(latestMetrics.cpu?.usage_percent || 0, 100)"
                :color="getCpuColor(latestMetrics.cpu?.usage_percent || 0)"
                :stroke-width="8"
                :show-text="false"
                class="metric-progress"
              />
            </div>
            <div class="metric-details">
              <div class="detail-item">
                <span class="detail-label">负载（1分钟）</span>
                <span class="detail-value">{{ (latestMetrics.cpu?.load_avg_1 ?? 0).toFixed(2) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">负载（5分钟）</span>
                <span class="detail-value">{{ (latestMetrics.cpu?.load_avg_5 ?? 0).toFixed(2) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">核心数</span>
                <span class="detail-value">{{ latestMetrics.cpu?.core_count || 0 }}</span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="metric-card metric-card-memory">
            <div class="metric-header">
              <div class="metric-icon-wrapper memory-icon">
                <el-icon :size="28"><MemoryIcon /></el-icon>
              </div>
              <span class="metric-title">内存</span>
            </div>
            <div class="metric-value-wrapper">
              <div class="metric-value">{{ (latestMetrics.memory?.used_percent ?? 0).toFixed(1) }}%</div>
              <el-progress 
                :percentage="Math.min(latestMetrics.memory?.used_percent || 0, 100)"
                :color="getMemoryColor(latestMetrics.memory?.used_percent || 0)"
                :stroke-width="8"
                :show-text="false"
                class="metric-progress"
              />
            </div>
            <div class="metric-details">
              <div class="detail-item">
                <span class="detail-label">总计</span>
                <span class="detail-value">{{ formatBytes(latestMetrics.memory?.total) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">已用</span>
                <span class="detail-value highlight-used">{{ formatBytes(latestMetrics.memory?.used) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">可用</span>
                <span class="detail-value highlight-available">{{ formatBytes(latestMetrics.memory?.available) }}</span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="metric-card metric-card-network">
            <div class="metric-header">
              <div class="metric-icon-wrapper network-icon">
                <el-icon :size="28"><NetworkIcon /></el-icon>
              </div>
              <span class="metric-title">网络</span>
            </div>
            <div class="metric-value-wrapper">
              <div class="metric-value-small">{{ formatBytes(latestMetrics.network?.bytes_recv || 0) }}</div>
            </div>
            <div class="metric-details">
              <div class="detail-item">
                <span class="detail-label">发送</span>
                <span class="detail-value">{{ formatBytes(latestMetrics.network?.bytes_sent || 0) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">接收</span>
                <span class="detail-value">{{ formatBytes(latestMetrics.network?.bytes_recv || 0) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">错误</span>
                <span class="detail-value">{{ (latestMetrics.network?.errin || 0) + (latestMetrics.network?.errout || 0) }}</span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="metric-card metric-card-disk-summary">
            <div class="metric-header">
              <div class="metric-icon-wrapper disk-icon">
                <el-icon :size="28"><DiskIcon /></el-icon>
              </div>
              <span class="metric-title">磁盘概览</span>
            </div>
            <div class="metric-value-wrapper" v-if="diskPartitions.length > 0">
              <div class="metric-value-small">
                {{ diskPartitions.length }} 个分区
              </div>
              <div class="disk-summary-info">
                <div class="summary-item" v-for="part in diskPartitions.slice(0, 2)" :key="part.mountpoint || part._mountpoint">
                  <span class="summary-mountpoint">{{ part.mountpoint || part._mountpoint || '未知' }}</span>
                  <el-progress 
                    :percentage="Math.min(part.used_percent || 0, 100)"
                    :color="getDiskColor(part.used_percent || 0)"
                    :stroke-width="4"
                    :show-text="false"
                    class="summary-progress"
                  />
                  <span class="summary-percent">{{ (part.used_percent || 0).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
            <div v-else class="no-data-small">
              <span>暂无数据</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :xs="24">
          <el-card shadow="hover" v-loading="metricsLoading">
            <template #header>
              <div class="card-header">
                <div class="chart-title">
                  <el-icon color="#E6A23C" :size="20" style="margin-right: 8px"><DiskIcon /></el-icon>
                  <span>磁盘使用情况</span>
                </div>
              </div>
            </template>
            
            <div v-if="diskPartitions.length > 0">
              <el-table :data="diskPartitions" stripe style="width: 100%" size="default">
                <el-table-column prop="mountpoint" label="挂载点" width="200" fixed="left">
                  <template #default="{ row }">
                    <div style="display: flex; align-items: center; gap: 8px">
                      <el-icon color="#E6A23C"><Folder /></el-icon>
                      <strong style="color: #303133">{{ row.mountpoint || row._mountpoint || '未知' }}</strong>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="device" label="设备" width="150" />
                <el-table-column prop="fstype" label="文件系统" width="120" />
                <el-table-column label="使用率" width="250">
                  <template #default="{ row }">
                    <div style="display: flex; align-items: center; gap: 12px">
                      <el-progress 
                        :percentage="Math.min(row.used_percent || 0, 100)"
                        :color="getDiskColor(row.used_percent || 0)"
                        :stroke-width="10"
                        :show-text="false"
                        style="flex: 1"
                      />
                      <el-tag 
                        :type="getDiskTagType(row.used_percent || 0)" 
                        size="default"
                        style="min-width: 60px; text-align: center; font-weight: 600"
                      >
                        {{ (row.used_percent || 0).toFixed(1) }}%
                      </el-tag>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="已用/总计" width="220">
                  <template #default="{ row }">
                    <div style="display: flex; align-items: center; gap: 4px">
                      <span style="color: #F56C6C; font-weight: 600">{{ formatBytes(row.used) }}</span>
                      <span style="color: #909399">/</span>
                      <span style="color: #606266">{{ formatBytes(row.total) }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="可用" width="150">
                  <template #default="{ row }">
                    <span style="color: #67C23A; font-weight: 500">{{ formatBytes(row.free) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            
            <div v-else class="no-data">
              <el-empty description="暂无磁盘数据" :image-size="80" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 历史趋势图 - 两两一排布局 -->
    <!-- 第一行：CPU 和 内存 -->
    <el-row :gutter="20" style="margin-top: 24px">
      <!-- CPU使用率趋势 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <div class="chart-title">
                <el-icon color="#409EFF" :size="20" style="margin-right: 8px"><CpuIcon /></el-icon>
                <span>CPU使用率趋势</span>
              </div>
              <el-select v-model="timeRange" @change="fetchHistory" size="small" style="width: 120px">
                <el-option label="1小时" value="-1h" />
                <el-option label="6小时" value="-6h" />
                <el-option label="24小时" value="-24h" />
                <el-option label="7天" value="-7d" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <CPUHistoryChart :data="cpuHistory" :loading="historyLoading" />
          </div>
        </el-card>
      </el-col>
      
      <!-- 内存使用率趋势 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <div class="chart-title">
                <el-icon color="#F56C6C" :size="20" style="margin-right: 8px"><MemoryIcon /></el-icon>
                <span>内存使用率趋势</span>
              </div>
              <el-select v-model="timeRange" @change="fetchHistory" size="small" style="width: 120px">
                <el-option label="1小时" value="-1h" />
                <el-option label="6小时" value="-6h" />
                <el-option label="24小时" value="-24h" />
                <el-option label="7天" value="-7d" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <MemoryHistoryChart :data="memoryHistory" :loading="historyLoading" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行：磁盘 和 网络 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 磁盘使用趋势 - 所有挂载点在一个图表中 -->
      <el-col :xs="24" :lg="12" v-if="diskPartitions.length > 0">
        <el-card shadow="hover" class="chart-card disk-chart-card">
          <template #header>
            <div class="card-header">
              <div class="chart-title">
                <el-icon color="#E6A23C" :size="20" style="margin-right: 8px"><DiskIcon /></el-icon>
                <span class="chart-title-text">磁盘使用趋势</span>
                <el-tag size="small" style="margin-left: 8px" type="info">
                  {{ diskPartitions.length }} 个挂载点
                </el-tag>
              </div>
              <el-select 
                v-model="timeRange" 
                @change="fetchAllDiskHistory" 
                size="small" 
                style="width: 120px"
              >
                <el-option label="1小时" value="-1h" />
                <el-option label="6小时" value="-6h" />
                <el-option label="24小时" value="-24h" />
                <el-option label="7天" value="-7d" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <DiskHistoryChart 
              :data="allDiskHistory" 
              :loading="historyLoading"
              :mountpoints="diskPartitions.map(p => p.mountpoint || p._mountpoint)"
            />
          </div>
        </el-card>
      </el-col>
      
      <!-- 网络流量趋势 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <div class="chart-title">
                <el-icon color="#67C23A" :size="20" style="margin-right: 8px"><NetworkIcon /></el-icon>
                <span>网络流量趋势</span>
              </div>
              <el-select v-model="timeRange" @change="fetchHistory" size="small" style="width: 120px">
                <el-option label="1小时" value="-1h" />
                <el-option label="6小时" value="-6h" />
                <el-option label="24小时" value="-24h" />
                <el-option label="7天" value="-7d" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <NetworkHistoryChart :data="networkHistory" :loading="historyLoading" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh, Folder } from '@element-plus/icons-vue'
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
const networkHistory = ref<MetricPoint[]>([])
const timeRange = ref('-1h')
const diskPartitions = ref<any[]>([])
const diskHistoryMap = ref<Record<string, MetricPoint[]>>({})
const allDiskHistory = ref<Array<{ timestamp: string; values: Record<string, number> }>>([])

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
    
    // 如果分区数据已更新，获取历史数据
    if (diskPartitions.value.length > 0) {
      await fetchAllDiskHistory()
    }
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
    return
  }
  
  // 新格式：disk.partitions 数组
  if (Array.isArray(disk.partitions)) {
    diskPartitions.value = disk.partitions
    return
  }
  
  // 兼容旧格式：单个分区对象或 _partitions 数组
  const partitions: any[] = []
  
  // 主分区（旧格式）
  if (disk.mountpoint || disk._mountpoint || disk.total) {
    partitions.push({
      mountpoint: disk.mountpoint || disk._mountpoint || '/',
      device: disk.device,
      fstype: disk.fstype,
      total: disk.total,
      used: disk.used,
      free: disk.free,
      used_percent: disk.used_percent,
    })
  }
  
  // 其他分区（旧格式）
  if (Array.isArray(disk._partitions)) {
    disk._partitions.forEach((part: any) => {
      if (part.mountpoint || part._mountpoint) {
        partitions.push({
          mountpoint: part.mountpoint || part._mountpoint,
          device: part.device,
          fstype: part.fstype,
          total: part.total,
          used: part.used,
          free: part.free,
          used_percent: part.used_percent,
        })
      }
    })
  }
  
  diskPartitions.value = partitions
}

const fetchHistory = async () => {
  try {
    historyLoading.value = true

    const [cpuRes, memRes, netRes] = await Promise.all([
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
        type: 'network',
        start: timeRange.value,
        interval: '1m'
      })
    ]) as unknown as [
      ApiResponse<MetricPoint[]>,
      ApiResponse<MetricPoint[]>,
      ApiResponse<MetricPoint[]>
    ]

    cpuHistory.value = cpuRes.data || []
    memoryHistory.value = memRes.data || []
    networkHistory.value = netRes.data || []
    
    // 为每个磁盘分区获取历史数据（合并显示）
    await fetchAllDiskHistory()
  } catch (error) {
    console.error('Failed to fetch history:', error)
    ElMessage.error('获取历史数据失败')
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

// 获取CPU使用率颜色
const getCpuColor = (percent: number) => {
  if (!percent) return '#67c23a'
  if (percent >= 90) return '#f56c6c'
  if (percent >= 75) return '#e6a23c'
  if (percent >= 50) return '#409EFF'
  return '#67c23a'
}

// 获取内存使用率颜色
const getMemoryColor = (percent: number) => {
  if (!percent) return '#67c23a'
  if (percent >= 90) return '#f56c6c'
  if (percent >= 75) return '#e6a23c'
  if (percent >= 50) return '#409EFF'
  return '#67c23a'
}

// 获取磁盘使用率颜色
const getDiskColor = (percent: number) => {
  if (!percent) return '#67c23a'
  if (percent >= 90) return '#f56c6c'  // 红色：危险
  if (percent >= 75) return '#e6a23c'  // 橙色：警告
  if (percent >= 50) return '#409EFF'  // 蓝色：注意
  return '#67c23a'  // 绿色：正常
}

// 获取磁盘标签类型
const getDiskTagType = (percent: number) => {
  if (percent >= 90) return 'danger'
  if (percent >= 75) return 'warning'
  return 'success'
}

// 获取所有磁盘分区的历史数据并合并
const fetchAllDiskHistory = async () => {
  if (diskPartitions.value.length === 0) {
    allDiskHistory.value = []
    return
  }
  
  try {
    historyLoading.value = true
    
    // 获取所有挂载点的历史数据
    const promises = diskPartitions.value.map(async (part) => {
      const mountpoint = part.mountpoint || part._mountpoint
      if (!mountpoint) return null
      
      try {
        const res = await getHistoryMetrics({
          host_id: hostId,
          type: 'disk',
          start: timeRange.value,
          interval: '1m',
          mountpoint: mountpoint
        })
        diskHistoryMap.value[mountpoint] = res.data || []
        return { mountpoint, data: res.data || [] }
      } catch (error) {
        console.error(`Failed to fetch disk history for ${mountpoint}:`, error)
        diskHistoryMap.value[mountpoint] = []
        return { mountpoint, data: [] }
      }
    })
    
    const results = await Promise.all(promises)
    const validResults = results.filter(r => r !== null) as Array<{ mountpoint: string; data: MetricPoint[] }>
    
    // 合并所有挂载点的数据
    const timeMap = new Map<string, Record<string, number>>()
    
    validResults.forEach(({ mountpoint, data }) => {
      data.forEach((point: MetricPoint) => {
        const timestamp = point.timestamp
        if (!timeMap.has(timestamp)) {
          timeMap.set(timestamp, {})
        }
        const values = timeMap.get(timestamp)!
        // 为每个挂载点存储使用率
        values[`${mountpoint}_used_percent`] = point.values.used_percent || 0
        values[`${mountpoint}_used`] = point.values.used || 0
        values[`${mountpoint}_total`] = point.values.total || 0
      })
    })
    
    // 转换为数组格式并按时间排序
    allDiskHistory.value = Array.from(timeMap.entries())
      .map(([timestamp, values]) => ({ timestamp, values }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    
  } catch (error) {
    console.error('Failed to fetch all disk history:', error)
    ElMessage.error('获取磁盘历史数据失败')
    allDiskHistory.value = []
  } finally {
    historyLoading.value = false
  }
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
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.metric-card:hover::before {
  opacity: 1;
}

.metric-card-cpu::before {
  background: linear-gradient(90deg, #409EFF, #66B1FF);
}

.metric-card-memory::before {
  background: linear-gradient(90deg, #F56C6C, #F78989);
}

.metric-card-network::before {
  background: linear-gradient(90deg, #67C23A, #85CE61);
}

.metric-card-disk-summary::before {
  background: linear-gradient(90deg, #E6A23C, #EEBE77);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.metric-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.05));
  transition: all 0.3s ease;
}

.metric-card:hover .metric-icon-wrapper {
  transform: scale(1.1) rotate(5deg);
}

.cpu-icon {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15), rgba(64, 158, 255, 0.05));
  color: #409EFF;
}

.memory-icon {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.15), rgba(245, 108, 108, 0.05));
  color: #F56C6C;
}

.network-icon {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.15), rgba(103, 194, 58, 0.05));
  color: #67C23A;
}

.disk-icon {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.15), rgba(230, 162, 60, 0.05));
  color: #E6A23C;
}

.metric-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.metric-value-wrapper {
  margin: 20px 0;
}

.metric-value {
  font-size: 42px;
  font-weight: 700;
  color: #303133;
  text-align: center;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #303133, #606266);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.metric-value-small {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  text-align: center;
  margin-bottom: 16px;
}

.metric-progress {
  margin-top: 8px;
}

.metric-details {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: #909399;
  font-size: 13px;
}

.detail-value {
  color: #303133;
  font-weight: 600;
  font-size: 14px;
}

.highlight-used {
  color: #E6A23C;
}

.highlight-available {
  color: #67C23A;
}

.disk-summary-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-mountpoint {
  font-size: 12px;
  color: #606266;
  min-width: 40px;
  font-weight: 500;
}

.summary-progress {
  flex: 1;
}

.summary-percent {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  min-width: 40px;
  text-align: right;
}

.no-data-small {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 20px 0;
}

.disk-detail-card {
  padding: 24px;
}

/* 磁盘分区列表样式 */
.disk-partitions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.partition-card {
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.partition-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #E6A23C, #EEBE77);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.partition-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #E6A23C;
}

.partition-card:hover::before {
  opacity: 1;
}

.partition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.mountpoint-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.mountpoint-icon {
  font-size: 20px;
  color: #E6A23C;
}

.mountpoint-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mountpoint-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.mountpoint-device {
  font-size: 12px;
  color: #909399;
}

.usage-tag {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 16px;
}

.progress-wrapper {
  margin: 16px 0;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.partition-progress {
  width: 100%;
}

.partition-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.partition-details .detail-item {
  border-bottom: none;
  padding: 0;
}

.no-data {
  padding: 60px 0;
  text-align: center;
}

.chart-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.chart-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  padding: 8px 0;
  min-height: 350px;
}

/* 图表卡片布局优化 */
.chart-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-card .el-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chart-card .chart-container {
  flex: 1;
  min-height: 350px;
}

.disk-chart-card {
  transition: all 0.3s ease;
}

.disk-chart-card:hover {
  transform: translateY(-2px);
}

.chart-title-text {
  margin-right: 8px;
}

@media (max-width: 768px) {
  .agent-detail-container {
    padding: 10px;
  }
  
  .partition-details {
    grid-template-columns: 1fr;
  }
  
  .metric-card {
    margin-bottom: 16px;
  }
  
  .metric-value {
    font-size: 36px;
  }
  
  .metric-value-small {
    font-size: 18px;
  }
}
</style>