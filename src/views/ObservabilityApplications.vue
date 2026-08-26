<script setup lang="ts">
import CorootResourcePage from './components/CorootResourcePage.vue'
const columns = [{ key: 'name', label: '应用名称' }, { key: 'type', label: '类型' }, { key: 'status', label: '状态' }, { key: 'error_rate', label: '错误率' }, { key: 'latency', label: '延迟' }, { key: 'instances', label: '实例' }, { key: 'upstreams', label: '上游依赖' }]
</script>
<template><CorootResourcePage title="应用列表" description="查看 Coroot 发现的应用健康和上下游" resource="applications" :columns="columns" /></template>
