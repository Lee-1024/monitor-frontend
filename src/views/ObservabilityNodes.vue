<script setup lang="ts">
import CorootResourcePage from './components/CorootResourcePage.vue'
const columns = [{ key: 'name', label: '节点名称' }, { key: 'cluster_name', label: '集群' }, { key: 'status', label: '状态' }, { key: 'os', label: '操作系统' }, { key: 'kernel_version', label: '内核' }, { key: 'compute', label: '计算资源' }, { key: 'cpu_percent', label: 'CPU' }, { key: 'memory_percent', label: '内存' }, { key: 'gpus', label: 'GPU' }, { key: 'ips', label: 'IP地址' }, { key: 'network_bandwidth', label: '网络' }, { key: 'uptime_ms', label: '运行时间' }]
</script>
<template><CorootResourcePage title="节点健康" description="查看 Coroot 节点资源和采集状态" resource="nodes" :columns="columns" /></template>
