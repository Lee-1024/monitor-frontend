<script setup lang="ts">
import CorootResourcePage from './components/CorootResourcePage.vue'
const columns = [{ key: 'name', label: '节点名称' }, { key: 'os', label: '操作系统' }, { key: 'kernel', label: '内核' }, { key: 'cpu', label: 'CPU' }, { key: 'memory', label: '内存' }, { key: 'network', label: '网络' }, { key: 'agent_status', label: 'Agent 状态' }]
</script>
<template><CorootResourcePage title="节点健康" description="查看 Coroot 节点资源和采集状态" resource="nodes" :columns="columns" /></template>
