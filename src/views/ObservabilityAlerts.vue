<script setup lang="ts">
import CorootResourcePage from './components/CorootResourcePage.vue'

const columns = [
  { key: 'id', label: '告警编号', width: 150 },
  { key: 'application', label: '应用', width: 180 },
  { key: 'summary', label: '摘要', width: 220 },
  { key: 'severity', label: '级别', width: 90 },
  { key: 'report', label: '检查项', width: 130 },
  { key: 'detail', label: '详情', width: 280 },
  { key: 'opened_at', label: '打开时间', width: 160 },
  { key: 'resolved_at', label: '恢复时间', width: 160 },
  { key: 'duration', label: '持续时间', width: 110 },
  { key: 'status', label: '状态', width: 100 }
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
