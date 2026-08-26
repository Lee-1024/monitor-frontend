<template>
  <div class="observability-page">
    <div class="page-header">
      <div>
        <h2>应用可观测性</h2>
        <p>Coroot 应用、拓扑和事故观测</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadOverview">刷新</el-button>
    </div>

    <el-alert v-if="error" :title="error" type="warning" :closable="false" show-icon />

    <div class="summary-grid">
      <el-card v-for="item in summaryCards" :key="item.label" shadow="never">
        <div class="summary-label">{{ item.label }}</div>
        <div class="summary-value">{{ item.value }}</div>
      </el-card>
    </div>

    <el-card shadow="never" class="status-card">
      <template #header><span>Coroot 状态</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="连接状态">
          <el-tag :type="available ? 'success' : 'warning'">{{ available ? '正常' : '不可用' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="检查时间">{{ checkedAt || '暂无' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <div class="quick-links">
      <el-card v-for="link in links" :key="link.path" shadow="never" class="link-card" @click="router.push(link.path)">
        <el-icon><component :is="link.icon" /></el-icon>
        <div><strong>{{ link.title }}</strong><span>{{ link.description }}</span></div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Connection, Grid, Monitor, Refresh, Warning } from '@element-plus/icons-vue'
import { corootRows, getCorootOverview, type CorootResponse } from '@/api/coroot'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const response = ref<CorootResponse | null>(null)

const available = computed(() => response.value?.available === true)
const checkedAt = computed(() => response.value?.checked_at ? new Date(response.value.checked_at).toLocaleString() : '')
const payload = computed(() => (response.value?.data || {}) as Record<string, unknown>)
const context = computed(() => (payload.value.context || payload.value) as any)
const applications = computed(() => corootRows(payload.value, 'applications'))
const alertCount = computed(() => Number((context.value.alerts || {}).warning || 0) + Number((context.value.alerts || {}).critical || 0))
const incidentCount = computed(() => Number((context.value.incidents || {}).application || 0))
const summaryCards = computed(() => [
  { label: '应用数量', value: applications.value.length || payload.value.application_count || '-' },
  { label: '事故数量', value: incidentCount.value || '-' },
  { label: '告警数量', value: alertCount.value || '-' },
  { label: '搜索应用', value: applications.value.length || '-' }
])
const links = [
  { title: '应用列表', description: '查看应用健康和上下游', path: '/observability/applications', icon: Grid },
  { title: '服务拓扑', description: '查看服务调用关系', path: '/observability/topology', icon: Connection },
  { title: '事故中心', description: '查看活动和历史事故', path: '/observability/incidents', icon: Warning },
  { title: '节点健康', description: '查看节点资源和 Agent', path: '/observability/nodes', icon: Monitor },
  { title: '告警摘要', description: '查看 Coroot 告警', path: '/observability/alerts', icon: Bell }
]

async function loadOverview() {
  loading.value = true
  error.value = ''
  try {
    const result = await getCorootOverview()
    response.value = result.data
    if (result.data.error) error.value = result.data.error
  } catch (err: any) {
    error.value = err?.response?.data?.error || 'Coroot 暂时不可用'
  } finally {
    loading.value = false
  }
}

onMounted(loadOverview)
</script>

<style scoped>
.observability-page { padding: 24px; min-height: 100%; background: #f5f7fa; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
.page-header h2 { margin: 0 0 6px; color: #1f2937; }
.page-header p { margin: 0; color: #909399; }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 18px 0; }
.summary-label { color: #909399; font-size: 13px; }
.summary-value { color: #303133; font-size: 28px; font-weight: 600; margin-top: 10px; }
.status-card { margin-bottom: 16px; }
.quick-links { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
.link-card { cursor: pointer; }
.link-card :deep(.el-card__body) { display: flex; gap: 12px; align-items: center; }
.link-card .el-icon { color: #409eff; font-size: 24px; }
.link-card strong, .link-card span { display: block; }
.link-card span { color: #909399; font-size: 12px; margin-top: 6px; }
@media (max-width: 1000px) { .quick-links { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } .quick-links { grid-template-columns: 1fr; } }
</style>
