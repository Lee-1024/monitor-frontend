<script setup lang="ts">
import CorootResourcePage from './components/CorootResourcePage.vue'
const columns = [{ key: 'name', label: '节点名称' }, { key: 'cluster', label: '集群' }, { key: 'status', label: '状态' }, { key: 'os', label: '操作系统' }, { key: 'kernel', label: '内核' }, { key: 'cpu', label: 'CPU' }, { key: 'memory', label: '内存' }, { key: 'gpus', label: 'GPU' }, { key: 'network', label: '网络' }]
</script>
<template><CorootResourcePage title="节点健康" description="查看 Coroot 节点资源和采集状态" resource="nodes" :columns="columns" /></template>
