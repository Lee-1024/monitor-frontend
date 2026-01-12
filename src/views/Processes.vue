<template>
  <div class="processes-container">
    <!-- 进程历史趋势图表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>进程使用趋势（前10名）</span>
          <div class="header-actions">
            <el-radio-group v-model="chartMetricType" @change="debouncedLoadProcessHistory">
              <el-radio-button label="cpu">CPU使用率</el-radio-button>
              <el-radio-button label="memory">内存使用率</el-radio-button>
            </el-radio-group>
            <el-select v-model="chartTimeRange" style="width: 150px; margin-left: 10px" @change="debouncedLoadProcessHistory">
              <el-option label="最近1小时" value="1h" />
              <el-option label="最近3小时" value="3h" />
              <el-option label="最近6小时" value="6h" />
              <el-option label="最近12小时" value="12h" />
              <el-option label="最近24小时" value="24h" />
            </el-select>
            <el-button type="primary" @click="loadProcessHistory" style="margin-left: 10px">
              <el-icon><Refresh /></el-icon>
              刷新图表
            </el-button>
          </div>
        </div>
      </template>
      <ProcessHistoryChart
        :data="processHistoryData"
        :loading="historyLoading"
        :metric-type="chartMetricType"
      />
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>进程监控</span>
          <div class="header-actions">
            <el-select v-model="selectedHost" placeholder="选择主机" style="width: 200px" @change="debouncedLoadProcesses">
              <el-option label="全部主机" value="" />
              <el-option
                v-for="agent in agents"
                :key="agent.host_id"
                :label="`${agent.hostname || agent.host_id} (${agent.host_id})`"
                :value="agent.host_id"
              />
            </el-select>
            <el-select v-model="sortBy" placeholder="排序方式" style="width: 150px; margin-left: 10px" @change="applySort">
              <el-option label="默认" value="" />
              <el-option label="CPU占用降序" value="cpu_desc" />
              <el-option label="CPU占用升序" value="cpu_asc" />
              <el-option label="内存占用降序" value="memory_desc" />
              <el-option label="内存占用升序" value="memory_asc" />
            </el-select>
            <el-button type="primary" @click="loadProcesses" style="margin-left: 10px">
              <el-icon><Refresh /></el-icon>
              刷新列表
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="sortedProcesses"
        stripe
        style="width: 100%"
        empty-text="暂无数据"
      >
        <el-table-column prop="host_id" label="主机ID" width="150" />
        <el-table-column prop="pid" label="PID" width="80" />
        <el-table-column prop="name" label="进程名" width="200" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column label="CPU%" width="100" sortable>
          <template #default="{ row }">
            <el-progress
              :percentage="Math.min(row.cpu_percent, 100)"
              :color="getProgressColor(row.cpu_percent)"
              :format="() => row.cpu_percent.toFixed(1) + '%'"
            />
          </template>
        </el-table-column>
        <el-table-column label="内存%" width="100" sortable>
          <template #default="{ row }">
            <el-progress
              :percentage="Math.min(row.memory_percent, 100)"
              :color="getProgressColor(row.memory_percent)"
              :format="() => row.memory_percent.toFixed(1) + '%'"
            />
          </template>
        </el-table-column>
        <el-table-column label="内存使用" width="120" sortable>
          <template #default="{ row }">
            {{ formatBytes(row.memory_bytes) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)"
              :style="getStatusType(row.status) === 'info' ? { backgroundColor: '#409EFF', borderColor: '#409EFF', color: '#fff' } : {}"
            >
              {{ row.status || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="采集时间" width="180">
          <template #default="{ row }">
            {{ dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>
        <el-table-column label="命令" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <el-text truncated style="max-width: 300px">
              {{ row.command }}
            </el-text>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { axios } from '@/utils/request'
import type { Agent, ApiResponse } from '@/types'
import ProcessHistoryChart from '@/components/ProcessHistoryChart.vue'

// 防抖工具函数
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }) as T
}

interface ProcessInfo {
  id: number
  host_id: string
  timestamp: string
  pid: number
  name: string
  user: string
  cpu_percent: number
  memory_percent: number
  memory_bytes: number
  status: string
  command: string
}

const loading = ref(false)
const selectedHost = ref('')
const sortBy = ref('cpu_desc') // 默认按CPU占用降序排序
const agents = ref<Agent[]>([])
const processes = ref<ProcessInfo[]>([])

// 图表相关
const historyLoading = ref(false)
const processHistoryData = ref<Array<{
  timestamp: string
  process_name: string
  cpu_percent: number
  memory_percent: number
}>>([])
const chartMetricType = ref<'cpu' | 'memory'>('cpu')
const chartTimeRange = ref('1h')

// 用于控制错误提示频率，避免频繁提示
let lastEmptyWarningTime = 0 // 空数据提示时间
let lastErrorWarningTime = 0 // 错误提示时间
const WARNING_INTERVAL = 3000 // 3秒内不重复提示

// 排序后的进程列表
const sortedProcesses = computed(() => {
  if (!sortBy.value) {
    return processes.value
  }
  
  const sorted = [...processes.value]
  
  switch (sortBy.value) {
    case 'cpu_desc':
      return sorted.sort((a, b) => b.cpu_percent - a.cpu_percent)
    case 'cpu_asc':
      return sorted.sort((a, b) => a.cpu_percent - b.cpu_percent)
    case 'memory_desc':
      return sorted.sort((a, b) => b.memory_percent - a.memory_percent)
    case 'memory_asc':
      return sorted.sort((a, b) => a.memory_percent - b.memory_percent)
    default:
      return sorted
  }
})

// 应用排序
const applySort = () => {
  // sortedProcesses是computed，会自动更新
}

const loadAgents = async () => {
  try {
    const res = await axios.get('/v1/agents', { params: { page: 1, page_size: 100 } }) as unknown as ApiResponse<{ agents: Agent[] }>
    agents.value = res.data?.agents || []
  } catch (error) {
    console.error('Failed to load agents:', error)
  }
}

const loadProcesses = async () => {
  // 防止重复请求
  if (loading.value) {
    return
  }
  
  try {
    loading.value = true
    const params: any = { limit: 100 }
    if (selectedHost.value) {
      params.host_id = selectedHost.value
    }
    
    console.log('Loading processes with params:', params)
    const res = await axios.get('/v1/processes', { params }) as unknown as ApiResponse<ProcessInfo[]>
    console.log('Processes API response:', res)
    
    if (res && res.data) {
      processes.value = res.data
      console.log(`Loaded ${res.data.length} active processes`)
      // 只有在数据为空且距离上次提示超过3秒时才提示
      if (res.data.length === 0) {
        const now = Date.now()
        if (now - lastEmptyWarningTime > WARNING_INTERVAL) {
          ElMessage.warning('暂无活跃进程数据，请确认Agent是否正在运行并上报数据')
          lastEmptyWarningTime = now
        }
      }
      // 进程列表和历史数据独立，历史数据由用户手动刷新图表
    } else {
      processes.value = []
      console.warn('No process data in response')
    }
  } catch (error: any) {
    console.error('Failed to load processes:', error)
    // 错误提示也做防抖处理，使用独立的时间戳
    const now = Date.now()
    if (now - lastErrorWarningTime > WARNING_INTERVAL) {
      ElMessage.error('加载进程列表失败: ' + (error.response?.data?.message || error.message))
      lastErrorWarningTime = now
    }
  } finally {
    loading.value = false
  }
}

// 使用防抖包装loadProcesses，避免频繁触发
const debouncedLoadProcesses = debounce(loadProcesses, 300)

// 注意：debouncedLoadProcessHistory 必须在 loadProcessHistory 函数定义之后创建

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

const getProgressColor = (value: number) => {
  if (value > 90) return '#f56c6c'
  if (value > 75) return '#e6a23c'
  return '#67c23a'
}

const getStatusType = (status: string) => {
  if (!status) {
    return 'info' // 默认蓝色
  }
  
  // 转换为字符串并去除空格
  const statusStr = String(status).trim()
  const statusLower = statusStr.toLowerCase()
  const statusUpper = statusStr.toUpperCase()
  
  // 调试日志（仅在开发环境）
  if (process.env.NODE_ENV === 'development' && statusLower === 'sleep') {
    console.log('Sleep status detected:', { status, statusStr, statusLower, statusUpper })
  }
  
  // Running状态 - 绿色
  if (statusUpper === 'R' || statusLower === 'running' || statusUpper.includes('RUNNING')) {
    return 'success'
  }
  
  // Sleep状态 - 蓝色（优先检查小写，因为实际数据是小写 "sleep"）
  // 检查顺序：先检查精确匹配，再检查包含
  if (statusLower === 'sleep' || 
      statusStr === 'sleep' ||
      statusStr === 'Sleep' ||
      statusStr === 'SLEEP' ||
      statusUpper === 'S' || 
      statusUpper === 'SLEEP' || 
      statusUpper.includes('SLEEP')) {
    return 'info'
  }
  
  // Zombie状态 - 红色
  if (statusUpper === 'Z' || statusLower === 'zombie' || statusUpper.includes('ZOMBIE')) {
    return 'danger'
  }
  
  // Disk Sleep状态 - 黄色
  if (statusUpper === 'D' || statusLower.includes('disk') || statusUpper.includes('DISK')) {
    return 'warning'
  }
  
  // Stopped状态 - 灰色
  if (statusUpper === 'T' || statusLower === 'stopped' || statusLower.includes('stop')) {
    return ''
  }
  
  // 默认蓝色
  return 'info'
}

// 加载进程历史数据（从历史数据中查找CPU/内存占用最高的前10个进程）
const loadProcessHistory = async () => {
  // 防止重复请求
  if (historyLoading.value) {
    return
  }
  
  try {
    historyLoading.value = true
    
    // 计算时间范围
    const hours = parseInt(chartTimeRange.value.replace('h', ''))
    const end = dayjs()
    const start = end.subtract(hours, 'hour')
    
    // 不传 process_names，让后端自动从历史数据中查找CPU/内存占用最高的前10个进程
    const params: any = {
      metric_type: chartMetricType.value, // cpu 或 memory
      top_n: 10, // 前10个进程
      start: start.toISOString(),
      end: end.toISOString(),
      limit: 5000
    }
    
    if (selectedHost.value) {
      params.host_id = selectedHost.value
    }
    
    console.log('Loading top process history by', chartMetricType.value, 'for time range:', start.format('YYYY-MM-DD HH:mm:ss'), 'to', end.format('YYYY-MM-DD HH:mm:ss'))
    const res = await axios.get('/v1/processes/history', { params }) as unknown as ApiResponse<Array<{
      timestamp: string
      process_name: string
      cpu_percent: number
      memory_percent: number
      memory_bytes: number
    }>>
    
    if (res && res.data) {
      processHistoryData.value = res.data
      if (res.data.length === 0) {
        ElMessage.warning('暂无历史数据')
      } else {
        // 统计返回的进程名
        const processNames = new Set(res.data.map(d => d.process_name))
        console.log(`Loaded ${res.data.length} history records for ${processNames.size} top processes:`, Array.from(processNames))
      }
    } else {
      processHistoryData.value = []
    }
  } catch (error: any) {
    console.error('Failed to load process history:', error)
    ElMessage.error('加载进程历史数据失败: ' + (error.response?.data?.message || error.message))
    processHistoryData.value = []
  } finally {
    historyLoading.value = false
  }
}

// 使用防抖包装loadProcessHistory，避免频繁触发（必须在loadProcessHistory定义之后）
const debouncedLoadProcessHistory = debounce(loadProcessHistory, 300)

onMounted(() => {
  loadAgents()
  loadProcesses()
  // 加载历史数据（基于历史数据中的top进程）
  loadProcessHistory()
})
</script>

<style scoped>
.processes-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
}
</style>

