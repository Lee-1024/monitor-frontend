<script setup lang="ts">
import CorootResourcePage from './components/CorootResourcePage.vue'
const columns = [{ key: 'source', label: '调用方' }, { key: 'target', label: '目标' }, { key: 'request_rate', label: '请求量' }, { key: 'latency', label: '延迟' }, { key: 'error_rate', label: '错误率' }, { key: 'failed_connections', label: '失败连接' }]
</script>
<template><CorootResourcePage title="服务拓扑" description="查看应用、数据库和外部服务调用关系" resource="topology" :columns="columns" /></template>
