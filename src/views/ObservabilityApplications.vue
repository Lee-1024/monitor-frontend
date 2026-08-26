<script setup lang="ts">
import CorootResourcePage from './components/CorootResourcePage.vue'
const columns = [{ key: 'name', label: '应用名称' }, { key: 'namespace', label: '命名空间' }, { key: 'category', label: '分类' }, { key: 'type', label: '类型' }, { key: 'status', label: '状态' }, { key: 'issues', label: '问题' }]
</script>
<template><CorootResourcePage title="应用列表" description="查看 Coroot 发现的应用健康和上下游" resource="applications" :columns="columns" /></template>
