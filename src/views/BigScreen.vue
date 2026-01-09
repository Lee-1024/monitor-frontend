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
        <div class="panel-box">
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
        <div class="panel-box">
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
        <div class="panel-box">
          <div class="panel-header">
            <span class="panel-icon">📊</span>
            <span class="panel-title">系统指标</span>
          </div>
          <div class="panel-content">
            <div class="metric-item">
              <div class="metric-label">平均CPU</div>
              <div class="metric-progress">
                <div class="progress-bar" :style="{ width: (overview.avg_cpu || 0) + '%' }"></div>
                <span class="progress-text">{{ (overview.avg_cpu || 0).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">平均内存</div>
              <div class="metric-progress">
                <div class="progress-bar memory" :style="{ width: (overview.avg_memory || 0) + '%' }"></div>
                <span class="progress-text">{{ (overview.avg_memory || 0).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
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
        <div class="panel-box">
          <div class="panel-header">
            <span class="panel-icon">⚠️</span>
            <span class="panel-title">实时告警</span>
          </div>
          <div class="panel-content alert-list">
            <div v-if="recentAlerts.length === 0" class="empty-alert">暂无告警</div>
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
        </div>

        <!-- Top进程 -->
        <div class="panel-box">
          <div class="panel-header">
            <span class="panel-icon">⚙️</span>
            <span class="panel-title">Top进程</span>
          </div>
          <div class="panel-content process-list">
            <div v-if="topProcesses.length === 0" class="empty-process">暂无数据</div>
            <div
              v-for="(process, index) in topProcesses"
              :key="index"
              class="process-item"
            >
              <div class="process-rank">{{ index + 1 }}</div>
              <div class="process-name">{{ process.name || '未知' }}</div>
              <div class="process-cpu">{{ (process.cpu || 0).toFixed(1) }}%</div>
            </div>
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
import { getOverview, getTopMetrics } from '@/api/metrics'
import { getAlertHistory } from '@/api/alert'
import { axios } from '@/utils/request'
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
const topProcesses = ref<any[]>([])
const streamData = ref<Array<{ label: string; value: string }>>([])

const cpuChartRef = ref<HTMLElement>()
const memoryChartRef = ref<HTMLElement>()
const bigScreenContainer = ref<HTMLElement>()
let cpuChart: echarts.ECharts | null = null
let memoryChart: echarts.ECharts | null = null
let refreshTimer: any = null
const isFullscreen = ref(false)

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

// 获取Top进程
const fetchTopProcesses = async () => {
  try {
    const res = await axios.get('/v1/processes', { params: { limit: 100 } }) as unknown as ApiResponse<any[]>
    if (res?.code === 200 && res?.data) {
      // 按CPU使用率排序
      const processes = res.data
        .filter((p: any) => p.cpu_percent !== undefined)
        .sort((a: any, b: any) => (b.cpu_percent || 0) - (a.cpu_percent || 0))
        .slice(0, 10)
        .map((p: any) => ({
          name: p.name || p.command || '未知',
          cpu: p.cpu_percent || 0
        }))
      topProcesses.value = processes
    }
  } catch (error) {
    console.error('Failed to fetch top processes:', error)
    topProcesses.value = []
  }
}

// 更新CPU图表
const updateCPUChart = (data: any[]) => {
  if (!cpuChart || !cpuChartRef.value) return
  
  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: '10%',
      right: '10%',
      top: '15%',
      bottom: '10%'
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
      data: data.map((item: any) => item.value || 0).reverse(),
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
        formatter: '{c}%'
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
      left: '10%',
      right: '10%',
      top: '15%',
      bottom: '10%'
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
      data: data.map((item: any) => item.value || 0).reverse(),
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
        formatter: '{c}%'
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
    fetchTopProcesses()
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
  
  // 移除全屏监听
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
  grid-template-columns: 300px 1fr 350px;
  gap: 20px;
  padding: 20px;
  min-height: calc(100vh - 120px);
}

/* 面板样式 */
.panel-box {
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.1);
  transition: all 0.3s;
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
}

/* 统计项 */
.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
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
  gap: 15px;
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

/* 指标项 */
.metric-item {
  margin-bottom: 20px;
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
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.1);
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
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
  height: 300px;
}

/* 告警列表 */
.alert-list {
  max-height: 400px;
  overflow-y: auto;
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

/* 进程列表 */
.process-list {
  max-height: 300px;
  overflow-y: auto;
}

.process-list::-webkit-scrollbar {
  width: 4px;
}

.process-list::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.3);
  border-radius: 2px;
}

.empty-process {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 20px;
}

.process-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 4px;
  background: rgba(0, 212, 255, 0.05);
  transition: all 0.3s;
}

.process-item:hover {
  background: rgba(0, 212, 255, 0.1);
}

.process-rank {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 212, 255, 0.2);
  border-radius: 4px;
  font-weight: bold;
  color: #00d4ff;
}

.process-name {
  flex: 1;
  font-size: 14px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.process-cpu {
  font-size: 14px;
  font-weight: bold;
  color: #00ff88;
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
    grid-template-columns: 280px 1fr 320px;
  }
}

@media (max-width: 1200px) {
  .content-section {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
  
  .left-panel,
  .right-panel {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }
}
</style>

