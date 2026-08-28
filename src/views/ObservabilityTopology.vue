<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { corootRows, getCorootResource, parseCorootApplicationID } from '@/api/coroot'

const router = useRouter()
const chartRef = ref<HTMLElement>()
const loading = ref(false)
const error = ref('')
const hasData = ref(true)
let chart: echarts.ECharts | undefined

const statusColor = (status: string) => ({ critical: '#ef4444', error: '#ef4444', warning: '#f59e0b', ok: '#22c55e', up: '#22c55e' }[status] || '#94a3b8')
const statusText = (status: string) => ({ critical: '严重', error: '错误', warning: '警告', ok: '正常', up: '在线', unknown: '未知' }[status] || status || '未知')
const nodeName = (id: string) => parseCorootApplicationID(id).name

function renderGraph(items: any[]) {
  if (!chartRef.value) return
  chart?.dispose(); chart = echarts.init(chartRef.value)
  const nodeMap = new Map<string, any>(); const edges: any[] = []; const edgeKeys = new Set<string>()
  const addNode = (id: string, status = 'unknown', category = 'external') => { if (id && !nodeMap.has(id)) nodeMap.set(id, { id, name: nodeName(id), status, category }) }
  for (const item of items) {
    const id = String(item.id || ''); if (!id) continue
    nodeMap.set(id, { id, name: nodeName(id), status: item.status || 'unknown', category: item.category || 'application' })
    for (const relation of item.upstreams || []) { const target = String(relation.id || ''); addNode(target, relation.status); const key = `${target}->${id}`; if (target && !edgeKeys.has(key)) { edgeKeys.add(key); edges.push({ source: target, target: id, stats: relation.stats || [] }) } }
    for (const relation of item.downstreams || []) { const target = String(relation.id || ''); addNode(target, relation.status); const key = `${id}->${target}`; if (target && !edgeKeys.has(key)) { edgeKeys.add(key); edges.push({ source: id, target, stats: relation.stats || [] }) } }
  }
  const nodes = [...nodeMap.values()].map((node) => ({ ...node, itemStyle: { color: '#fff', borderColor: statusColor(node.status), borderWidth: 2, borderRadius: 4 } }))
  hasData.value = nodes.length > 0
  chart.setOption({
    animationDuration: 600,
    tooltip: { borderColor: '#dbe4ee', formatter: (params: any) => params.dataType === 'edge' ? `${params.data.source} -> ${params.data.target}<br/>${(params.data.stats || []).join('<br/>') || '暂无调用统计'}` : `<b>${params.data.name}</b><br/>状态：${statusText(params.data.status)}<br/>类型：${params.data.category === 'application' ? '应用' : '外部服务'}` },
    series: [{ type: 'graph', layout: 'force', roam: true, draggable: true, data: nodes, links: edges, force: { repulsion: 420, edgeLength: 190, gravity: 0.04, friction: 0.15 }, symbol: 'roundRect', symbolSize: (_value: any, params: any) => params.data.category === 'application' ? [180, 42] : [150, 38], label: { show: true, position: 'insideLeft', padding: [0, 10, 0, 12], formatter: '{b}', color: '#1677d2', fontSize: 14, fontWeight: 500 }, lineStyle: { color: '#aebdce', width: 1.2, opacity: 0.78, curveness: 0.12 }, edgeSymbol: ['none', 'arrow'], edgeSymbolSize: 8 }] })
}

async function load() {
  loading.value = true; error.value = ''
  try { const result = await getCorootResource('topology', { query: '' }); await nextTick(); renderGraph(corootRows(result.data.data, 'map')) } catch (err: any) { error.value = err?.message || '服务拓扑加载失败' } finally { loading.value = false }
}
function resize() { chart?.resize() }
onMounted(() => { load(); window.addEventListener('resize', resize) })
onBeforeUnmount(() => { window.removeEventListener('resize', resize); chart?.dispose() })
</script>

<template>
  <div class="topology-page">
    <div class="page-header"><el-button :icon="ArrowLeft" text @click="router.back()">返回</el-button><div><h1>服务拓扑</h1><p>查看应用、数据库和外部服务调用关系</p></div><el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button></div>
    <el-alert v-if="error" type="error" :title="error" show-icon />
    <el-card shadow="never" class="graph-card"><div ref="chartRef" class="topology-chart"></div><el-empty v-if="!hasData && !loading" description="当前时间范围没有拓扑数据" /></el-card>
    <div class="legend"><span><i class="ok" />正常</span><span><i class="warning" />警告</span><span><i class="critical" />严重</span><span><i class="unknown" />未知/外部服务</span></div>
  </div>
</template>

<style scoped>
.topology-page { padding: 24px; }.page-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }.page-header > :last-child { margin-left: auto; } h1 { margin: 0; color: #172033; font-size: 28px; } p { margin: 8px 0 0; color: #64748b; }.graph-card { margin-top: 16px; }.topology-chart { width: 100%; height: 680px; }.legend { display: flex; gap: 20px; margin-top: 12px; color: #64748b; font-size: 13px; }.legend span { display: inline-flex; align-items: center; gap: 6px; }.legend i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }.ok { background: #22c55e; }.warning { background: #f59e0b; }.critical { background: #ef4444; }.unknown { background: #94a3b8; } @media (max-width: 768px) { .topology-page { padding: 12px; }.topology-chart { height: 560px; } }
</style>
