<template>
  <div class="ops-report">
    <div class="report-header">
      <div>
        <div class="report-title">{{ report.title || '诊断报告' }}</div>
        <div class="report-confidence">置信度 {{ Math.round((report.confidence || 0) * 100) }}%</div>
      </div>
      <el-tag :type="riskTagType(report.risk_level)" effect="dark">
        {{ riskText(report.risk_level) }}
      </el-tag>
    </div>

    <div v-if="report.summary" class="report-section">
      <div class="section-title">摘要</div>
      <p>{{ report.summary }}</p>
    </div>

    <OpsAssistantEvidence v-if="report.evidence?.length" :items="report.evidence" />

    <div v-if="report.possible_causes?.length" class="report-section">
      <div class="section-title">可能原因</div>
      <div v-for="cause in report.possible_causes" :key="cause.cause" class="list-item">
        <span>{{ cause.cause }}</span>
        <el-tag size="small" type="info">{{ cause.probability }}</el-tag>
      </div>
    </div>

    <div v-if="report.recommendations?.length" class="report-section">
      <div class="section-title">建议步骤</div>
      <div v-for="item in report.recommendations" :key="item.action" class="list-item">
        <el-tag size="small" :type="priorityTagType(item.priority)">
          {{ item.priority }}
        </el-tag>
        <span>{{ item.action }}</span>
      </div>
    </div>

    <div v-if="hasRelatedEntities" class="report-section">
      <div class="section-title">关联对象</div>
      <div class="entity-row" v-if="report.related_entities?.hosts?.length">
        <span class="entity-label">主机</span>
        <el-tag v-for="host in report.related_entities.hosts" :key="host" size="small" type="info">
          {{ host }}
        </el-tag>
      </div>
      <div class="entity-row" v-if="report.related_entities?.alerts?.length">
        <span class="entity-label">告警</span>
        <el-tag v-for="alert in report.related_entities.alerts" :key="alert" size="small" type="warning">
          {{ alert }}
        </el-tag>
      </div>
      <div class="entity-row" v-if="report.related_entities?.knowledge_items?.length">
        <span class="entity-label">知识库</span>
        <el-link
          v-for="item in report.related_entities.knowledge_items"
          :key="item"
          type="primary"
          :href="knowledgeHref(item)"
        >
          {{ item }}
        </el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OpsAssistantDiagnosisReport } from '@/api/opsAssistant'
import OpsAssistantEvidence from './OpsAssistantEvidence.vue'

const props = defineProps<{
  report: OpsAssistantDiagnosisReport
}>()

const hasRelatedEntities = computed(() => {
  const entities = props.report.related_entities
  return Boolean(entities?.hosts?.length || entities?.alerts?.length || entities?.knowledge_items?.length)
})

const riskTagType = (risk: string) => {
  if (risk === 'critical' || risk === 'high') return 'danger'
  if (risk === 'medium') return 'warning'
  return 'success'
}

const riskText = (risk: string) => {
  const names: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '严重风险'
  }
  return names[risk] || risk
}

const knowledgeHref = (source: string) => {
  const id = source.startsWith('knowledge:') ? source.slice('knowledge:'.length) : source
  return id ? `#/knowledge/${id}` : ''
}

const priorityTagType = (priority: string) => {
  if (priority === 'high') return 'danger'
  if (priority === 'medium') return 'warning'
  return 'info'
}
</script>

<style scoped lang="scss">
.ops-report {
  margin-top: 10px;
  padding: 14px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
}

.report-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.report-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.report-confidence {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.report-section {
  margin-top: 14px;
}

.section-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.report-section p {
  margin: 0;
  line-height: 1.7;
  color: #303133;
}

.list-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 8px;
  line-height: 1.6;
  color: #303133;
}

.entity-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.entity-label {
  font-size: 12px;
  color: #909399;
}
</style>
