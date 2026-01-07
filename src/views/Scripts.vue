<template>
  <div class="scripts-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>脚本执行记录</span>
          <div class="header-actions">
            <el-select v-model="selectedHost" placeholder="选择主机" style="width: 200px" @change="loadExecutions">
              <el-option label="全部主机" value="" />
              <el-option
                v-for="agent in agents"
                :key="agent.host_id"
                :label="`${agent.hostname || agent.host_id} (${agent.host_id})`"
                :value="agent.host_id"
              />
            </el-select>
            <el-input
              v-model="scriptIdFilter"
              placeholder="脚本ID"
              style="width: 150px; margin-left: 10px"
              clearable
              @clear="loadExecutions"
              @keyup.enter="loadExecutions"
            />
            <el-button type="primary" @click="loadExecutions" style="margin-left: 10px">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="executions"
        stripe
        style="width: 100%"
        empty-text="暂无数据"
      >
        <el-table-column prop="host_id" label="主机ID" width="150" />
        <el-table-column prop="script_id" label="脚本ID" width="150" />
        <el-table-column prop="script_name" label="脚本名称" width="200" />
        <el-table-column label="执行时间" width="180">
          <template #default="{ row }">
            {{ dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'">
              {{ row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="exit_code" label="退出码" width="100" />
        <el-table-column label="耗时" width="120">
          <template #default="{ row }">
            {{ row.duration_ms }}ms
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="脚本执行详情" width="800px">
      <el-descriptions :column="2" border v-if="selectedExecution">
        <el-descriptions-item label="主机ID">{{ selectedExecution.host_id }}</el-descriptions-item>
        <el-descriptions-item label="脚本ID">{{ selectedExecution.script_id }}</el-descriptions-item>
        <el-descriptions-item label="脚本名称">{{ selectedExecution.script_name }}</el-descriptions-item>
        <el-descriptions-item label="执行时间">
          {{ dayjs(selectedExecution.timestamp).format('YYYY-MM-DD HH:mm:ss') }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="selectedExecution.success ? 'success' : 'danger'">
            {{ selectedExecution.success ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="退出码">{{ selectedExecution.exit_code }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ selectedExecution.duration_ms }}ms</el-descriptions-item>
        <el-descriptions-item label="标准输出" :span="2">
          <el-input
            v-model="selectedExecution.output"
            type="textarea"
            :rows="5"
            readonly
          />
        </el-descriptions-item>
        <el-descriptions-item label="错误输出" :span="2" v-if="selectedExecution.error">
          <el-input
            v-model="selectedExecution.error"
            type="textarea"
            :rows="5"
            readonly
          />
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { axios } from '@/utils/request'
import type { Agent, ApiResponse } from '@/types'

interface ScriptExecutionInfo {
  id: number
  host_id: string
  script_id: string
  script_name: string
  timestamp: string
  success: boolean
  output: string
  error: string
  exit_code: number
  duration_ms: number
}

const loading = ref(false)
const selectedHost = ref('')
const scriptIdFilter = ref('')
const agents = ref<Agent[]>([])
const executions = ref<ScriptExecutionInfo[]>([])
const detailVisible = ref(false)
const selectedExecution = ref<ScriptExecutionInfo | null>(null)

const loadAgents = async () => {
  try {
    const res = await axios.get('/v1/agents', { params: { page: 1, page_size: 100 } }) as unknown as ApiResponse<{ agents: Agent[] }>
    agents.value = res.data?.agents || []
  } catch (error) {
    console.error('Failed to load agents:', error)
  }
}

const loadExecutions = async () => {
  try {
    loading.value = true
    const params: any = { limit: 100 }
    if (selectedHost.value) {
      params.host_id = selectedHost.value
    }
    if (scriptIdFilter.value) {
      params.script_id = scriptIdFilter.value
    }
    
    const res = await axios.get('/v1/scripts/executions', { params }) as unknown as ApiResponse<ScriptExecutionInfo[]>
    executions.value = res.data || []
  } catch (error) {
    ElMessage.error('加载执行记录失败')
  } finally {
    loading.value = false
  }
}

const viewDetail = (row: ScriptExecutionInfo) => {
  selectedExecution.value = row
  detailVisible.value = true
}

onMounted(() => {
  loadAgents()
  loadExecutions()
})
</script>

<style scoped>
.scripts-container {
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

