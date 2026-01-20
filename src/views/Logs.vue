<template>
  <div class="logs-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>日志查看</span>
          <div class="header-actions">
            <el-select v-model="selectedHost" placeholder="选择主机" style="width: 200px" @change="handleHostChange">
              <el-option label="全部主机" value="" />
              <el-option
                v-for="agent in agents"
                :key="agent.host_id"
                :label="`${agent.hostname || agent.host_id} (${agent.host_id})`"
                :value="agent.host_id"
              />
            </el-select>
            <el-select v-model="selectedLevel" placeholder="日志级别" style="width: 150px; margin-left: 10px" @change="handleLevelChange">
              <el-option label="全部级别" value="" />
              <el-option label="ERROR" value="ERROR" />
              <el-option label="WARN" value="WARN" />
              <el-option label="INFO" value="INFO" />
              <el-option label="DEBUG" value="DEBUG" />
            </el-select>
            <el-button type="primary" @click="loadLogs" style="margin-left: 10px">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="logs"
        stripe
        style="width: 100%"
        empty-text="暂无数据"
      >
        <el-table-column prop="host_id" label="主机ID" width="150" />
        <el-table-column prop="source" label="来源" width="200" />
        <el-table-column prop="level" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>
        <el-table-column prop="message" label="日志内容" min-width="400" show-overflow-tooltip>
          <template #default="{ row }">
            <el-text :type="getLevelType(row.level)">
              {{ row.message }}
            </el-text>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 数据统计和分页 -->
      <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center">
        <div class="statistics-info">
          <span>共 <strong>{{ pagination.total }}</strong> 条记录，</span>
          <span>当前显示第 <strong>{{ pagination.page }}</strong> 页，</span>
          <span>每页 <strong>{{ pagination.pageSize }}</strong> 条</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { axios } from '@/utils/request'
import type { Agent, ApiResponse } from '@/types'

interface LogInfo {
  id: number
  host_id: string
  timestamp: string
  source: string
  level: string
  message: string
  tags: Record<string, string>
}

const loading = ref(false)
const selectedHost = ref('')
const selectedLevel = ref('')
const agents = ref<Agent[]>([])
const logs = ref<LogInfo[]>([])

// 分页相关
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const loadAgents = async () => {
  try {
    const res = await axios.get('/v1/agents', { params: { page: 1, page_size: 100 } }) as unknown as ApiResponse<{ agents: Agent[] }>
    agents.value = res.data?.agents || []
  } catch (error) {
    console.error('Failed to load agents:', error)
  }
}

const loadLogs = async () => {
  try {
    loading.value = true
    const params: any = {
      page: pagination.value.page,
      page_size: pagination.value.pageSize
    }
    if (selectedHost.value) {
      params.host_id = selectedHost.value
    }
    if (selectedLevel.value) {
      params.level = selectedLevel.value
    }
    
    const res = await axios.get('/v1/logs', { params }) as unknown as ApiResponse<{ logs: LogInfo[], total: number, page: number, page_size: number }>
    
    // 处理分页响应
    if (res.data && typeof res.data === 'object' && 'logs' in res.data) {
      // 分页模式
      logs.value = res.data.logs || []
      pagination.value.total = res.data.total || 0
      pagination.value.page = res.data.page || 1
      pagination.value.pageSize = res.data.page_size || 20
    } else {
      // 兼容旧的非分页模式
      logs.value = (res.data as any) || []
      pagination.value.total = logs.value.length
    }
  } catch (error) {
    ElMessage.error('加载日志失败')
    console.error('Failed to load logs:', error)
  } finally {
    loading.value = false
  }
}

// 主机选择改变
const handleHostChange = () => {
  pagination.value.page = 1 // 重置到第一页
  loadLogs()
}

// 日志级别改变
const handleLevelChange = () => {
  pagination.value.page = 1 // 重置到第一页
  loadLogs()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1 // 重置到第一页
  loadLogs()
}

// 页码改变
const handlePageChange = (page: number) => {
  pagination.value.page = page
  loadLogs()
}

const getLevelType = (level: string) => {
  switch (level) {
    case 'ERROR':
      return 'danger'
    case 'WARN':
      return 'warning'
    case 'INFO':
      return 'info'
    case 'DEBUG':
      return ''
    default:
      return 'info'
  }
}

onMounted(() => {
  loadAgents()
  loadLogs()
})
</script>

<style scoped>
.logs-container {
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

.statistics-info {
  font-size: 14px;
  color: #606266;
}

.statistics-info strong {
  color: #303133;
  font-weight: 600;
}
</style>

