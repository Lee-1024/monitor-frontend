<template>
  <div class="resource-page">
    <div class="page-header"><div class="header-main"><el-button class="back-button" :icon="ArrowLeft" link @click="goBack">返回</el-button><div><h2>{{ title }}</h2><p>{{ description }}</p></div></div><el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button></div>
    <el-alert v-if="error" :title="error" type="warning" :closable="false" show-icon />
    <el-card shadow="never"><el-table v-loading="loading" :data="rows" stripe empty-text="暂无 Coroot 数据">
      <el-table-column v-for="column in columns" :key="column.key" :prop="column.key" :label="column.label" min-width="140" />
    </el-table></el-card>
    <div class="resource-footer"><span>数据时间：{{ checkedAt || '暂无' }}</span><el-button v-if="deepLink" link type="primary" @click="openCoroot">打开 Coroot 详情</el-button></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { corootField, corootRows, getCorootResource, type CorootResponse } from '@/api/coroot'

const props = defineProps<{ title: string; description: string; resource: string; columns: Array<{ key: string; label: string }>; deepLink?: string }>()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const response = ref<CorootResponse | null>(null)
const payload = computed(() => response.value?.data as any)
const rows = computed(() => {
  const data = payload.value
  const collection = props.resource === 'applications' ? 'applications' : props.resource === 'incidents' ? 'incidents' : props.resource === 'nodes' ? 'nodes' : 'items'
  return corootRows(data, collection).map((row: any) => {
    const normalized: Record<string, unknown> = { ...row }
    for (const column of props.columns) normalized[column.key] = corootField(row, column.key, `metrics.${column.key}`, `summary.${column.key}`)
    if (normalized.name === '-' && row.id) normalized.name = row.id
    return normalized
  })
})
const checkedAt = computed(() => response.value?.checked_at ? new Date(response.value.checked_at).toLocaleString() : '')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await getCorootResource(props.resource, { page: 1, page_size: 100 })
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
