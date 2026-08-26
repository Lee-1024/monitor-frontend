<script setup lang="ts">
import CorootResourcePage from './components/CorootResourcePage.vue'
const columns = [{ key: 'id', label: '事故编号' }, { key: 'application', label: '应用' }, { key: 'description', label: '描述' }, { key: 'severity', label: '级别' }, { key: 'impact', label: '影响' }, { key: 'opened_at', label: '打开时间' }, { key: 'resolved_at', label: '解决时间' }, { key: 'duration', label: '持续时间' }]
</script>
<template><CorootResourcePage title="事故中心" description="查看活动和历史 SLO 事故" resource="incidents" :columns="columns" /></template>
