<!-- ============================================ -->
<!-- 文件: src/components/AgentTable.vue -->
<!-- ============================================ -->
<template>
  <el-table :data="agents" v-loading="loading" table-layout="auto" style="width: 100%">
    <el-table-column prop="host_id" label="主机ID" min-width="190" show-overflow-tooltip />
    <el-table-column prop="hostname" label="主机名" min-width="220" show-overflow-tooltip />
    <el-table-column prop="ip" label="IP地址" min-width="150" />
    <el-table-column label="状态" width="100">
      <template #default="{ row }">
        <el-tag :type="row.status === 'online' ? 'success' : 'danger'">
          {{ row.status === 'online' ? '在线' : '离线' }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="os" label="操作系统" min-width="140" show-overflow-tooltip />
    <el-table-column label="最后上报" min-width="180">
      <template #default="{ row }">
        {{ formatTime(row.last_seen) }}
      </template>
    </el-table-column>
    <el-table-column label="操作" fixed="right" width="96" align="center">
      <template #default="{ row }">
        <el-button type="primary" size="small" @click="viewDetail(row.host_id)">
          详情
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

const router = useRouter()

defineProps<{
  agents: any[]
  loading?: boolean
}>()

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const viewDetail = (hostId: string) => {
  router.push(`/agents/${hostId}`)
}
</script>
