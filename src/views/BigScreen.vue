<!-- ============================================ -->
<!-- 文件: src/views/BigScreen.vue -->
<!-- 科技感大屏展示 -->
<!-- ============================================ -->
<template>
  <div class="big-screen-container" ref="bigScreenContainer">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="grid-lines"></div>
      <div class="corner corner-tl"></div>
      <div class="corner corner-tr"></div>
      <div class="corner corner-bl"></div>
      <div class="corner corner-br"></div>
    </div>

    <!-- 顶部标题栏 -->
    <div class="header-section">
      <div class="title-box">
        <div class="title-icon">⚡</div>
        <h1 class="main-title">监控系统大屏</h1>
        <div class="title-line"></div>
      </div>
      <div class="header-right">
        <div class="time-box">
          <div class="time-label">当前时间</div>
          <div class="time-value">{{ currentTime }}</div>
        </div>
        <button 
          v-if="!isFullscreen"
          class="fullscreen-btn" 
          @click.stop="toggleFullscreen" 
          type="button"
        >
          <span class="fullscreen-icon">⛶</span>
          <span class="btn-text">全屏</span>
        </button>
      </div>
      
      <!-- 全屏模式下的退出按钮（右上角悬浮） -->
      <div 
        v-if="isFullscreen" 
        class="fullscreen-exit-btn"
        @click.stop="toggleFullscreen"
      >
        <span class="exit-icon">✕</span>
        <span class="exit-text">退出全屏</span>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-section">
      <!-- 左侧区域 -->
      <div class="left-panel">
        <!-- 主机状态 -->
        <div class="panel-box" style="flex: 0 0 auto;">
          <div class="panel-header">
            <span class="panel-icon">🖥️</span>
            <span class="panel-title">主机状态</span>
          </div>
          <div class="panel-content">
            <div class="stat-item">
              <div class="stat-label">总主机数</div>
              <div class="stat-value highlight-blue">{{ overview.total_agents }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">在线主机</div>
              <div class="stat-value highlight-green">{{ overview.online_agents }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">离线主机</div>
              <div class="stat-value highlight-red">{{ overview.offline_agents }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">在线率</div>
              <div class="stat-value highlight-cyan">
                {{ overview.total_agents > 0 ? ((overview.online_agents / overview.total_agents) * 100).toFixed(1) : 0 }}%
              </div>
            </div>
          </div>
        </div>

        <!-- 告警统计 -->
        <div class="panel-box" style="flex: 0 0 auto;">
          <div class="panel-header">
            <span class="panel-icon">🚨</span>
            <span class="panel-title">告警统计</span>
          </div>
          <div class="panel-content">
            <div class="alert-stat">
              <div class="alert-item critical">
                <div class="alert-icon">🔴</div>
                <div class="alert-info">
                  <div class="alert-label">严重告警</div>
                  <div class="alert-count">{{ alertStats.critical }}</div>
                </div>
              </div>
              <div class="alert-item warning">
                <div class="alert-icon">🟡</div>
                <div class="alert-info">
                  <div class="alert-label">警告告警</div>
                  <div class="alert-count">{{ alertStats.warning }}</div>
                </div>
              </div>
              <div class="alert-item info">
                <div class="alert-icon">🔵</div>
                <div class="alert-info">
                  <div class="alert-label">信息告警</div>
                  <div class="alert-count">{{ alertStats.info }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 系统指标 -->
        <div class="panel-box" style="flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow: hidden;">
          <div class="panel-header">
            <span class="panel-icon">📊</span>
            <span class="panel-title">系统指标</span>
          </div>
          <div class="metric-switch-container" v-if="overview.avg_cpu > 0 || overview.avg_memory > 0">
            <!-- 平均CPU -->
            <div class="metric-switch-item" v-show="currentMetric === 'cpu'">
              <div class="metric-item-content">
                <div class="metric-label-row">
                  <span class="metric-icon">🖥️</span>
                  <span class="metric-label">平均CPU</span>
                </div>
                <div class="metric-value-display">
                  <span class="value-main cpu-color">{{ (overview.avg_cpu || 0).toFixed(1) }}</span>
                  <span class="value-suffix cpu-color">%</span>
                </div>
                <div class="metric-bar">
                  <div class="bar-bg">
                    <div class="bar-fill cpu-bar-fill" :style="{ width: Math.min(overview.avg_cpu || 0, 100) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 平均内存 -->
            <div class="metric-switch-item" v-show="currentMetric === 'memory'">
              <div class="metric-item-content">
                <div class="metric-label-row">
                  <span class="metric-icon">💾</span>
                  <span class="metric-label">平均内存</span>
                </div>
                <div class="metric-value-display">
                  <span class="value-main memory-color">{{ (overview.avg_memory || 0).toFixed(1) }}</span>
                  <span class="value-suffix memory-color">%</span>
                </div>
                <div class="metric-bar">
                  <div class="bar-bg">
                    <div class="bar-fill memory-bar-fill" :style="{ width: Math.min(overview.avg_memory || 0, 100) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 切换指示器 -->
            <div class="switch-indicators">
              <span class="indicator" :class="{ active: currentMetric === 'cpu' }" @click="currentMetric = 'cpu'"></span>
              <span class="indicator" :class="{ active: currentMetric === 'memory' }" @click="currentMetric = 'memory'"></span>
            </div>
          </div>
          <div v-else class="empty-data">暂无数据</div>
        </div>
      </div>

      <!-- 中间区域 -->
      <div class="center-panel">
        <!-- CPU使用率图表 -->
        <div class="chart-box">
          <div class="chart-header">
            <span class="chart-icon">💻</span>
            <span class="chart-title">CPU使用率 Top 10</span>
          </div>
          <div class="chart-container" ref="cpuChartRef"></div>
        </div>

        <!-- 内存使用率图表 -->
        <div class="chart-box">
          <div class="chart-header">
            <span class="chart-icon">🧠</span>
            <span class="chart-title">内存使用率 Top 10</span>
          </div>
          <div class="chart-container" ref="memoryChartRef"></div>
        </div>
      </div>

      <!-- 右侧区域 -->
      <div class="right-panel">
        <!-- 实时告警列表 -->
        <div class="panel-box" style="flex: 0 0 auto; min-height: 0; display: flex; flex-direction: column;">
          <div class="panel-header">
            <span class="panel-icon">⚠️</span>
            <span class="panel-title">实时告警</span>
          </div>
          <div class="auto-scroll-container alert-scroll">
            <div class="scroll-wrapper" v-if="recentAlerts.length > 0">
              <div class="scrolling-content panel-content alert-list">
                <div
                  v-for="alert in recentAlerts"
                  :key="alert.id"
                  class="alert-item-row"
                  :class="alert.severity"
                >
                  <div class="alert-severity-icon">
                    {{ alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵' }}
                  </div>
                  <div class="alert-content">
                    <div class="alert-rule">{{ alert.rule_name }}</div>
                    <div class="alert-host">{{ alert.hostname }}</div>
                    <div class="alert-time">{{ formatTime(alert.fired_at) }}</div>
                  </div>
                </div>
              </div>
              <div class="scrolling-content panel-content alert-list" aria-hidden="true">
                <div
                  v-for="alert in recentAlerts"
                  :key="'dup-' + alert.id"
                  class="alert-item-row"
                  :class="alert.severity"
                >
                  <div class="alert-severity-icon">
                    {{ alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵' }}
                  </div>
                  <div class="alert-content">
                    <div class="alert-rule">{{ alert.rule_name }}</div>
                    <div class="alert-host">{{ alert.hostname }}</div>
                    <div class="alert-time">{{ formatTime(alert.fired_at) }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-alert">暂无告警</div>
          </div>
        </div>

        <!-- 主机资源Top -->
        <div class="panel-box" style="flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow: hidden;">
          <div class="panel-header">
            <span class="panel-icon">📊</span>
            <span class="panel-title">主机资源消耗 Top 5</span>
          </div>
          <div class="auto-scroll-container resource-scroll">
            <div class="scroll-wrapper" v-if="hostResources.length > 0">
              <div class="scrolling-content panel-content host-resource-list">
                <div
                  v-for="(host, index) in hostResources"
                  :key="host.host_id"
                  class="host-resource-item"
                >
                  <div class="resource-rank">{{ index + 1 }}</div>
                  <div class="resource-info">
                    <div class="host-name">
                      <span class="host-icon">🖥️</span>
                      <span class="host-text">{{ host.hostname || host.host_id }}</span>
                    </div>
                    <div class="resource-bars">
                      <div class="resource-bar-item">
                        <span class="bar-label">CPU</span>
                        <div class="resource-bar-wrapper">
                          <div class="resource-bar cpu-bar" :style="{ width: Math.min(host.cpu_usage, 100) + '%' }"></div>
                        </div>
                        <span class="bar-value cpu-value">{{ host.cpu_usage.toFixed(1) }}%</span>
                      </div>
                      <div class="resource-bar-item">
                        <span class="bar-label">内存</span>
                        <div class="resource-bar-wrapper">
                          <div class="resource-bar memory-bar" :style="{ width: Math.min(host.memory_usage, 100) + '%' }"></div>
                        </div>
                        <span class="bar-value memory-value">{{ host.memory_usage.toFixed(1) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="scrolling-content panel-content host-resource-list" aria-hidden="true">
                <div
                  v-for="(host, index) in hostResources"
                  :key="'dup-' + host.host_id"
                  class="host-resource-item"
                >
                  <div class="resource-rank">{{ index + 1 }}</div>
                  <div class="resource-info">
                    <div class="host-name">
                      <span class="host-icon">🖥️</span>
                      <span class="host-text">{{ host.hostname || host.host_id }}</span>
                    </div>
                    <div class="resource-bars">
                      <div class="resource-bar-item">
                        <span class="bar-label">CPU</span>
                        <div class="resource-bar-wrapper">
                          <div class="resource-bar cpu-bar" :style="{ width: Math.min(host.cpu_usage, 100) + '%' }"></div>
                        </div>
                        <span class="bar-value cpu-value">{{ host.cpu_usage.toFixed(1) }}%</span>
                      </div>
                      <div class="resource-bar-item">
                        <span class="bar-label">内存</span>
                        <div class="resource-bar-wrapper">
                          <div class="resource-bar memory-bar" :style="{ width: Math.min(host.memory_usage, 100) + '%' }"></div>
                        </div>
                        <span class="bar-value memory-value">{{ host.memory_usage.toFixed(1) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-data">暂无数据</div>
          </div>
        </div>
        
        <!-- 磁盘空间告警Top -->
        <div class="panel-box" style="flex: 0 0 200px; min-height: 0; overflow: hidden;">
          <div class="panel-header">
            <span class="panel-icon">💾</span>
            <span class="panel-title">磁盘告警</span>
          </div>
          <div class="auto-scroll-container disk-scroll">
            <div class="scroll-wrapper" v-if="diskAlerts.length > 0">
              <div class="scrolling-content panel-content disk-alert-list">
                <div
                  v-for="(alert, index) in diskAlerts"
                  :key="alert.host_id + index"
                  class="disk-alert-item"
                >
                  <div class="alert-rank">{{ index + 1 }}</div>
                  <div class="alert-info">
                    <div class="alert-host">
                      <span class="host-icon">🖥️</span>
                      <span>{{ alert.hostname || alert.host_id }}</span>
                    </div>
                    <div class="alert-mountpoint">{{ alert.mountpoint }}</div>
                  </div>
                  <div class="alert-usage" :class="getDiskAlertClass(alert.disk_usage)">
                    {{ alert.disk_usage.toFixed(1) }}%
                  </div>
                </div>
              </div>
              <div class="scrolling-content panel-content disk-alert-list" aria-hidden="true">
                <div
                  v-for="(alert, index) in diskAlerts"
                  :key="'dup-' + alert.host_id + index"
                  class="disk-alert-item"
                >
                  <div class="alert-rank">{{ index + 1 }}</div>
                  <div class="alert-info">
                    <div class="alert-host">
                      <span class="host-icon">🖥️</span>
                      <span>{{ alert.hostname || alert.host_id }}</span>
                    </div>
                    <div class="alert-mountpoint">{{ alert.mountpoint }}</div>
                  </div>
                  <div class="alert-usage" :class="getDiskAlertClass(alert.disk_usage)">
                    {{ alert.disk_usage.toFixed(1) }}%
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-data">暂无告警</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部数据流 -->
    <div class="footer-section">
      <div class="data-stream">
        <div class="stream-item" v-for="(item, index) in streamData" :key="index">
          <span class="stream-label">{{ item.label }}:</span>
          <span class="stream-value">{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getOverview, getTopMetrics, getLatestMetrics } from '@/api/metrics'
import { getAlertHistory as fetchAlertHistoryAPI } from '@/api/alert'
import { axios } from '@/utils/request'

// 封装getAlertHistory函数，避免命名冲突
const getAlertHistory = (params: any) => fetchAlertHistoryAPI(params)
import type { ApiResponse, Overview } from '@/types'
import type { AlertHistory } from '@/api/alert'
import dayjs from 'dayjs'

const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const overview = ref<Overview>({
  total_agents: 0,
  online_agents: 0,
  offline_agents: 0,
  avg_cpu: 0,
  avg_memory: 0,
  total_metrics: 0
})

const alertStats = ref({
  critical: 0,
  warning: 0,
  info: 0
})

const recentAlerts = ref<AlertHistory[]>([])
const hostResources = ref<any[]>([])
const diskAlerts = ref<any[]>([])
const streamData = ref<Array<{ label: string; value: string }>>([])

const cpuChartRef = ref<HTMLElement>()
const memoryChartRef = ref<HTMLElement>()
const bigScreenContainer = ref<HTMLElement>()
let cpuChart: echarts.ECharts | null = null
let memoryChart: echarts.ECharts | null = null
let refreshTimer: any = null
let metricSwitchTimer: any = null
const isFullscreen = ref(false)
const currentMetric = ref<'cpu' | 'memory'>('cpu')

// 格式化时间
const formatTime = (time: string) => {
  return dayjs(time).format('MM-DD HH:mm')
}

// 获取概览数据
const fetchOverview = async () => {
  try {
    const res = await getOverview() as unknown as ApiResponse<Overview>
    if (res?.data) {
      overview.value = res.data
    }
  } catch (error) {
    console.error('Failed to fetch overview:', error)
  }
}

// 获取告警数据
const fetchAlerts = async () => {
  try {
    const res = await getAlertHistory({ status: 'firing', limit: 10 })
    if (res?.code === 200 && res?.data) {
      recentAlerts.value = res.data.slice(0, 5)
      
      // 统计告警数量
      alertStats.value = {
        critical: res.data.filter(a => a.severity === 'critical').length,
        warning: res.data.filter(a => a.severity === 'warning').length,
        info: res.data.filter(a => a.severity === 'info').length
      }
    }
  } catch (error) {
    console.error('Failed to fetch alerts:', error)
  }
}

// 获取Top指标
const fetchTopMetrics = async () => {
  try {
    const [cpuRes, memoryRes] = await Promise.all([
      getTopMetrics({ type: 'cpu', limit: 10, order: 'desc' }),
      getTopMetrics({ type: 'memory', limit: 10, order: 'desc' })
    ])
    
    const cpuData = (cpuRes as unknown as ApiResponse<any[]>).data || []
    const memoryData = (memoryRes as unknown as ApiResponse<any[]>).data || []
    
    updateCPUChart(cpuData)
    updateMemoryChart(memoryData)
  } catch (error) {
    console.error('Failed to fetch top metrics:', error)
  }
}

// 获取主机资源数据
const fetchHostResources = async () => {
  try {
    // 1. 获取主机列表（包含所有状态的主机）
    const res = await axios.get('/v1/agents', { params: { page_size: 100 } }) as unknown as ApiResponse<any>
    
    if (res?.code === 200 && res?.data?.agents) {
      const agents = res.data.agents
      
      // 获取每个主机的最新指标（不过滤状态，只要能获取到指标就算）
      const resourcePromises = agents.map(async (agent: any) => {
        try {
          const metricsRes = await getLatestMetrics(agent.host_id) as unknown as ApiResponse<any>
          
          if (metricsRes?.data) {
            const data = metricsRes.data
            // 尝试多种可能的字段名格式
            const cpuUsage = data.cpu?.usage_percent || data.cpu?.UsagePercent || data.cpu?.usagePercent || 0
            const memoryUsage = data.memory?.used_percent || data.memory?.UsedPercent || data.memory?.usedPercent || 0
            const partitions = data.disk?.partitions || data.disk?.Partitions || data.disk || []
            
            return {
              host_id: agent.host_id,
              hostname: agent.hostname,
              status: agent.status,
              cpu_usage: typeof cpuUsage === 'number' ? cpuUsage : 0,
              memory_usage: typeof memoryUsage === 'number' ? memoryUsage : 0,
              disk_partitions: Array.isArray(partitions) ? partitions : []
            }
          }
        } catch (error) {
          console.error(`Failed to fetch metrics for ${agent.host_id}:`, error)
        }
        return null
      })
      
      const resources = await Promise.all(resourcePromises)
      const validResources = resources.filter(r => r !== null)
      
      // 按综合负载排序，取Top 5
      hostResources.value = validResources
        .sort((a, b) => (b.cpu_usage + b.memory_usage) - (a.cpu_usage + a.memory_usage))
        .slice(0, 5)
    } else {
      hostResources.value = []
    }
  } catch (error) {
    console.error('Failed to fetch host resources:', error)
    hostResources.value = []
  }
}

// 获取磁盘告警（从后端告警历史获取）
const fetchDiskAlerts = async () => {
  try {
    // 从告警历史中获取disk类型的firing告警
    const res = await getAlertHistory({ status: 'firing', limit: 100 }) as unknown as ApiResponse<any[]>
    
    if (res?.code === 200 && res?.data) {
      // 过滤出disk类型的告警
      const diskAlertsData = res.data.filter((alert: any) => {
        return alert.metric_type === 'disk' && alert.status === 'firing'
      })
      
      // 转换为展示格式
      diskAlerts.value = diskAlertsData.slice(0, 5).map((alert: any) => ({
        host_id: alert.host_id,
        hostname: alert.hostname,
        mountpoint: alert.labels?.mountpoint || '/',
        disk_usage: alert.metric_value,
        severity: alert.severity,
        message: alert.message
      }))
    } else {
      diskAlerts.value = []
    }
  } catch (error) {
    console.error('Failed to fetch disk alerts:', error)
    diskAlerts.value = []
  }
}

// 获取磁盘告警等级样式
const getDiskAlertClass = (usage: number) => {
  if (usage >= 90) return 'disk-critical'
  if (usage >= 85) return 'disk-warning'
  if (usage >= 70) return 'disk-info'
  return ''
}

// 更新CPU图表
const updateCPUChart = (data: any[]) => {
  if (!cpuChart || !cpuChartRef.value) return
  
  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: '12%',
      right: '8%',
      top: '12%',
      bottom: '8%',
      containLabel: false
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#00d4ff' } },
      axisLabel: { color: '#00d4ff', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.1)' } }
    },
    yAxis: {
      type: 'category',
      data: data.map((item: any) => item.host_id || '未知').reverse(),
      axisLine: { lineStyle: { color: '#00d4ff' } },
      axisLabel: { color: '#00d4ff' }
    },
    series: [{
      type: 'bar',
      data: data.map((item: any) => parseFloat((item.value || 0).toFixed(1))).reverse(),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#00d4ff' },
          { offset: 1, color: '#0099ff' }
        ])
      },
      label: {
        show: true,
        position: 'right',
        color: '#00d4ff',
        formatter: (params: any) => {
          return parseFloat((params.value || 0).toFixed(1)) + '%'
        }
      }
    }]
  }
  
  cpuChart.setOption(option)
}

// 更新内存图表
const updateMemoryChart = (data: any[]) => {
  if (!memoryChart || !memoryChartRef.value) return
  
  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: '12%',
      right: '8%',
      top: '12%',
      bottom: '8%',
      containLabel: false
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#00ff88' } },
      axisLabel: { color: '#00ff88', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(0, 255, 136, 0.1)' } }
    },
    yAxis: {
      type: 'category',
      data: data.map((item: any) => item.host_id || '未知').reverse(),
      axisLine: { lineStyle: { color: '#00ff88' } },
      axisLabel: { color: '#00ff88' }
    },
    series: [{
      type: 'bar',
      data: data.map((item: any) => parseFloat((item.value || 0).toFixed(1))).reverse(),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#00ff88' },
          { offset: 1, color: '#00cc6a' }
        ])
      },
      label: {
        show: true,
        position: 'right',
        color: '#00ff88',
        formatter: (params: any) => {
          return parseFloat((params.value || 0).toFixed(1)) + '%'
        }
      }
    }]
  }
  
  memoryChart.setOption(option)
}

// 更新数据流
const updateStreamData = () => {
  streamData.value = [
    { label: '总主机数', value: overview.value.total_agents.toString() },
    { label: '在线主机', value: overview.value.online_agents.toString() },
    { label: '平均CPU', value: (overview.value.avg_cpu || 0).toFixed(1) + '%' },
    { label: '平均内存', value: (overview.value.avg_memory || 0).toFixed(1) + '%' },
    { label: '严重告警', value: alertStats.value.critical.toString() },
    { label: '警告告警', value: alertStats.value.warning.toString() }
  ]
}

// 更新时间
const updateTime = () => {
  currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
}

// 刷新所有数据
const refreshData = async () => {
  await Promise.all([
    fetchOverview(),
    fetchAlerts(),
    fetchTopMetrics(),
    fetchHostResources(),
    fetchDiskAlerts()
  ])
  updateStreamData()
}

// 全屏功能
const toggleFullscreen = async () => {
  console.log('toggleFullscreen called, isFullscreen:', isFullscreen.value)
  console.log('bigScreenContainer.value:', bigScreenContainer.value)
  
  if (!bigScreenContainer.value) {
    console.error('bigScreenContainer ref is not available')
    return
  }
  
  try {
    if (!isFullscreen.value) {
      // 进入全屏
      console.log('Entering fullscreen...')
      const elem = bigScreenContainer.value
      
      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
        console.log('Fullscreen requested via standard API')
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen()
        console.log('Fullscreen requested via webkit API')
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen()
        console.log('Fullscreen requested via moz API')
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen()
        console.log('Fullscreen requested via ms API')
      } else {
        console.error('Fullscreen API is not supported in this browser')
        alert('您的浏览器不支持全屏功能')
      }
    } else {
      // 退出全屏
      console.log('Exiting fullscreen...')
      
      if (document.exitFullscreen) {
        await document.exitFullscreen()
        console.log('Exited fullscreen via standard API')
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
        console.log('Exited fullscreen via webkit API')
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
        console.log('Exited fullscreen via moz API')
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
        console.log('Exited fullscreen via ms API')
      }
    }
  } catch (error: any) {
    console.error('Fullscreen error:', error)
    if (error.name === 'NotAllowedError') {
      alert('全屏请求被拒绝，请检查浏览器权限设置')
    } else {
      alert('全屏操作失败: ' + error.message)
    }
  }
}

// 监听全屏状态变化
const handleFullscreenChange = () => {
  const wasFullscreen = isFullscreen.value
  isFullscreen.value = !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  )
  
  console.log('Fullscreen state changed:', {
    wasFullscreen,
    isFullscreen: isFullscreen.value,
    fullscreenElement: document.fullscreenElement || (document as any).webkitFullscreenElement
  })
  
  // 全屏状态变化时，重新调整图表大小
  setTimeout(() => {
    cpuChart?.resize()
    memoryChart?.resize()
  }, 100)
}

// 初始化图表
const initCharts = async () => {
  await nextTick()
  
  if (cpuChartRef.value) {
    cpuChart = echarts.init(cpuChartRef.value)
    window.addEventListener('resize', () => cpuChart?.resize())
  }
  
  if (memoryChartRef.value) {
    memoryChart = echarts.init(memoryChartRef.value)
    window.addEventListener('resize', () => memoryChart?.resize())
  }
  
  await fetchTopMetrics()
}

onMounted(async () => {
  // 初始化全屏状态
  handleFullscreenChange()
  
  await initCharts()
  await refreshData()
  
  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)
  
  // 每30秒刷新数据
  refreshTimer = setInterval(() => {
    refreshData()
  }, 30000)
  
  // 每秒更新时间
  setInterval(updateTime, 1000)
  
  // 系统指标自动切换（每3秒切换一次）
  metricSwitchTimer = setInterval(() => {
    currentMetric.value = currentMetric.value === 'cpu' ? 'memory' : 'cpu'
  }, 3000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  if (metricSwitchTimer) {
    clearInterval(metricSwitchTimer)
  }
  if (cpuChart) {
    cpuChart.dispose()
  }
  if (memoryChart) {
    memoryChart.dispose()
  }
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
})
</script>

<style scoped>
.big-screen-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%);
  color: #00d4ff;
  overflow: hidden;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

/* 全屏模式样式 */
.big-screen-container:fullscreen {
  width: 100vw;
  height: 100vh;
}

.big-screen-container:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
}

.big-screen-container:-moz-full-screen {
  width: 100vw;
  height: 100vh;
}

.big-screen-container:-ms-fullscreen {
  width: 100vw;
  height: 100vh;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.grid-lines {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.3;
}

.corner {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 2px solid #00d4ff;
  opacity: 0.6;
}

.corner-tl {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
}

.corner-tr {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
}

.corner-bl {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
}

.corner-br {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
}

/* 顶部标题栏 */
.header-section {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  border-bottom: 2px solid rgba(0, 212, 255, 0.3);
  box-shadow: 0 2px 20px rgba(0, 212, 255, 0.2);
}

.title-box {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title-icon {
  font-size: 40px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.main-title {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(90deg, #00d4ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
}

.title-line {
  width: 200px;
  height: 2px;
  background: linear-gradient(90deg, #00d4ff, transparent);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.time-box {
  text-align: right;
}

.time-label {
  font-size: 14px;
  color: rgba(0, 212, 255, 0.7);
  margin-bottom: 5px;
}

.time-value {
  font-size: 24px;
  font-weight: bold;
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

/* 全屏按钮 */
.fullscreen-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.5);
  border-radius: 6px;
  color: #00d4ff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.fullscreen-btn:hover {
  background: rgba(0, 212, 255, 0.2);
  border-color: rgba(0, 212, 255, 0.8);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
  transform: translateY(-2px);
}

.fullscreen-btn:active {
  transform: translateY(0);
}

.fullscreen-icon {
  font-size: 18px;
  line-height: 1;
  display: inline-block;
}

.btn-text {
  font-size: 14px;
}

/* 全屏模式下的退出按钮 */
.fullscreen-exit-btn {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(0, 212, 255, 0.5);
  border-radius: 6px;
  color: #00d4ff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  opacity: 0.3;
  transform: translateX(calc(100% - 30px));
  overflow: hidden;
  white-space: nowrap;
}

.fullscreen-exit-btn:hover {
  opacity: 1;
  transform: translateX(0);
  background: rgba(0, 212, 255, 0.2);
  border-color: rgba(0, 212, 255, 0.8);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}

.exit-icon {
  font-size: 18px;
  line-height: 1;
  display: inline-block;
  min-width: 18px;
  flex-shrink: 0;
}

.exit-text {
  font-size: 14px;
  white-space: nowrap;
}

/* 内容区域 */
.content-section {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 320px 1fr 360px;
  gap: 20px;
  padding: 20px;
  height: calc(100vh - 170px);
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow-y: auto;
}

.left-panel::-webkit-scrollbar {
  width: 4px;
}

.left-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.3);
  border-radius: 2px;
}

/* 中间面板 */
.center-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow: hidden;
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
  overflow-y: auto;
  padding-right: 5px;
}

.right-panel::-webkit-scrollbar {
  width: 4px;
}

.right-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.3);
  border-radius: 2px;
}

.right-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

/* 自动滚动容器 */
.auto-scroll-container {
  flex: 1;
  overflow-y: hidden;
  position: relative;
}

.auto-scroll-container:hover .scrolling-content {
  animation-play-state: paused;
}

.auto-scroll-container:hover {
  overflow-y: auto;
}

/* 滚动内容包装器 */
.scroll-wrapper {
  display: flex;
  flex-direction: column;
  animation: scroll-down 20s linear infinite;
}

.scroll-wrapper:hover {
  animation-play-state: paused;
}

/* 告警滚动容器 */
.alert-scroll {
  max-height: 180px;
}

.alert-scroll .panel-content.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-scroll .scrolling-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 主机资源滚动容器 */
.resource-scroll {
  max-height: 300px;
}

.resource-scroll .panel-content.host-resource-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.resource-scroll .scrolling-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 磁盘告警滚动容器 */
.disk-scroll {
  max-height: 180px;
}

.disk-scroll .panel-content.disk-alert-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.disk-scroll .scrolling-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 向下滚动动画 */
@keyframes scroll-down {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

/* 告警滚动动画 */
.alert-scroll .scroll-wrapper {
  animation: scroll-down 15s linear infinite;
}

.alert-scroll:hover .scroll-wrapper {
  animation-play-state: paused;
}

/* 主机资源滚动动画 - 更慢因为内容更大 */
.resource-scroll .scroll-wrapper {
  animation: scroll-down 25s linear infinite;
}

.resource-scroll:hover .scroll-wrapper {
  animation-play-state: paused;
}

/* 磁盘告警滚动动画 */
.disk-scroll .scroll-wrapper {
  animation: scroll-down 12s linear infinite;
}

.disk-scroll:hover .scroll-wrapper {
  animation-play-state: paused;
}

/* 系统指标切换容器 */
.metric-switch-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.metric-switch-item {
  width: 100%;
  animation: fadeIn 0.5s ease-in-out;
}

.metric-item-content {
  padding: 15px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.metric-item-content:hover {
  background: rgba(0, 212, 255, 0.08);
  border-color: rgba(0, 212, 255, 0.4);
}

.metric-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.metric-icon {
  font-size: 16px;
}

.metric-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.metric-value-display {
  display: flex;
  align-items: baseline;
  margin-bottom: 10px;
}

.value-main {
  font-size: 32px;
  font-weight: bold;
  line-height: 1;
}

.value-suffix {
  font-size: 18px;
  margin-left: 2px;
  opacity: 0.7;
}

.cpu-color {
  color: #00d4ff;
  text-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
}

.memory-color {
  color: #00ff88;
  text-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
}

.metric-bar {
  width: 100%;
}

.bar-bg {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.cpu-bar-fill {
  background: linear-gradient(90deg, #00d4ff, #0099ff);
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
}

.memory-bar-fill {
  background: linear-gradient(90deg, #00ff88, #00cc6a);
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
}

/* 切换指示器 */
.switch-indicators {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator:hover {
  background: rgba(255, 255, 255, 0.5);
}

.indicator.active {
  background: #00d4ff;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.8);
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 淡入淡出遮罩 */
.auto-scroll-container::before,
.auto-scroll-container::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 30px;
  pointer-events: none;
  z-index: 1;
}

.auto-scroll-container::before {
  top: 0;
  background: linear-gradient(to bottom, rgba(10, 27, 50, 0.9), transparent);
}

.auto-scroll-container::after {
  bottom: 0;
  background: linear-gradient(to top, rgba(10, 27, 50, 0.9), transparent);
}

/* 隐藏滚动条但保留功能 */
.auto-scroll-container::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.auto-scroll-container::-webkit-scrollbar-thumb {
  width: 0;
  height: 0;
}

.auto-scroll-container::-webkit-scrollbar-track {
  width: 0;
  height: 0;
}

/* 悬停时显示滚动条 */
.auto-scroll-container:hover::-webkit-scrollbar {
  width: 4px;
}

.auto-scroll-container:hover::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.3);
  border-radius: 2px;
}

/* 面板样式 */
.panel-box {
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  padding: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.1);
  transition: all 0.3s;
  flex-shrink: 0;
}

.panel-box:hover {
  border-color: rgba(0, 212, 255, 0.6);
  box-shadow: 0 4px 30px rgba(0, 212, 255, 0.2);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
}

.panel-icon {
  font-size: 20px;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #00d4ff;
}

.panel-content {
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* 统计项 */
.panel-content {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  min-height: 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
  flex-shrink: 0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.highlight-blue { color: #00d4ff; text-shadow: 0 0 10px rgba(0, 212, 255, 0.5); }
.highlight-green { color: #00ff88; text-shadow: 0 0 10px rgba(0, 255, 136, 0.5); }
.highlight-red { color: #ff4757; text-shadow: 0 0 10px rgba(255, 71, 87, 0.5); }
.highlight-cyan { color: #00ffff; text-shadow: 0 0 10px rgba(0, 255, 255, 0.5); }

/* 告警统计 */
.alert-stat {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  justify-content: space-around;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  border-radius: 6px;
  background: rgba(0, 212, 255, 0.05);
}

.alert-item.critical { border-left: 3px solid #ff4757; }
.alert-item.warning { border-left: 3px solid #ffa502; }
.alert-item.info { border-left: 3px solid #00d4ff; }

.alert-icon {
  font-size: 24px;
}

.alert-info {
  flex: 1;
}

.alert-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 5px;
}

.alert-count {
  font-size: 28px;
  font-weight: bold;
}

.alert-item.critical .alert-count { color: #ff4757; }
.alert-item.warning .alert-count { color: #ffa502; }
.alert-item.info .alert-count { color: #00d4ff; }

/* 指标项样式（保留用于其他可能的使用场景） */
.metric-item {
  flex-shrink: 0;
  width: 100%;
}

.metric-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.metric-progress {
  position: relative;
  height: 30px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff, #0099ff);
  border-radius: 4px;
  transition: width 0.5s;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.progress-bar.memory {
  background: linear-gradient(90deg, #00ff88, #00cc6a);
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.progress-text {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  font-weight: bold;
  color: #00d4ff;
}

/* 图表区域 */
.chart-box {
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  padding: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.1);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chart-box:last-child {
  margin-bottom: 0;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  flex-shrink: 0;
}

.chart-icon {
  font-size: 20px;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  color: #00d4ff;
}

.chart-container {
  width: 100%;
  flex: 1;
  min-height: 0;
}

/* 告警列表 */
.alert-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.alert-list::-webkit-scrollbar {
  width: 4px;
}

.alert-list::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.3);
  border-radius: 2px;
}

.empty-alert {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 20px;
}

.alert-item-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 6px;
  background: rgba(0, 212, 255, 0.05);
  border-left: 3px solid;
  transition: all 0.3s;
}

.alert-item-row:hover {
  background: rgba(0, 212, 255, 0.1);
  transform: translateX(5px);
}

.alert-item-row.critical { border-left-color: #ff4757; }
.alert-item-row.warning { border-left-color: #ffa502; }
.alert-item-row.info { border-left-color: #00d4ff; }

.alert-severity-icon {
  font-size: 20px;
}

.alert-content {
  flex: 1;
}

.alert-rule {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 5px;
}

.alert-host {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 3px;
}

.alert-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

/* 主机资源列表 */
.host-resource-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.host-resource-list::-webkit-scrollbar {
  width: 4px;
}

.host-resource-list::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.3);
  border-radius: 2px;
}

.empty-data {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 20px;
}

.host-resource-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 6px;
  background: rgba(0, 212, 255, 0.05);
  transition: all 0.3s;
}

.host-resource-item:hover {
  background: rgba(0, 212, 255, 0.1);
  transform: translateX(2px);
}

.resource-rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 212, 255, 0.2);
  border-radius: 4px;
  font-weight: bold;
  color: #00d4ff;
  font-size: 14px;
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
  min-width: 0;
}

.host-name {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.host-icon {
  font-size: 14px;
}

.host-text {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.resource-bar-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  width: 32px;
  flex-shrink: 0;
}

.resource-bar-wrapper {
  flex: 1;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.resource-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s;
}

.cpu-bar {
  background: linear-gradient(90deg, #00d4ff, #0099ff);
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
}

.memory-bar {
  background: linear-gradient(90deg, #00ff88, #00cc6a);
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.4);
}

.bar-value {
  font-size: 11px;
  font-weight: bold;
  width: 48px;
  text-align: right;
  flex-shrink: 0;
}

.cpu-value {
  color: #00d4ff;
}

.memory-value {
  color: #00ff88;
}

/* 磁盘告警列表 */
.disk-alert-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.disk-alert-list::-webkit-scrollbar {
  width: 3px;
}

.disk-alert-list::-webkit-scrollbar-thumb {
  background: rgba(255, 165, 2, 0.3);
  border-radius: 2px;
}

.disk-alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(255, 165, 2, 0.05);
  transition: all 0.3s;
  flex-shrink: 0;
}

.disk-alert-item:hover {
  background: rgba(255, 165, 2, 0.1);
}

.alert-rank {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 165, 2, 0.2);
  border-radius: 4px;
  font-weight: bold;
  color: #ffa502;
  font-size: 11px;
  flex-shrink: 0;
}

.alert-info {
  flex: 1;
  min-width: 0;
}

.alert-host {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.alert-host .host-icon {
  font-size: 11px;
  flex-shrink: 0;
}

.alert-host span:last-child {
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-mountpoint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-usage {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

.disk-critical {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.2);
}

.disk-warning {
  color: #ffa502;
  background: rgba(255, 165, 2, 0.2);
}

.disk-info {
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.2);
}

/* 底部数据流 */
.footer-section {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(0, 212, 255, 0.3);
  display: flex;
  align-items: center;
  padding: 0 40px;
  z-index: 1;
}

.data-stream {
  display: flex;
  gap: 40px;
  animation: stream 30s linear infinite;
}

@keyframes stream {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.stream-item {
  display: flex;
  gap: 10px;
  white-space: nowrap;
}

.stream-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.stream-value {
  color: #00d4ff;
  font-weight: bold;
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 1600px) {
  .content-section {
    grid-template-columns: 300px 1fr 340px;
  }
}

@media (max-width: 1400px) {
  .content-section {
    grid-template-columns: 280px 1fr 320px;
  }
}

@media (max-width: 1200px) {
  .content-section {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    height: auto;
    min-height: calc(100vh - 170px);
  }
  
  .left-panel,
  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 15px;
    height: auto;
    overflow: visible;
  }
  
  .right-panel .panel-box {
    flex: none;
    width: 100%;
  }
  
  .center-panel {
    height: auto;
  }
  
  .chart-box {
    min-height: 400px;
  }
}
</style>

