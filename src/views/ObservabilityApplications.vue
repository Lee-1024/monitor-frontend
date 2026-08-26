<script setup lang="ts">
import CorootResourcePage from './components/CorootResourcePage.vue'
const columns = [{ key: 'name', label: '应用名称' }, { key: 'type', label: '类型' }, { key: 'status', label: '状态' }, { key: 'errors', label: '错误' }, { key: 'latency', label: '延迟' }, { key: 'upstreams', label: '上游依赖' }, { key: 'instances', label: '实例' }, { key: 'restarts', label: '重启' }, { key: 'cpu', label: 'CPU' }, { key: 'memory', label: '内存' }, { key: 'disk_io_load', label: 'I/O负载' }, { key: 'disk_usage', label: '磁盘' }, { key: 'network', label: '网络' }, { key: 'dns', label: 'DNS' }, { key: 'logs', label: '日志' }]
</script>
<template><CorootResourcePage title="应用列表" description="查看 Coroot 发现的应用健康和上下游" resource="applications" :columns="columns" /></template>
