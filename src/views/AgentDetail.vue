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
              <el-icon color="#409EFF" :size="24"><Cpu /></el-icon>
              <span>CPU</span>
            </div>
            <div class="metric-value">{{ latestMetrics.cpu?.usage_percent?.toFixed(1) || 0 }}%</div>
            <el-divider />
            <div class="metric-details">
              <div class="detail-item">
                <span>负载（1分钟）</span>
                <span>{{ latestMetrics.cpu?.load_avg_1?.toFixed(2) || 0 }}</span>
              </div>
              <div class="detail-item">
                <span>负载（5分钟）</span>
                <span>{{ latestMetrics.cpu?.load_avg_5?.toFixed(2) || 0 }}</span>
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
              <el-icon color="#F56C6C" :size="24"><Memo /></el-icon>
              <span>内存</span>
            </div>
            <div class="metric-value">{{ latestMetrics.memory?.used_percent?.toFixed(1) || 0 }}%</div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh, Cpu, Memo } from '@element-plus/icons-vue'
import { getAgent } from '@/api/agent'
import { getLatestMetrics, getHistoryMetrics } from '@/api/metrics'
import type { Agent, ApiResponse, MetricPoint } from '@/types'
import CPUHistoryChart from '@/components/CPUHistoryChart.vue'
import MemoryHistoryChart from '@/components/MemoryHistoryChart.vue'
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
const timeRange = ref('-1h')

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
  } catch (error) {
    console.error('Failed to fetch latest metrics:', error)
  } finally {
    metricsLoading.value = false
  }
}

const fetchHistory = async () => {
  try {
    historyLoading.value = true
    
    const [cpuRes, memRes] = await Promise.all([
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
      })
    ]) as unknown as [ApiResponse<MetricPoint[]>, ApiResponse<MetricPoint[]>]
    
    cpuHistory.value = cpuRes.data || []
    memoryHistory.value = memRes.data || []
  } catch (error) {
    console.error('Failed to fetch history:', error)
  } finally {
    historyLoading.value = false
  }
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
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