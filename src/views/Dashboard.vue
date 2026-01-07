<!-- ============================================ -->
<!-- 文件: src/views/Dashboard.vue -->
<!-- ============================================ -->
<template>
  <div class="dashboard-container">
    <!-- 头部 -->
    <div class="header">
      <div class="header-left">
        <el-icon :size="24" color="#409EFF"><Monitor /></el-icon>
        <h1>服务器监控系统</h1>
      </div>
      <div class="header-right">
        <el-tag>{{ currentTime }}</el-tag>
        <el-button type="primary" :icon="Refresh" @click="refreshData" circle />
      </div>
    </div>

    <!-- 概览卡片 -->
    <el-row :gutter="20" class="overview-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="card-content">
            <el-icon class="card-icon" color="#409EFF"><Server /></el-icon>
            <div class="card-info">
              <div class="card-value">{{ overview.total_agents }}</div>
              <div class="card-label">总主机数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="card-content">
            <el-icon class="card-icon" color="#67C23A"><CircleCheck /></el-icon>
            <div class="card-info">
              <div class="card-value">{{ overview.online_agents }}</div>
              <div class="card-label">在线主机</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="card-content">
            <el-icon class="card-icon" color="#E6A23C"><Cpu /></el-icon>
            <div class="card-info">
              <div class="card-value">{{ (overview.avg_cpu || 0).toFixed(1) }}%</div>
              <div class="card-label">平均CPU</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="card-content">
            <el-icon class="card-icon" color="#F56C6C"><Memo /></el-icon>
            <div class="card-info">
              <div class="card-value">{{ (overview.avg_memory || 0).toFixed(1) }}%</div>
              <div class="card-label">平均内存</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>CPU使用率 Top 10</span>
              <el-button type="primary" text @click="refreshTopCPU">刷新</el-button>
            </div>
          </template>
          <CPUTopChart :data="topCPU" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>内存使用率 Top 10</span>
              <el-button type="primary" text @click="refreshTopMemory">刷新</el-button>
            </div>
          </template>
          <MemoryTopChart :data="topMemory" />
        </el-card>
      </el-col>
    </el-row>

    <!-- Agent列表 -->
    <el-card shadow="hover" class="agent-list">
      <template #header>
        <div class="card-header">
          <span>在线主机列表</span>
          <el-button type="primary" @click="$router.push('/agents')">
            查看全部
            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
        </div>
      </template>
      <AgentTable :agents="onlineAgents" :loading="loading" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Monitor, CircleCheck, Cpu, Memo, Refresh, ArrowRight } from '@element-plus/icons-vue'
import { Grid as Server } from '@element-plus/icons-vue'
import { getOverview, getTopMetrics } from '@/api/metrics'
import { getAgents } from '@/api/agent'
import type { Agent, ApiResponse, Overview, PaginatedResponse } from '@/types'
import CPUTopChart from '@/components/CPUTopChart.vue'
import MemoryTopChart from '@/components/MemoryTopChart.vue'
import AgentTable from '@/components/AgentTable.vue'
import dayjs from 'dayjs'

const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const loading = ref(false)
const overview = ref({
  total_agents: 0,
  online_agents: 0,
  offline_agents: 0,
  avg_cpu: 0,
  avg_memory: 0,
  total_metrics: 0
})
const topCPU = ref<any[]>([])
const topMemory = ref<any[]>([])
const onlineAgents = ref<Agent[]>([])

let timer: any = null

// 获取概览数据
const fetchOverview = async () => {
  try {
    const res = await getOverview() as unknown as ApiResponse<Overview>
    console.log('Overview API response:', res)
    if (res && res.data) {
      overview.value = {
        total_agents: res.data.total_agents || 0,
        online_agents: res.data.online_agents || 0,
        offline_agents: res.data.offline_agents || 0,
        avg_cpu: res.data.avg_cpu || 0,
        avg_memory: res.data.avg_memory || 0,
        total_metrics: res.data.total_metrics || 0
      }
      console.log('Updated overview:', overview.value)
    } else {
      console.warn('No overview data in response')
    }
  } catch (error) {
    console.error('Failed to fetch overview:', error)
    ElMessage.error('获取概览数据失败')
  }
}

// 获取Top CPU
const refreshTopCPU = async () => {
  try {
    const res = await getTopMetrics({ type: 'cpu', limit: 10, order: 'desc' }) as unknown as ApiResponse<any[]>
    topCPU.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch top CPU:', error)
    topCPU.value = []
  }
}

// 获取Top内存
const refreshTopMemory = async () => {
  try {
    const res = await getTopMetrics({ type: 'memory', limit: 10, order: 'desc' }) as unknown as ApiResponse<any[]>
    topMemory.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch top memory:', error)
    topMemory.value = []
  }
}

// 获取在线Agent列表
const fetchOnlineAgents = async () => {
  try {
    loading.value = true
    const res = await getAgents({ status: 'online', page: 1, page_size: 10 }) as unknown as ApiResponse<PaginatedResponse<Agent>>
    onlineAgents.value = res.data?.agents || []
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    onlineAgents.value = []
  } finally {
    loading.value = false
  }
}

// 刷新所有数据
const refreshData = async () => {
  ElMessage.success('刷新中...')
  await Promise.all([
    fetchOverview(),
    refreshTopCPU(),
    refreshTopMemory(),
    fetchOnlineAgents()
  ])
}

// 更新时间
const updateTime = () => {
  currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  refreshData()
  
  // 每30秒自动刷新
  timer = setInterval(() => {
    refreshData()
  }, 30000)
  
  // 每秒更新时间
  setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.overview-cards {
  margin-bottom: 20px;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  font-size: 48px;
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.card-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.charts {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-list {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    gap: 12px;
  }
  
  .card-value {
    font-size: 24px;
  }
}
</style>



