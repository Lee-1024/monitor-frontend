<template>
  <div class="crash-analysis-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>宕机分析</span>
          <el-select v-model="selectedHost" placeholder="选择主机" style="width: 200px" @change="handleHostChange">
            <el-option label="全部主机" value="" />
            <el-option
              v-for="agent in agents"
              :key="agent.host_id"
              :label="`${agent.hostname || agent.host_id} (${agent.host_id})`"
              :value="agent.host_id"
            />
          </el-select>
        </div>
      </template>

      <!-- 统计概览 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #f56c6c22">
              <el-icon :size="32" color="#f56c6c"><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ analysis.total_crashes }}</div>
              <div class="stat-label">总宕机次数</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #e6a23c22">
              <el-icon :size="32" color="#e6a23c"><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ analysis.avg_downtime }}</div>
              <div class="stat-label">平均宕机时长</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409eff22">
              <el-icon :size="32" color="#409eff"><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ analysis.crash_frequency }}</div>
              <div class="stat-label">宕机频率</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67c23a22">
              <el-icon :size="32" color="#67c23a"><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ resolvedCount }}</div>
              <div class="stat-label">已恢复</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 原因分析饼图 -->
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <template #header>主要宕机原因</template>
            <div ref="reasonChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <template #header>宕机趋势</template>
            <div ref="trendChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 宕机事件列表 -->
      <el-card shadow="never" style="margin-top: 20px">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <span>宕机事件记录</span>
            <div>
              <el-button
                type="danger"
                :disabled="selectedEventIds.length === 0"
                @click="handleBatchDelete"
                :loading="deleting"
              >
                批量删除 ({{ selectedEventIds.length }})
              </el-button>
            </div>
          </div>
        </template>
        <el-table
          :data="events"
          v-loading="loading"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="host_id" label="主机ID" width="150" />
          <el-table-column prop="hostname" label="主机名" width="150" />
          <el-table-column label="离线时间" width="180">
            <template #default="{ row }">
              {{ dayjs(row.offline_time).format('YYYY-MM-DD HH:mm:ss') }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.is_resolved ? 'success' : 'danger'">
                {{ row.is_resolved ? '已恢复' : '未恢复' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="持续时间" width="120">
            <template #default="{ row }">
              {{ formatDuration(row.duration) }}
            </template>
          </el-table-column>
          <el-table-column label="离线前状态" width="300">
            <template #default="{ row }">
              <el-tag size="small" style="margin-right: 5px">
                CPU: {{ row.last_cpu?.toFixed(1) }}%
              </el-tag>
              <el-tag size="small" type="warning" style="margin-right: 5px">
                内存: {{ row.last_memory?.toFixed(1) }}%
              </el-tag>
              <el-tag size="small" type="danger">
                磁盘: {{ row.last_disk?.toFixed(1) }}%
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="分析原因" min-width="250">
            <template #default="{ row }">
              <el-text :type="getReasonType(row.reason)">
                {{ row.reason }}
              </el-text>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 数据统计和分页 -->
        <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center">
          <div class="statistics-info">
            <span>共 <strong>{{ pagination.total }}</strong> 条记录，</span>
            <span>当前显示第 <strong>{{ pagination.page }}</strong> 页，</span>
            <span>每页 <strong>{{ pagination.pageSize }}</strong> 条</span>
            <span v-if="selectedEventIds.length > 0" style="margin-left: 15px; color: #409eff">
              （已选择 <strong>{{ selectedEventIds.length }}</strong> 条）
            </span>
          </div>
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="宕机事件详情" width="800px">
      <el-descriptions :column="2" border v-if="selectedEvent">
        <el-descriptions-item label="主机ID">{{ selectedEvent.host_id }}</el-descriptions-item>
        <el-descriptions-item label="主机名">{{ selectedEvent.hostname }}</el-descriptions-item>
        <el-descriptions-item label="离线时间">
          {{ dayjs(selectedEvent.offline_time).format('YYYY-MM-DD HH:mm:ss') }}
        </el-descriptions-item>
        <el-descriptions-item label="恢复时间">
          {{ selectedEvent.online_time ? dayjs(selectedEvent.online_time).format('YYYY-MM-DD HH:mm:ss') : '未恢复' }}
        </el-descriptions-item>
        <el-descriptions-item label="持续时间">
          {{ formatDuration(selectedEvent.duration) }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="selectedEvent.is_resolved ? 'success' : 'danger'">
            {{ selectedEvent.is_resolved ? '已恢复' : '未恢复' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="CPU使用率">
          <el-progress :percentage="selectedEvent.last_cpu" :color="getProgressColor(selectedEvent.last_cpu)" />
        </el-descriptions-item>
        <el-descriptions-item label="内存使用率">
          <el-progress :percentage="selectedEvent.last_memory" :color="getProgressColor(selectedEvent.last_memory)" />
        </el-descriptions-item>
        <el-descriptions-item label="磁盘使用率" :span="2">
          <el-progress :percentage="selectedEvent.last_disk" :color="getProgressColor(selectedEvent.last_disk)" />
        </el-descriptions-item>
        <el-descriptions-item label="分析原因" :span="2">
          {{ selectedEvent.reason }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning, Clock, TrendCharts, CircleCheck } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { axios } from '@/utils/request'
import type { Agent, ApiResponse, PaginatedResponse } from '@/types'
 
interface CrashEvent {
  id?: number
  host_id: string
  hostname: string
  offline_time: string
  online_time?: string
  duration: number
  is_resolved: boolean
  last_cpu: number
  last_memory: number
  last_disk: number
  reason: string
}

const loading = ref(false)
const selectedHost = ref('')
const agents = ref<Agent[]>([])
interface CrashAnalysisData {
  total_crashes: number
  resolved_count?: number  // 已恢复数量（从后端返回）
  crash_frequency: string
  main_reasons: Record<string, number>
  avg_downtime: string
  recent_crashes: CrashEvent[]
}
const analysis = ref<CrashAnalysisData>({
  total_crashes: 0,
  resolved_count: 0,
  crash_frequency: '暂无数据',
  main_reasons: {},
  avg_downtime: '0分钟',
  recent_crashes: []
})
const events = ref<CrashEvent[]>([])
const detailVisible = ref(false)
const selectedEvent = ref<CrashEvent | null>(null)
const selectedEventIds = ref<number[]>([])
const deleting = ref(false)

// 分页相关
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const reasonChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
let reasonChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

// 已恢复数量：优先使用后端返回的数据，否则从前端events计算
const resolvedCount = computed(() => {
  // 如果后端返回了resolved_count，使用后端数据
  if (analysis.value.resolved_count !== undefined) {
    return analysis.value.resolved_count
  }
  // 否则从前端events计算
  return events.value.filter((e: any) => e.is_resolved).length
})

// 加载Agent列表
const loadAgents = async () => {
  try {
    const res = await axios.get('/v1/agents', { params: { page: 1, page_size: 100 } }) as unknown as ApiResponse<PaginatedResponse<Agent>>
    agents.value = res.data?.agents || []
  } catch (error) {
    console.error('Failed to load agents:', error)
  }
}

// 加载宕机分析
const loadAnalysis = async () => {
  try {
    loading.value = true
    
    // 获取宕机事件（使用分页）
    const eventsRes = await axios.get('/v1/crash/events', {
      params: {
        host_id: selectedHost.value,
        page: pagination.value.page,
        page_size: pagination.value.pageSize
      }
    }) as unknown as ApiResponse<{ events: CrashEvent[], total: number, page: number, page_size: number }>
    
    // 处理分页响应
    if (eventsRes.data && typeof eventsRes.data === 'object' && 'events' in eventsRes.data) {
      // 分页模式
      events.value = eventsRes.data.events || []
      pagination.value.total = eventsRes.data.total || 0
      pagination.value.page = eventsRes.data.page || 1
      pagination.value.pageSize = eventsRes.data.page_size || 20
    } else {
      // 兼容旧的非分页模式
      events.value = (eventsRes.data as any) || []
      pagination.value.total = events.value.length
    }
    
    // 如果选择了特定主机，获取分析数据
    if (selectedHost.value) {
      const analysisRes = await axios.get(`/v1/crash/analysis/${selectedHost.value}`) as unknown as ApiResponse<CrashAnalysisData>
      if (analysisRes.data) {
        analysis.value = analysisRes.data
        // 确保resolved_count被设置
        if (analysis.value.resolved_count === undefined) {
          analysis.value.resolved_count = events.value.filter((e: any) => e.is_resolved).length
        }
        console.log('Analysis data from backend:', analysis.value)
      }
    } else {
      // 否则基于事件列表生成统计（注意：这里只统计当前页的数据，如果需要全局统计需要额外API）
      const resolved = events.value.filter((e: any) => e.is_resolved).length
      analysis.value = {
        total_crashes: pagination.value.total, // 使用总数而不是当前页数量
        resolved_count: resolved,
        crash_frequency: calculateFrequency(events.value),
        main_reasons: analyzeReasons(events.value),
        avg_downtime: calculateAvgDowntime(events.value),
        recent_crashes: events.value
      }
      console.log('Analysis data calculated locally:', {
        total: pagination.value.total,
        resolved: resolved,
        events: events.value.map((e: any) => ({ id: e.id, is_resolved: e.is_resolved }))
      })
    }
    
    // 更新图表
    updateCharts()
  } catch (error) {
    ElMessage.error('加载失败')
    console.error('Failed to load crash analysis:', error)
  } finally {
    loading.value = false
  }
}

// 主机选择改变
const handleHostChange = () => {
  pagination.value.page = 1 // 重置到第一页
  selectedEventIds.value = [] // 清空选择
  loadAnalysis()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1 // 重置到第一页
  loadAnalysis()
}

// 页码改变
const handlePageChange = (page: number) => {
  pagination.value.page = page
  loadAnalysis()
}

// 初始化图表
const initCharts = () => {
  if (reasonChartRef.value) {
    reasonChart = echarts.init(reasonChartRef.value)
  }
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
}

// 更新图表
const updateCharts = () => {
  // 原因饼图
  if (reasonChart && analysis.value.main_reasons) {
    const data = Object.entries(analysis.value.main_reasons).map(([name, value]) => ({
      name,
      value
    }))
    
    reasonChart.setOption({
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        left: 'right'
      },
      series: [
        {
          name: '宕机原因',
          type: 'pie',
          radius: '70%',
          data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    })
  }
  
  // 趋势图
  if (trendChart && events.value.length > 0) {
    // 按天统计宕机次数
    const dayCount: Record<string, number> = {}
    events.value.forEach((event: any) => {
      const day = dayjs(event.offline_time).format('MM-DD')
      dayCount[day] = (dayCount[day] || 0) + 1
    })
    
    const days = Object.keys(dayCount).sort()
    const counts = days.map(day => dayCount[day])
    
    trendChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: days
      },
      yAxis: {
        type: 'value',
        name: '次数'
      },
      series: [
        {
          name: '宕机次数',
          type: 'line',
          data: counts,
          smooth: true,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 108, 108, 0.5)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.1)' }
            ])
          },
          itemStyle: {
            color: '#f56c6c'
          }
        }
      ]
    })
  }
}

// 辅助函数
const formatDuration = (seconds: number) => {
  if (!seconds) return '未恢复'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  return `${hours}小时${minutes % 60}分钟`
}

const getReasonType = (reason: string) => {
  if (reason.includes('CPU')) return 'danger'
  if (reason.includes('内存')) return 'warning'
  if (reason.includes('磁盘')) return 'danger'
  return 'info'
}

const getProgressColor = (value: number) => {
  if (value > 90) return '#f56c6c'
  if (value > 75) return '#e6a23c'
  return '#67c23a'
}

const viewDetail = async (row: any) => {
  if (row.id) {
    try {
      loading.value = true
      const res = await axios.get(`/v1/crash/events/${row.id}`) as unknown as ApiResponse<CrashEvent>
      selectedEvent.value = res.data
      detailVisible.value = true
    } catch (error) {
      ElMessage.error('获取详情失败')
      console.error('Failed to get crash event detail:', error)
    } finally {
      loading.value = false
    }
  } else {
    // 如果没有 id，直接使用当前行数据
    selectedEvent.value = row
    detailVisible.value = true
  }
}

const calculateFrequency = (events: any[]) => {
  if (events.length === 0) return '无宕机记录'
  if (events.length === 1) return '仅有1次宕机'
  
  const first = events[events.length - 1].offline_time
  const last = events[0].offline_time
  const days = dayjs(last).diff(dayjs(first), 'day')
  
  if (days < 1) return `1天内宕机${events.length}次`
  const freq = events.length / days
  return `平均每天宕机${freq.toFixed(1)}次`
}

const analyzeReasons = (events: any[]) => {
  const reasons: Record<string, number> = {}
  events.forEach((event: any) => {
    if (event.last_cpu > 90) reasons['CPU过高'] = (reasons['CPU过高'] || 0) + 1
    if (event.last_memory > 95) reasons['内存不足'] = (reasons['内存不足'] || 0) + 1
    if (event.last_disk > 95) reasons['磁盘满'] = (reasons['磁盘满'] || 0) + 1
    if (event.last_cpu < 90 && event.last_memory < 95 && event.last_disk < 95) {
      reasons['网络/其他'] = (reasons['网络/其他'] || 0) + 1
    }
  })
  return reasons
}

const calculateAvgDowntime = (events: any[]) => {
  const resolved = events.filter((e: any) => e.is_resolved)
  if (resolved.length === 0) return '暂无恢复记录'
  
  const total = resolved.reduce((sum: number, e: any) => sum + e.duration, 0)
  const avg = total / resolved.length
  return formatDuration(avg)
}

// 处理选择变化
const handleSelectionChange = (selection: CrashEvent[]) => {
  selectedEventIds.value = selection.map((item) => item.id!).filter((id): id is number => id !== undefined)
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedEventIds.value.length === 0) {
    ElMessage.warning('请选择要删除的事件')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedEventIds.value.length} 条宕机事件记录吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    deleting.value = true
    const res = await axios.delete('/v1/crash/events', {
      data: { ids: selectedEventIds.value }
    }) as unknown as ApiResponse<{ deleted_count: number }>

    ElMessage.success(`成功删除 ${res.data?.deleted_count || selectedEventIds.value.length} 条记录`)
    
    // 清空选择
    selectedEventIds.value = []
    
    // 重新加载数据（如果当前页没有数据了，回到上一页）
    const currentPage = pagination.value.page
    await loadAnalysis()
    
    // 如果删除后当前页没有数据且不是第一页，回到上一页
    if (events.value.length === 0 && currentPage > 1) {
      pagination.value.page = currentPage - 1
      await loadAnalysis()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message || '未知错误'))
      console.error('Failed to delete crash events:', error)
    }
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadAgents()
  loadAnalysis()
  initCharts()
  
  window.addEventListener('resize', () => {
    reasonChart?.resize()
    trendChart?.resize()
  })
})
</script>

<style scoped>
.crash-analysis-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.statistics-info {
  font-size: 14px;
  color: #606266;
}

.statistics-info strong {
  color: #303133;
  font-weight: 600;
}
</style>
