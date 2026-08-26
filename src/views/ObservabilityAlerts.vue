<script setup lang="ts">
import CorootResourcePage from './components/CorootResourcePage.vue'

const columns = [
  { key: 'id', label: '告警编号' },
  { key: 'application', label: '应用' },
  { key: 'summary', label: '摘要' },
  { key: 'severity', label: '级别' },
  { key: 'report', label: '检查项' },
  { key: 'detail', label: '详情' },
  { key: 'opened_at', label: '打开时间' },
  { key: 'resolved_at', label: '恢复时间' },
  { key: 'duration', label: '持续时间' },
  { key: 'status', label: '状态' }
]
</script>

<template>
  <CorootResourcePage
    title="Coroot 告警"
    description="查看 Coroot 检查、日志和 PromQL 产生的告警"
    resource="alerts"
    :columns="columns"
  />
</template>
