<template>
  <div class="ops-report">
    <div class="report-header">
      <div>
        <div class="report-title">{{ report.title || 'Diagnosis report' }}</div>
        <div class="report-confidence">Confidence {{ Math.round((report.confidence || 0) * 100) }}%</div>
      </div>
      <el-tag :type="riskTagType(report.risk_level)" effect="dark">
        {{ riskText(report.risk_level) }}
      </el-tag>
    </div>

    <div v-if="report.summary" class="report-section">
      <div class="section-title">Summary</div>
      <p>{{ report.summary }}</p>
    </div>

    <OpsAssistantEvidence v-if="report.evidence?.length" :items="report.evidence" />

    <div v-if="report.possible_causes?.length" class="report-section">
      <div class="section-title">Possible causes</div>
      <div v-for="cause in report.possible_causes" :key="cause.cause" class="list-item">
        <span>{{ cause.cause }}</span>
        <el-tag size="small" type="info">{{ cause.probability }}</el-tag>
      </div>
    </div>

    <div v-if="report.recommendations?.length" class="report-section">
      <div class="section-title">Recommendations</div>
      <div v-for="item in report.recommendations" :key="item.action" class="list-item">
        <el-tag size="small" :type="priorityTagType(item.priority)">
          {{ item.priority }}
        </el-tag>
        <span>{{ item.action }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OpsAssistantDiagnosisReport } from '@/api/opsAssistant'
import OpsAssistantEvidence from './OpsAssistantEvidence.vue'

defineProps<{
  report: OpsAssistantDiagnosisReport
}>()

const riskTagType = (risk: string) => {
  if (risk === 'critical' || risk === 'high') return 'danger'
  if (risk === 'medium') return 'warning'
  return 'success'
}

const riskText = (risk: string) => {
  const names: Record<string, string> = {
    low: 'Low risk',
    medium: 'Medium risk',
    high: 'High risk',
    critical: 'Critical risk'
  }
  return names[risk] || risk
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
</style>
