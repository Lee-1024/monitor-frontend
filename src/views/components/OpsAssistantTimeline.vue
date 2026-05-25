<template>
  <div v-if="events.length" class="ops-timeline">
    <div
      v-for="(event, index) in events"
      :key="`${event.type}-${event.node || event.tool || index}-${index}`"
      class="timeline-item"
      :class="event.status || event.type"
    >
      <span class="timeline-dot" />
      <div class="timeline-body">
        <div class="timeline-title">
          <span>{{ eventTitle(event) }}</span>
          <el-tag v-if="event.status" size="small" :type="tagType(event.status)">
            {{ statusText(event.status) }}
          </el-tag>
        </div>
        <div v-if="event.summary || event.content" class="timeline-summary">
          {{ event.summary || event.content }}
        </div>
        <div v-if="event.duration_ms" class="timeline-duration">
          {{ event.duration_ms }} ms
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OpsAssistantTimelineEvent } from '@/api/opsAssistant'

defineProps<{
  events: OpsAssistantTimelineEvent[]
}>()

const eventTitle = (event: OpsAssistantTimelineEvent) => {
  if (event.type === 'graph_node') return graphNodeName(event.node)
  if (event.type === 'tool_call') return event.tool || 'Tool call'
  return 'Status'
}

const graphNodeName = (node?: string) => {
  const names: Record<string, string> = {
    intent_classifier: 'Intent classification',
    tool_planner: 'Tool planning',
    evidence_builder: 'Evidence collection'
  }
  return names[node || ''] || node || 'Workflow'
}

const tagType = (status: string) => {
  if (status === 'completed' || status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'running') return 'warning'
  return 'info'
}

const statusText = (status: string) => {
  const names: Record<string, string> = {
    running: 'Running',
    completed: 'Done',
    success: 'Success',
    failed: 'Failed'
  }
  return names[status] || status
}
</script>

<style scoped lang="scss">
.ops-timeline {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f7f9fc;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 8px;
  padding: 6px 0;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: 50%;
  background: #909399;
}

.timeline-item.running .timeline-dot {
  background: #e6a23c;
}

.timeline-item.completed .timeline-dot,
.timeline-item.success .timeline-dot {
  background: #67c23a;
}

.timeline-item.failed .timeline-dot {
  background: #f56c6c;
}

.timeline-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.timeline-summary,
.timeline-duration {
  margin-top: 3px;
  font-size: 12px;
  color: #606266;
}
</style>
