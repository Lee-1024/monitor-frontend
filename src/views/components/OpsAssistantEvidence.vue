<template>
  <div class="report-section">
    <div class="section-title">Evidence</div>
    <div v-for="item in items" :key="`${item.source}-${item.text}`" class="evidence-item">
      <el-link v-if="knowledgeHref(item.source)" type="primary" :href="knowledgeHref(item.source)">
        {{ item.source }}
      </el-link>
      <el-tag v-else size="small" type="info">{{ item.source || item.type }}</el-tag>
      <span>{{ item.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OpsAssistantEvidence } from '@/api/opsAssistant'

defineProps<{
  items: OpsAssistantEvidence[]
}>()

const knowledgeHref = (source?: string) => {
  if (!source?.startsWith('knowledge:')) return ''
  const id = source.slice('knowledge:'.length)
  return id ? `#/knowledge/${id}` : ''
}
</script>

<style scoped lang="scss">
.report-section {
  margin-top: 14px;
}

.section-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.evidence-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 8px;
  line-height: 1.6;
  color: #303133;
}
</style>
