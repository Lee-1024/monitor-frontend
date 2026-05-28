<!-- ============================================ -->
<!-- 文件路径: src/views/BigScreen.vue -->
<!-- 监控大屏页面 -->
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

    <!-- 页面头部 -->
    <div class="header-section">
      <div class="title-box">
        <el-icon class="title-icon"><Monitor /></el-icon>
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
          <el-icon class="fullscreen-icon"><FullScreen /></el-icon>
          <span class="btn-text">全屏</span>
        </button>
      </div>
      
      <!-- 全屏退出按钮 -->
      <div 
        v-if="isFullscreen" 
        class="fullscreen-exit-btn"
        @click.stop="toggleFullscreen"
      >
        <el-icon class="exit-icon"><Close /></el-icon>
        <span class="exit-text">退出全屏</span>
      </div>
    </div>

    <div class="kpi-strip">
      <div class="kpi-card">
        <span class="kpi-label">总主机</span>
        <strong class="highlight-blue">{{ overview.total_agents }}</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">在线</span>
        <strong class="highlight-green">{{ overview.online_agents }}</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">离线</span>
        <strong class="highlight-red">{{ overview.offline_agents }}</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">平均CPU</span>
        <strong class="cpu-color">{{ (overview.avg_cpu || 0).toFixed(1) }}%</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">平均内存</span>
        <strong class="memory-color">{{ (overview.avg_memory || 0).toFixed(1) }}%</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">GPU设备</span>
        <strong class="gpu-color">{{ gpuSummary.devices }}</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">严重告警</span>
        <strong class="highlight-red">{{ alertStats.critical }}</strong>
      </div>
    </div>

    <div class="content-section">
      <main class="main-grid">
        <section class="chart-stack">
          <div class="panel-box chart-box">
            <div class="panel-header">
              <el-icon class="panel-icon"><Cpu /></el-icon>
              <span class="panel-title">CPU使用率 Top 10</span>
            </div>
            <div class="chart-container" ref="cpuChartRef"></div>
          </div>

          <div class="panel-box chart-box">
            <div class="panel-header">
              <el-icon class="panel-icon"><Memo /></el-icon>
              <span class="panel-title">内存使用率 Top 10</span>
            </div>
            <div class="chart-container" ref="memoryChartRef"></div>
          </div>
        </section>

        <section class="panel-box gpu-panel">
          <div class="panel-header">
            <el-icon class="panel-icon"><DataLine /></el-icon>
            <span class="panel-title">GPU资源概览</span>
          </div>
          <div class="gpu-summary-row">
            <div class="gpu-summary-item">
              <div class="gpu-summary-label">GPU主机</div>
              <div class="gpu-summary-value">{{ gpuSummary.hosts }}</div>
            </div>
            <div class="gpu-summary-item">
              <div class="gpu-summary-label">显卡总数</div>
              <div class="gpu-summary-value">{{ gpuSummary.devices }}</div>
            </div>
            <div class="gpu-summary-item">
              <div class="gpu-summary-label">平均显存</div>
              <div class="gpu-summary-value">{{ gpuSummary.avgMemory.toFixed(1) }}%</div>
            </div>
          </div>

          <div class="gpu-host-list" v-if="gpuHosts.length > 0">
            <div v-for="host in gpuHosts" :key="host.host_id" class="gpu-host-item">
              <div class="gpu-host-header">
                <div class="gpu-host-name">{{ host.hostname || host.host_id }}</div>
                <div class="gpu-host-count">{{ host.devices.length }} 张</div>
              </div>
              <div class="gpu-device-list">
                <div v-for="device in host.devices" :key="device.uuid || `${host.host_id}-${device.index}`" class="gpu-device-item">
                  <div class="gpu-device-title">
                    <span>{{ device.name || `GPU ${device.index}` }}</span>
                    <span>{{ (device.memory_used_percent || 0).toFixed(1) }}%</span>
                  </div>
                  <div class="gpu-memory-row">
                    <div class="gpu-memory-bar">
                      <div class="gpu-memory-fill" :style="{ width: Math.min(device.memory_used_percent || 0, 100) + '%' }"></div>
                    </div>
                    <div class="gpu-memory-text">{{ formatBytes(device.memory_used) }} / {{ formatBytes(device.memory_total) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-data">暂无GPU数据</div>
        </section>
      </main>

      <section class="bottom-grid">
        <div class="panel-box list-panel">
          <div class="panel-header">
            <el-icon class="panel-icon"><Bell /></el-icon>
            <span class="panel-title">实时告警</span>
          </div>
          <div class="alert-list" v-if="recentAlerts.length > 0">
            <div v-for="alert in recentAlerts" :key="alert.id" class="alert-item-row" :class="alert.severity">
              <el-icon class="alert-severity-icon">
                <component :is="getAlertSeverityIcon(alert.severity)" />
              </el-icon>
              <div class="alert-content">
                <div class="alert-rule">{{ alert.rule_name }}</div>
                <div class="alert-host">{{ alert.hostname }}</div>
                <div class="alert-time">{{ formatTime(alert.fired_at) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-data">暂无告警</div>
        </div>

        <div class="panel-box list-panel">
          <div class="panel-header">
            <el-icon class="panel-icon"><TrendCharts /></el-icon>
            <span class="panel-title">主机资源 Top 5</span>
          </div>
          <div class="host-resource-list" v-if="hostResources.length > 0">
            <div v-for="(host, index) in hostResources" :key="host.host_id" class="host-resource-item">
              <div class="resource-rank">{{ index + 1 }}</div>
              <div class="resource-info">
                <div class="host-name">
                  <el-icon class="host-icon"><Monitor /></el-icon>
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
          <div v-else class="empty-data">暂无数据</div>
        </div>

        <div class="panel-box list-panel">
          <div class="panel-header">
            <el-icon class="panel-icon"><Folder /></el-icon>
            <span class="panel-title">磁盘告警</span>
          </div>
          <div class="disk-alert-list" v-if="diskAlerts.length > 0">
            <div v-for="(alert, index) in diskAlerts" :key="alert.host_id + index" class="disk-alert-item">
              <div class="alert-rank">{{ index + 1 }}</div>
              <div class="alert-info">
                <div class="alert-host">
                  <el-icon class="host-icon"><Monitor /></el-icon>
                  <span>{{ alert.hostname || alert.host_id }}</span>
                </div>
                <div class="alert-mountpoint">{{ alert.mountpoint }}</div>
              </div>
              <div class="alert-usage" :class="getDiskAlertClass(alert.disk_usage)">
                {{ alert.disk_usage.toFixed(1) }}%
              </div>
            </div>
          </div>
          <div v-else class="empty-data">暂无数据</div>
        </div>
      </section>
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
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  Bell,
  CircleCloseFilled,
  Close,
  Cpu,
  DataLine,
  Folder,
  FullScreen,
  InfoFilled,
  Memo,
  Monitor,
  TrendCharts,
  WarningFilled
} from '@element-plus/icons-vue'
import { getOverview, getTopMetrics, getLatestMetrics } from '@/api/metrics'
import { getAlertHistory as fetchAlertHistoryAPI } from '@/api/alert'
import { axios } from '@/utils/request'

// 兼容 getAlertHistory 的导入命名
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
  avg_gpu: 0,
  gpu_devices: 0,
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
const gpuHosts = ref<any[]>([])
const streamData = ref<Array<{ label: string; value: string }>>([])

const cpuChartRef = ref<HTMLElement>()
const memoryChartRef = ref<HTMLElement>()
const bigScreenContainer = ref<HTMLElement>()
let cpuChart: echarts.ECharts | null = null
let memoryChart: echarts.ECharts | null = null
let refreshTimer: any = null
const isFullscreen = ref(false)

const gpuSummary = computed(() => {
  const devices = gpuHosts.value.flatMap((host: any) => host.devices || [])
  const avgMemory = devices.length > 0
    ? devices.reduce((sum: number, device: any) => sum + (device.memory_used_percent || 0), 0) / devices.length
    : 0
  return {
    hosts: gpuHosts.value.length,
    devices: devices.length,
    avgMemory
  }
})

const getAlertSeverityIcon = (severity: string) => {
  if (severity === 'critical') return CircleCloseFilled
  if (severity === 'warning') return WarningFilled
  return InfoFilled
}

// 格式化时间
const formatTime = (time: string) => {
  return dayjs(time).format('MM-DD HH:mm')
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`
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
    
    const cpuData = ((cpuRes as unknown as ApiResponse<any[]>).data || []).slice(0, 10)
    const memoryData = ((memoryRes as unknown as ApiResponse<any[]>).data || []).slice(0, 10)
    
    updateCPUChart(cpuData)
    updateMemoryChart(memoryData)
  } catch (error) {
    console.error('Failed to fetch top metrics:', error)
  }
}

// 获取主机资源
const fetchHostResources = async () => {
  try {
    // 获取主机列表
    const res = await axios.get('/v1/agents', { params: { page_size: 100 } }) as unknown as ApiResponse<any>
    
    if (res?.code === 200 && res?.data?.agents) {
      const agents = res.data.agents
      
      // 获取每台主机最新指标
      const resourcePromises = agents.map(async (agent: any) => {
        try {
          const metricsRes = await getLatestMetrics(agent.host_id) as unknown as ApiResponse<any>
          
          if (metricsRes?.data) {
            const data = metricsRes.data
            // 兼容不同字段命名格式
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
      
      // 按资源使用率排序取 Top 5
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

const fetchGPUHosts = async () => {
  try {
    const res = await axios.get('/v1/agents', { params: { page_size: 100 } }) as unknown as ApiResponse<any>
    if (res?.code !== 200 || !res?.data?.agents) {
      gpuHosts.value = []
      return
    }

    const hosts = await Promise.all(res.data.agents.map(async (agent: any) => {
      try {
        const metricsRes = await getLatestMetrics(agent.host_id) as unknown as ApiResponse<any>
        const devices = metricsRes?.data?.gpu?.devices || []
        if (!Array.isArray(devices) || devices.length === 0) return null
        return {
          host_id: agent.host_id,
          hostname: agent.hostname,
          devices: devices.map((device: any, index: number) => ({
            index: device.index ?? index,
            name: device.name || device.model || `GPU ${index}`,
            uuid: device.uuid || '',
            memory_total: Number(device.memory_total || 0),
            memory_used: Number(device.memory_used || 0),
            memory_used_percent: Number(device.memory_used_percent || 0)
          }))
        }
      } catch (error) {
        console.error(`Failed to fetch GPU metrics for ${agent.host_id}:`, error)
        return null
      }
    }))

    gpuHosts.value = hosts
      .filter((host: any) => host !== null)
      .sort((a: any, b: any) => b.devices.length - a.devices.length)
  } catch (error) {
    console.error('Failed to fetch GPU hosts:', error)
    gpuHosts.value = []
  }
}

// 获取磁盘告警
const fetchDiskAlerts = async () => {
  try {
    // 获取当前 firing 状态的告警
    const res = await getAlertHistory({ status: 'firing', limit: 100 }) as unknown as ApiResponse<any[]>
    
    if (res?.code === 200 && res?.data) {
      // 筛选磁盘告警
      const diskAlertsData = res.data.filter((alert: any) => {
        return alert.metric_type === 'disk' && alert.status === 'firing'
      })
      
      // 转换磁盘告警数据
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

// 更新底部数据流
const updateStreamData = () => {
  streamData.value = [
    { label: '总主机', value: overview.value.total_agents.toString() },
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

// 刷新数据
const refreshData = async () => {
  await Promise.all([
    fetchOverview(),
    fetchAlerts(),
    fetchTopMetrics(),
    fetchHostResources(),
    fetchGPUHosts(),
    fetchDiskAlerts()
  ])
  updateStreamData()
}

// 切换全屏
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
        alert('当前浏览器不支持全屏模式')
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
      alert('请先与页面交互后再尝试全屏')
    } else {
      alert('全屏操作失败: ' + error.message)
    }
  }
}

// 处理全屏状态变化
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
  
  // 全屏切换后重新计算图表尺寸
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
  
  // 更新时间
  setInterval(updateTime, 1000)
  
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
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

/* 全屏模式 */
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

/* 页面头部 */
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
  width: 40px;
  height: 40px;
  font-size: 40px;
  color: #00d4ff;
  filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.6));
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
  display: inline-flex;
}

.btn-text {
  font-size: 14px;
}

/* 全屏退出按钮 */
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
  display: inline-flex;
  min-width: 18px;
  flex-shrink: 0;
}

.exit-text {
  font-size: 14px;
  white-space: nowrap;
}

.kpi-strip {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 24px 0;
}

.kpi-card,
.panel-box {
  background: rgba(0, 212, 255, 0.06);
  border: 1px solid rgba(0, 212, 255, 0.28);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.08);
}

.kpi-card {
  min-width: 0;
  padding: 12px 14px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.kpi-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.62);
  white-space: nowrap;
}

.kpi-card strong {
  font-size: 24px;
  line-height: 1;
  white-space: nowrap;
}

.content-section {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: minmax(0, 1fr) 250px;
  gap: 14px;
  height: calc(100vh - 218px);
  padding: 14px 24px 64px;
  overflow: hidden;
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(560px, 1fr) minmax(360px, 42%);
  gap: 14px;
  min-height: 0;
}

.chart-stack {
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 14px;
  min-height: 0;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr 1fr;
  gap: 14px;
  min-height: 0;
}

.panel-box {
  min-width: 0;
  min-height: 0;
  padding: 13px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  flex-shrink: 0;
}

.panel-icon {
  font-size: 19px;
  color: #00d4ff;
  filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.5));
  flex-shrink: 0;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #00d4ff;
}

.highlight-blue,
.cpu-color {
  color: #00d4ff;
  text-shadow: 0 0 12px rgba(0, 212, 255, 0.45);
}

.highlight-green,
.memory-color {
  color: #00ff88;
  text-shadow: 0 0 12px rgba(0, 255, 136, 0.42);
}

.highlight-red {
  color: #ff4757;
  text-shadow: 0 0 12px rgba(255, 71, 87, 0.42);
}

.gpu-color {
  color: #ffa502;
  text-shadow: 0 0 12px rgba(255, 165, 2, 0.42);
}

.chart-box {
  flex: 1;
}

.chart-container {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.gpu-panel {
  border-color: rgba(255, 165, 2, 0.28);
}

.gpu-summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.gpu-summary-item {
  min-width: 0;
  padding: 9px;
  border-radius: 6px;
  background: rgba(255, 165, 2, 0.08);
  border: 1px solid rgba(255, 165, 2, 0.2);
}

.gpu-summary-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.62);
  margin-bottom: 5px;
}

.gpu-summary-value {
  font-size: 22px;
  line-height: 1;
  font-weight: 700;
  color: #ffa502;
}

.gpu-host-list,
.alert-list,
.host-resource-list,
.disk-alert-list {
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.gpu-host-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.gpu-host-item,
.host-resource-item,
.alert-item-row,
.disk-alert-item {
  border-radius: 6px;
  background: rgba(0, 212, 255, 0.055);
  border: 1px solid rgba(0, 212, 255, 0.12);
}

.gpu-host-item {
  padding: 10px;
}

.gpu-host-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.gpu-host-name,
.host-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.gpu-host-count {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 4px;
  color: #ffa502;
  background: rgba(255, 165, 2, 0.14);
  font-size: 11px;
}

.gpu-device-list {
  display: grid;
  gap: 7px;
}

.gpu-device-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.78);
}

.gpu-device-title span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gpu-device-title span:last-child {
  color: #ffa502;
  font-weight: 700;
}

.gpu-memory-row {
  display: grid;
  grid-template-columns: 1fr 96px;
  align-items: center;
  gap: 8px;
}

.gpu-memory-bar,
.resource-bar-wrapper {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
}

.gpu-memory-bar {
  height: 9px;
  border-radius: 3px;
}

.gpu-memory-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #ffa502, #ff6b35);
  box-shadow: 0 0 8px rgba(255, 165, 2, 0.45);
  transition: width 0.5s ease;
}

.gpu-memory-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.58);
  text-align: right;
  white-space: nowrap;
}

.list-panel {
  padding-bottom: 10px;
}

.alert-list,
.host-resource-list,
.disk-alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border-left: 3px solid #00d4ff;
}

.alert-item-row.critical { border-left-color: #ff4757; }
.alert-item-row.warning { border-left-color: #ffa502; }
.alert-item-row.info { border-left-color: #00d4ff; }

.alert-severity-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.alert-item-row.critical .alert-severity-icon { color: #ff4757; }
.alert-item-row.warning .alert-severity-icon { color: #ffa502; }
.alert-item-row.info .alert-severity-icon { color: #00d4ff; }

.alert-content,
.resource-info,
.alert-info {
  flex: 1;
  min-width: 0;
}

.alert-rule {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-host,
.alert-time,
.alert-mountpoint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
}

.host-resource-item {
  display: flex;
  gap: 10px;
  padding: 10px;
}

.resource-rank,
.alert-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}

.resource-rank {
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.18);
}

.alert-rank {
  color: #ffa502;
  background: rgba(255, 165, 2, 0.18);
}

.host-name,
.alert-host {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.host-icon {
  font-size: 12px;
  color: #00d4ff;
  flex-shrink: 0;
}

.resource-bars {
  display: grid;
  gap: 6px;
  margin-top: 8px;
}

.resource-bar-item {
  display: grid;
  grid-template-columns: 32px 1fr 50px;
  align-items: center;
  gap: 8px;
}

.bar-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.62);
}

.resource-bar-wrapper {
  height: 10px;
  border-radius: 3px;
}

.resource-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s;
}

.cpu-bar {
  background: linear-gradient(90deg, #00d4ff, #0099ff);
}

.memory-bar {
  background: linear-gradient(90deg, #00ff88, #00cc6a);
}

.bar-value,
.cpu-value,
.memory-value {
  font-size: 11px;
  font-weight: 700;
  text-align: right;
}

.cpu-value { color: #00d4ff; }
.memory-value { color: #00ff88; }

.disk-alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px;
  border-color: rgba(255, 165, 2, 0.14);
}

.alert-host span:last-child,
.alert-mountpoint {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-usage {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

.disk-critical {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.18);
}

.disk-warning {
  color: #ffa502;
  background: rgba(255, 165, 2, 0.18);
}

.disk-info {
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.18);
}

.empty-data {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  color: rgba(255, 255, 255, 0.48);
}

.gpu-host-list::-webkit-scrollbar,
.alert-list::-webkit-scrollbar,
.host-resource-list::-webkit-scrollbar,
.disk-alert-list::-webkit-scrollbar {
  width: 4px;
}

.gpu-host-list::-webkit-scrollbar-thumb,
.alert-list::-webkit-scrollbar-thumb,
.host-resource-list::-webkit-scrollbar-thumb,
.disk-alert-list::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.35);
  border-radius: 2px;
}

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
  .main-grid {
    grid-template-columns: minmax(500px, 1fr) minmax(340px, 40%);
  }

  .kpi-card strong {
    font-size: 21px;
  }
}

@media (max-width: 1400px) {
  .kpi-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .content-section {
    height: auto;
    min-height: calc(100vh - 218px);
    overflow: visible;
  }

  .main-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .chart-stack {
    min-height: 620px;
  }

  .gpu-panel {
    min-height: 420px;
  }
}

@media (max-width: 1200px) {
  .header-section {
    padding: 16px 20px;
  }

  .main-title {
    font-size: 28px;
  }

  .title-line {
    display: none;
  }

  .kpi-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 12px 16px 0;
  }

  .content-section {
    padding: 12px 16px 70px;
  }

  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>

