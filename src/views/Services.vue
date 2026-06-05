<template>
  <div class="services-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>服务状态监控</span>
          <div class="header-actions">
            <el-select v-model="selectedHost" placeholder="选择主机" style="width: 200px" @change="loadServices">
              <el-option label="全部主机" value="" />
              <el-option
                v-for="agent in agents"
                :key="agent.host_id"
                :label="`${agent.hostname || agent.host_id} (${agent.host_id})`"
                :value="agent.host_id"
              />
            </el-select>
            <el-button type="primary" @click="loadServices" style="margin-left: 10px">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="danger" :loading="cleaning" @click="handleClearServiceHistory" style="margin-left: 10px">
              清理历史
            </el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="Agent服务状态" name="agent">
          <el-table
            v-loading="loading"
            :data="pagedServices"
            stripe
            table-layout="auto"
            style="width: 100%"
            empty-text="暂无数据"
          >
            <el-table-column prop="host_id" label="主机ID" min-width="170" show-overflow-tooltip />
            <el-table-column prop="name" label="服务名称" min-width="200" show-overflow-tooltip />
            <el-table-column label="端口" width="100">
              <template #default="{ row }">
                <span v-if="row.port">{{ row.port }}</span>
                <span v-else style="color: #909399;">-</span>
              </template>
            </el-table-column>
            <el-table-column label="端口状态" width="120">
              <template #default="{ row }">
                <el-tag v-if="row.port" :type="row.port_accessible ? 'success' : 'danger'">
                  {{ row.port_accessible ? '可访问' : '不可访问' }}
                </el-tag>
                <span v-else style="color: #909399;">-</span>
              </template>
            </el-table-column>
            <el-table-column label="服务状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column label="更新时间" width="180">
              <template #default="{ row }">
                {{ dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss') }}
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination
              v-model:current-page="serviceCurrentPage"
              v-model:page-size="servicePageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="services.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleServiceSizeChange"
              @current-change="handleServiceCurrentChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="服务端探测" name="server">
          <div class="probe-toolbar">
            <el-button type="primary" @click="openProbeDialog()">新增探测</el-button>
            <el-button :loading="probeLoading" @click="loadProbeTargets">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
          <el-table v-loading="probeLoading" :data="probeTargets" stripe style="width: 100%" empty-text="暂无探测目标">
            <el-table-column prop="name" label="名称" width="180" />
            <el-table-column label="类型" width="90">
              <template #default="{ row }">
                <el-tag>{{ row.type === 'tcp' ? 'TCP' : 'HTTP' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="目标" min-width="220">
              <template #default="{ row }">{{ getProbeTargetText(row) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="getProbeStatusType(row.last_status)">{{ getProbeStatusText(row.last_status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="延迟" width="100">
              <template #default="{ row }">{{ row.last_latency_ms || 0 }}ms</template>
            </el-table-column>
            <el-table-column prop="last_error" label="失败原因" min-width="180" show-overflow-tooltip />
            <el-table-column label="启用" width="90">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="toggleProbe(row)" />
              </template>
            </el-table-column>
            <el-table-column label="最后检查" width="180">
              <template #default="{ row }">
                {{ row.last_checked_at ? dayjs(row.last_checked_at).format('YYYY-MM-DD HH:mm:ss') : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="230" fixed="right">
              <template #default="{ row }">
                <el-button size="small" :loading="testingProbeId === row.id" @click="testProbe(row)">测试</el-button>
                <el-button size="small" @click="openProbeDialog(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteProbe(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="probeDialogVisible" :title="editingProbeId ? '编辑探测' : '新增探测'" width="560px">
      <el-form :model="probeForm" label-width="110px">
        <el-form-item label="名称">
          <el-input v-model="probeForm.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="probeForm.type">
            <el-radio-button label="tcp">TCP</el-radio-button>
            <el-radio-button label="http">HTTP/HTTPS</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <template v-if="probeForm.type === 'tcp'">
          <el-form-item label="IP/域名">
            <el-input v-model="probeForm.host" />
          </el-form-item>
          <el-form-item label="端口">
            <el-input-number v-model="probeForm.port" :min="1" :max="65535" />
          </el-form-item>
        </template>
        <el-form-item v-else label="URL">
          <el-input v-model="probeForm.url" placeholder="https://example.com/health" />
        </el-form-item>
        <el-form-item label="探测周期(秒)">
          <el-input-number v-model="probeForm.interval_seconds" :min="10" />
        </el-form-item>
        <el-form-item label="超时(秒)">
          <el-input-number v-model="probeForm.timeout_seconds" :min="1" :max="probeForm.interval_seconds" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="probeForm.enabled" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="probeForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="probeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="probeSaving" @click="saveProbe">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { axios } from '@/utils/request'
import { deleteServiceStatus } from '@/api/service'
import {
  createServerProbeTarget,
  deleteServerProbeTarget,
  getServerProbeTargets,
  testServerProbeTarget,
  updateServerProbeTarget,
  type ServerProbeTarget
} from '@/api/serverProbe'
import type { Agent, ApiResponse } from '@/types'

interface ServiceInfo {
  id: number
  host_id: string
  timestamp: string
  name: string
  status: string
  enabled: boolean
  description: string
  uptime_seconds: number
  port?: number              // 服务端口（可选）
  port_accessible?: boolean  // 端口是否可访问（可选）
}

const loading = ref(false)
const cleaning = ref(false)
const activeTab = ref('agent')
const selectedHost = ref('')
const agents = ref<Agent[]>([])
const services = ref<ServiceInfo[]>([])
const serviceCurrentPage = ref(1)
const servicePageSize = ref(20)
const probeLoading = ref(false)
const probeSaving = ref(false)
const probeDialogVisible = ref(false)
const testingProbeId = ref<number | null>(null)
const editingProbeId = ref<number | null>(null)
const probeTargets = ref<ServerProbeTarget[]>([])
const probeForm = ref<Partial<ServerProbeTarget>>({
  name: '',
  type: 'tcp',
  host: '',
  port: 80,
  url: '',
  interval_seconds: 60,
  timeout_seconds: 3,
  enabled: true,
  description: ''
})

const pagedServices = computed(() => {
  const start = (serviceCurrentPage.value - 1) * servicePageSize.value
  return services.value.slice(start, start + servicePageSize.value)
})

const loadAgents = async () => {
  try {
    const res = await axios.get('/v1/agents', { params: { page: 1, page_size: 100 } }) as unknown as ApiResponse<{ agents: Agent[] }>
    agents.value = res.data?.agents || []
  } catch (error) {
    console.error('Failed to load agents:', error)
  }
}

const loadServices = async () => {
  try {
    loading.value = true
    serviceCurrentPage.value = 1
    const params: any = {}
    if (selectedHost.value) {
      params.host_id = selectedHost.value
    }
    
    const res = await axios.get('/v1/services', { params }) as unknown as ApiResponse<ServiceInfo[]>
    services.value = res.data || []
  } catch (error) {
    ElMessage.error('加载服务状态失败')
  } finally {
    loading.value = false
  }
}

const handleServiceSizeChange = () => {
  serviceCurrentPage.value = 1
}

const handleServiceCurrentChange = () => {
  // current page is already synced by el-pagination
}

const loadProbeTargets = async () => {
  try {
    probeLoading.value = true
    const res = await getServerProbeTargets() as unknown as ApiResponse<ServerProbeTarget[]>
    probeTargets.value = res.data || []
  } catch (error) {
    ElMessage.error('加载服务端探测失败')
  } finally {
    probeLoading.value = false
  }
}

const getSelectedHostLabel = () => {
  const agent = agents.value.find((item) => item.host_id === selectedHost.value)
  return agent ? `${agent.hostname || agent.host_id} (${agent.host_id})` : selectedHost.value
}

const handleClearServiceHistory = async () => {
  const scopeText = selectedHost.value ? `主机 ${getSelectedHostLabel()}` : '全部主机'
  try {
    await ElMessageBox.confirm(
      `确定要清理${scopeText}的服务状态历史数据吗？清理后页面会等待 Agent 下一次上报新数据。`,
      '清理服务状态历史',
      {
        confirmButtonText: '确定清理',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    cleaning.value = true
    const res = await deleteServiceStatus(selectedHost.value || undefined) as unknown as ApiResponse<{ deleted_count: number }>
    const deletedCount = res.data?.deleted_count || 0
    ElMessage.success(`已清理 ${deletedCount} 条服务状态历史数据`)
    await loadServices()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清理服务状态历史数据失败')
    }
  } finally {
    cleaning.value = false
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'running':
      return 'success'
    case 'stopped':
      return 'info'
    case 'failed':
      return 'danger'
    default:
      return 'warning'
  }
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    failed: '失败',
    unknown: '未知'
  }
  return statusMap[status] || status
}

const openProbeDialog = (target?: ServerProbeTarget) => {
  editingProbeId.value = target?.id || null
  probeForm.value = target
    ? { ...target }
    : {
        name: '',
        type: 'tcp',
        host: '',
        port: 80,
        url: '',
        interval_seconds: 60,
        timeout_seconds: 3,
        enabled: true,
        description: ''
      }
  probeDialogVisible.value = true
}

const saveProbe = async () => {
  try {
    probeSaving.value = true
    if (editingProbeId.value) {
      await updateServerProbeTarget(editingProbeId.value, probeForm.value)
      ElMessage.success('探测目标已更新')
    } else {
      await createServerProbeTarget(probeForm.value)
      ElMessage.success('探测目标已创建')
    }
    probeDialogVisible.value = false
    await loadProbeTargets()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '保存探测目标失败')
  } finally {
    probeSaving.value = false
  }
}

const toggleProbe = async (target: ServerProbeTarget) => {
  await updateServerProbeTarget(target.id, target)
  await loadProbeTargets()
}

const testProbe = async (target: ServerProbeTarget) => {
  try {
    testingProbeId.value = target.id
    const res = await testServerProbeTarget(target.id) as unknown as ApiResponse<any>
    ElMessage.success(res.data?.status === 'up' ? '探测成功' : `探测失败：${res.data?.error || '-'}`)
    await loadProbeTargets()
  } finally {
    testingProbeId.value = null
  }
}

const deleteProbe = async (target: ServerProbeTarget) => {
  await ElMessageBox.confirm(`确定删除探测目标 "${target.name}" 吗？`, '删除探测目标', { type: 'warning' })
  await deleteServerProbeTarget(target.id)
  ElMessage.success('已删除')
  await loadProbeTargets()
}

const getProbeTargetText = (target: ServerProbeTarget) => {
  return target.type === 'tcp' ? `${target.host}:${target.port}` : target.url
}

const getProbeStatusType = (status: string) => {
  if (status === 'up') return 'success'
  if (status === 'down') return 'danger'
  return 'info'
}

const getProbeStatusText = (status: string) => {
  if (status === 'up') return '正常'
  if (status === 'down') return '失败'
  return '未知'
}

onMounted(() => {
  loadAgents()
  loadServices()
  loadProbeTargets()
})
</script>

<style scoped>
.services-container {
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

.probe-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .services-container {
    padding: 10px;
  }

  .card-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .header-actions {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }

  .pagination {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>

