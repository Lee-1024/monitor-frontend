<template>
  <div class="logs-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>日志查看</span>
          <div class="header-actions">
            <el-select v-model="selectedHost" placeholder="选择主机" style="width: 200px" @change="loadLogs">
              <el-option label="全部主机" value="" />
              <el-option
                v-for="agent in agents"
                :key="agent.host_id"
                :label="`${agent.hostname || agent.host_id} (${agent.host_id})`"
                :value="agent.host_id"
              />
            </el-select>
            <el-select v-model="selectedLevel" placeholder="日志级别" style="width: 150px; margin-left: 10px" @change="loadLogs">
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
    const params: any = { limit: 200 }
    if (selectedHost.value) {
      params.host_id = selectedHost.value
    }
    if (selectedLevel.value) {
      params.level = selectedLevel.value
    }
    
    const res = await axios.get('/v1/logs', { params }) as unknown as ApiResponse<LogInfo[]>
    logs.value = res.data || []
  } catch (error) {
    ElMessage.error('加载日志失败')
  } finally {
    loading.value = false
  }
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
</style>

