<template>
  <div class="resource-page">
    <div class="page-header"><div class="header-main"><el-button class="back-button" :icon="ArrowLeft" link @click="goBack">返回</el-button><div><h2>{{ title }}</h2><p>{{ description }}</p></div></div><el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button></div>
    <el-alert v-if="error" :title="error" type="warning" :closable="false" show-icon />
    <el-card shadow="never"><el-table v-loading="loading" :data="rows" stripe empty-text="暂无 Coroot 数据">
      <el-table-column v-for="column in columns" :key="column.key" :prop="column.key" :label="column.label" min-width="140">
        <template #default="scope">
          <el-tag v-if="isStatusColumn(column.key)" :type="statusType(scope.row[column.key])" effect="light">
            <el-icon><component :is="statusIcon(scope.row[column.key])" /></el-icon>
            {{ translateStatus(scope.row[column.key]) }}
          </el-tag>
          <span v-else>{{ translateValue(scope.row[column.key], column.key) }}</span>
        </template>
      </el-table-column>
    </el-table></el-card>
    <div class="resource-footer"><span>数据时间：{{ checkedAt || '暂无' }}</span><el-button v-if="deepLink" link type="primary" @click="openCoroot">打开 Coroot 详情</el-button></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft, CircleCheck, CircleClose, InfoFilled, Refresh, WarningFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { corootField, corootRows, formatCorootDuration, formatCorootTime, getCorootResource, parseCorootApplicationID, type CorootResponse } from '@/api/coroot'

const props = defineProps<{ title: string; description: string; resource: string; columns: Array<{ key: string; label: string }>; deepLink?: string }>()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const response = ref<CorootResponse | null>(null)
const payload = computed(() => response.value?.data as any)
const rows = computed(() => {
  const data = payload.value
  if (props.resource === 'topology') {
    const applications = corootRows(data, 'map')
    const edges: any[] = []
    for (const app of applications) {
      for (const link of [...(app.upstreams || []), ...(app.downstreams || [])]) {
        edges.push({
          source: app.id || app.name || '-',
          target: link.application_id || link.id || link.name || '-',
          request_rate: link.request_rate ?? link.rps ?? link.requests,
          latency: link.latency ?? link.rtt,
          error_rate: link.error_rate,
          failed_connections: link.failed_connections,
        })
      }
    }
    if (edges.length) return edges.map(row => {
      const normalized: Record<string, unknown> = { ...row }
      for (const column of props.columns) normalized[column.key] = corootField(row, column.key)
      return normalized
    })
    const entities = [
      ...corootRows(data, 'applications').map((item: any) => ({ source: parseCorootApplicationID(item.id).name, target: '-', request_rate: '-', latency: '-', error_rate: '-', failed_connections: '-' })),
      ...corootRows(data, 'nodes').map((item: any) => ({ source: item.name || '-', target: '节点', request_rate: '-', latency: '-', error_rate: '-', failed_connections: '-' }))
    ]
    return entities
  }
  const collection = props.resource === 'applications' ? 'applications' : props.resource === 'incidents' ? 'incidents' : props.resource === 'nodes' ? 'nodes' : props.resource === 'alerts' ? 'alerts' : 'items'
  return corootRows(data, collection).map((row: any) => {
    const normalized: Record<string, unknown> = { ...row }
    for (const column of props.columns) normalized[column.key] = corootField(row, column.key, `metrics.${column.key}`, `summary.${column.key}`)
    if (props.resource === 'incidents') {
      normalized.id = row.key || row.id || '-'
      normalized.application = parseCorootApplicationID(row.application_id).name
      normalized.description = row.short_description || '-'
      normalized.impact = row.impact === undefined ? '-' : `${Number(row.impact).toFixed(2)}%`
      normalized.opened_at = formatCorootTime(row.opened_at)
      normalized.resolved_at = formatCorootTime(row.resolved_at)
      normalized.duration = formatCorootDuration(row.duration)
    }
    if (props.resource === 'alerts') {
      normalized.id = row.id || row.key || '-'
      normalized.application = typeof row.application === 'object' ? row.application.name || row.application.id || '-' : row.application_id ? parseCorootApplicationID(row.application_id).name : row.application || '-'
      normalized.summary = row.summary || row.short_description || row.description || row.message || '-'
      normalized.severity = row.severity || row.status || '-'
      normalized.report = row.report || row.rule_name || '-'
      normalized.detail = Array.isArray(row.details) ? row.details.map((item: any) => `${item.name || ''}: ${item.value || ''}`).join('; ') : '-'
      normalized.opened_at = formatCorootTime(row.opened_at || row.created_at)
      normalized.resolved_at = formatCorootTime(row.resolved_at)
      normalized.duration = formatCorootDuration(row.duration)
      normalized.status = row.resolved_at || row.manually_resolved_at ? '已恢复' : row.suppressed ? '已抑制' : '触发中'
    }
    if (props.resource === 'nodes' && row.name) {
      normalized.cluster_name = row.cluster_name || row.cluster_id || '-'
      normalized.status = row.status?.message || row.status?.status || normalized.status
      normalized.cpu_percent = row.cpu_percent === undefined ? '-' : `${row.cpu_percent}%`
      normalized.memory_percent = row.memory_percent === undefined ? '-' : `${row.memory_percent}%`
      normalized.ips = Array.isArray(row.ips) ? row.ips.join(', ') : row.ips || '-'
      normalized.network_bandwidth = row.network_bandwidth ? `RX ${formatNetwork(row.network_bandwidth.rx)} / TX ${formatNetwork(row.network_bandwidth.tx)}` : '-'
      normalized.uptime_ms = formatCorootDuration(row.uptime_ms)
    }
    if (props.resource === 'applications' && row.id) {
      const parsed = parseCorootApplicationID(row.id)
      normalized.name = parsed.name
      normalized.namespace = parsed.namespace
      normalized.type = row.type?.name || parsed.kind
      normalized.status = row.status?.status || row.status || '-'
      for (const key of ['errors', 'latency', 'upstreams', 'instances', 'restarts', 'cpu', 'memory', 'disk_io_load', 'disk_usage', 'network', 'dns', 'logs']) {
        const metric = row[key]
        normalized[key] = metric && typeof metric === 'object' ? metric.value || metric.status || '-' : metric ?? '-'
      }
    } else if (normalized.name === '-' && row.id) normalized.name = row.id
    return normalized
  })
})

function formatNetwork(value: unknown) {
  const bytes = Number(value)
  if (!Number.isFinite(bytes)) return '-'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`
}
function isStatusColumn(key: string) { return ['status', 'severity', 'state'].includes(key) }
function normalizedStatus(value: unknown) { return String(value ?? '').toLowerCase() }
function translateStatus(value: unknown) {
  const status = normalizedStatus(value)
  return ({ ok: '正常', up: '在线', warning: '警告', critical: '严重', error: '异常', down: '离线', resolved: '已恢复', firing: '触发中', suppressed: '已抑制', 'ai disabled': '未启用智能分析', '已发现': '已发现' } as Record<string, string>)[status] || String(value || '未知')
}
function statusType(value: unknown) {
  const status = normalizedStatus(value)
  if (['ok', 'up', 'resolved', '已发现'].includes(status)) return 'success'
  if (['warning', 'firing', 'suppressed'].includes(status)) return 'warning'
  if (['critical', 'error', 'down'].includes(status)) return 'danger'
  return 'info'
}
function statusIcon(value: unknown) {
  const type = statusType(value)
  return type === 'success' ? CircleCheck : type === 'danger' ? CircleClose : type === 'warning' ? WarningFilled : InfoFilled
}
function translateValue(value: unknown, key: string) {
  if (key === 'type' && typeof value === 'string') return ({ python: 'Python', java: 'Java', go: 'Go', nodejs: 'Node.js', unknown: '未知' } as Record<string, string>)[value.toLowerCase()] || value
  if (key === 'severity') return translateStatus(value)
  return value === undefined || value === null || value === '' ? '-' : String(value)
}
const checkedAt = computed(() => response.value?.checked_at ? new Date(response.value.checked_at).toLocaleString() : '')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params: Record<string, string | number | boolean> = props.resource === 'alerts'
      ? { limit: 50, offset: 0, include_resolved: false, sort_by: 'opened_at', sort_desc: true }
      : { page: 1, page_size: 100 }
    const result = await getCorootResource(props.resource, params)
    response.value = result.data
    if (result.data.error) error.value = result.data.error
  } catch (err: any) { error.value = err?.response?.data?.message || 'Coroot 暂时不可用' } finally { loading.value = false }
}
function openCoroot() { if (props.deepLink) window.open(props.deepLink, '_blank', 'noopener,noreferrer') }
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/observability')
}
onMounted(load)
</script>

<style scoped>
.resource-page { padding: 24px; min-height: 100%; background: #f5f7fa; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }.header-main { display: flex; gap: 12px; align-items: flex-start; }.back-button { margin-top: 1px; }
.page-header h2 { margin: 0 0 6px; color: #1f2937; }.page-header p { margin: 0; color: #909399; }
.resource-footer { color: #909399; display: flex; justify-content: space-between; padding: 14px 2px; font-size: 12px; }
</style>
