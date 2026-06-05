<template>
  <div class="ops-assistant">
    <el-card class="assistant-card">
      <template #header>
        <div class="header">
          <div>
            <div class="title">运维助手</div>
            <div class="subtitle">基于监控数据、告警和异常事件生成只读诊断建议</div>
          </div>
          <div class="header-actions">
            <el-button @click="startNewSession">新会话</el-button>
            <el-button :icon="Delete" @click="clearConversation">清空</el-button>
          </div>
        </div>
      </template>

      <div class="context-bar">
        <div class="context-field host-field">
          <span class="context-label">主机</span>
          <el-select
            v-model="selectedHost"
            clearable
            filterable
            placeholder="全部主机"
            class="host-select"
          >
            <el-option
              v-for="agent in agents"
              :key="agent.host_id"
              :label="`${agent.hostname || agent.host_id} (${agent.status})`"
              :value="agent.host_id"
            />
          </el-select>
        </div>

        <div class="context-field time-field">
          <span class="context-label">时间</span>
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            format="MM-DD HH:mm"
            class="time-range"
          />
        </div>
      </div>

      <div ref="messageListRef" class="messages">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-guide">
            <div class="empty-title">我可以帮你做这些运维分析</div>
            <div class="empty-subtitle">选择一个问题开始，或直接输入你的问题</div>
            <div class="example-grid">
              <button
                v-for="example in examples"
                :key="example.title"
                class="example-item"
                type="button"
                @click="useExample(example.prompt)"
              >
                <span class="example-title">{{ example.title }}</span>
                <span class="example-desc">{{ example.description }}</span>
              </button>
            </div>
          </div>
        </div>

        <div
          v-for="message in messages"
          :key="message.id"
          class="message-row"
          :class="message.role"
        >
          <div class="message-bubble">
            <div class="message-role">{{ message.role === 'user' ? '我' : '运维助手' }}</div>
            <div v-if="message.role === 'assistant' && toolCalls.length > 0 && message.id === activeAssistantMessageId" class="inline-tool-panel">
              <div class="inline-tool-title">已查询数据</div>
              <div v-for="(tool, index) in toolCalls" :key="`${tool.tool}-${index}`" class="inline-tool-item">
                <el-tag size="small" type="info">{{ tool.tool }}</el-tag>
                <span>{{ tool.summary }}</span>
              </div>
            </div>
            <div v-if="message.role === 'assistant' && loading && message.id === activeAssistantMessageId && !message.content" class="thinking">
              <span class="thinking-dot"></span>
              {{ statusText }}
            </div>
            <OpsAssistantTimeline
              v-if="message.role === 'assistant'"
              :events="message.timeline || []"
            />
            <OpsAssistantReport
              v-if="message.role === 'assistant' && message.report"
              :report="message.report"
            />
            <div v-if="message.content" class="message-content" v-html="formatMessage(message.content)" />
          </div>
        </div>
      </div>

      <el-alert
        v-if="errorMessage"
        type="error"
        show-icon
        :closable="true"
        class="error-alert"
        @close="errorMessage = ''"
      >
        <template #title>{{ errorMessage }}</template>
        <template #default>
          <el-button v-if="isLLMConfigError" link type="primary" @click="$router.push('/llm-config')">
            前往 LLM 配置
          </el-button>
        </template>
      </el-alert>

      <div class="input-area">
        <el-input
          v-model="input"
          type="textarea"
          :rows="3"
          resize="none"
          placeholder="例如：帮我分析当前有哪些主机风险最高"
          :disabled="loading"
          @keydown.enter="handleInputEnter"
        />
        <el-button v-if="loading" type="warning" @click="stopStream">
          停止
        </el-button>
        <el-button v-else type="primary" :icon="Promotion" :disabled="!input.trim()" @click="send">
          发送
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { Delete, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getAgents } from '@/api/agent'
import { sortAgents } from '@/utils/agentSort'
import {
  deleteOpsAssistantSession,
  streamOpsAssistant,
  type OpsAssistantDiagnosisReport,
  type OpsAssistantTimelineEvent,
  type OpsAssistantToolCall
} from '@/api/opsAssistant'
import OpsAssistantTimeline from './components/OpsAssistantTimeline.vue'
import OpsAssistantReport from './components/OpsAssistantReport.vue'

interface AgentOption {
  host_id: string
  hostname: string
  status: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timeline?: OpsAssistantTimelineEvent[]
  report?: OpsAssistantDiagnosisReport
}

const agents = ref<AgentOption[]>([])
const selectedHost = ref('')
const timeRange = ref<[string, string] | null>(null)
const input = ref('')
const messages = ref<ChatMessage[]>([])
const toolCalls = ref<OpsAssistantToolCall[]>([])
const loading = ref(false)
const errorMessage = ref('')
const sessionId = ref('')
const statusText = ref('正在处理...')
const activeAssistantMessageId = ref('')
const messageListRef = ref<HTMLElement | null>(null)
let cancelStream: (() => void) | null = null
let renderFrame: number | null = null
let pendingContent = ''
let streamDone = false
let activeAssistantIndex = -1

const isLLMConfigError = computed(() => errorMessage.value.includes('LLM 配置'))

const examples = [
  {
    title: '全局风险巡检',
    description: '汇总当前主机、告警和异常事件',
    prompt: '帮我分析当前系统里哪些主机风险最高，并按优先级给出处置建议'
  },
  {
    title: '主机性能诊断',
    description: '结合指标趋势判断 CPU、内存、磁盘问题',
    prompt: '结合最近 24 小时指标，分析所选主机是否存在性能瓶颈'
  },
  {
    title: '告警根因分析',
    description: '梳理近期告警和异常之间的关联',
    prompt: '帮我分析近期未解决告警的可能原因，并给出排查步骤'
  },
  {
    title: '知识库排障',
    description: '从知识库检索相关处理经验',
    prompt: '从知识库里找相关排障经验，并整理成可执行步骤'
  },
  {
    title: '巡检报告总结',
    description: '读取最新巡检报告并提炼重点',
    prompt: '总结最新巡检报告，列出今天最需要关注的问题'
  }
]

const loadAgents = async () => {
  try {
    const res: any = await getAgents({ page: 1, page_size: 100 })
    const data = res.data || res
    agents.value = sortAgents(data.agents || data.data?.agents || [])
  } catch (error) {
    console.error('加载主机失败:', error)
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

const stopRenderer = () => {
  if (renderFrame !== null) {
    window.cancelAnimationFrame(renderFrame)
    renderFrame = null
  }
}

const startRenderer = () => {
  if (renderFrame !== null) return
  renderFrame = window.requestAnimationFrame(renderNextFrame)
}

const renderNextFrame = () => {
  renderFrame = null
  if (!pendingContent) {
    if (streamDone) {
      loading.value = false
      cancelStream = null
      activeAssistantIndex = -1
      return
    }
    if (loading.value) {
      startRenderer()
    }
    return
  }

  const chunkSize = pendingContent.length > 500 ? 12 : 5
  const next = pendingContent.slice(0, chunkSize)
  pendingContent = pendingContent.slice(chunkSize)
  if (activeAssistantIndex >= 0 && messages.value[activeAssistantIndex]) {
    const current = messages.value[activeAssistantIndex]
    messages.value[activeAssistantIndex] = {
      ...current,
      content: current.content + next
    }
    scrollToBottom()
  }
  startRenderer()
}

const updateActiveAssistantMessage = (patch: Partial<ChatMessage>) => {
  if (activeAssistantIndex < 0 || !messages.value[activeAssistantIndex]) return
  messages.value[activeAssistantIndex] = {
    ...messages.value[activeAssistantIndex],
    ...patch
  }
}

const timelineKey = (event: OpsAssistantTimelineEvent) => {
  if (event.type === 'tool_call') return `tool:${event.tool || ''}`
  if (event.type === 'graph_node') return `node:${event.node || ''}`
  return `status:${event.content || event.summary || ''}`
}

const appendTimelineEvent = (event: OpsAssistantTimelineEvent) => {
  if (activeAssistantIndex < 0 || !messages.value[activeAssistantIndex]) return
  const current = messages.value[activeAssistantIndex]
  const timeline = [...(current.timeline || [])]
  const key = timelineKey(event)
  const existingIndex = timeline.findIndex((item) => timelineKey(item) === key)
  if (existingIndex >= 0 && event.type !== 'status') {
    timeline[existingIndex] = {
      ...timeline[existingIndex],
      ...event
    }
  } else {
    timeline.push(event)
  }
  updateActiveAssistantMessage({
    timeline
  })
  scrollToBottom()
}

const completeRunningTimelineEvents = () => {
  if (activeAssistantIndex < 0 || !messages.value[activeAssistantIndex]) return
  const current = messages.value[activeAssistantIndex]
  updateActiveAssistantMessage({
    timeline: (current.timeline || []).map((event) => {
      if (event.status === 'running') {
        return {
          ...event,
          status: 'completed'
        }
      }
      return event
    })
  })
}

const send = () => {
  const text = input.value.trim()
  if (!text || loading.value) return

  errorMessage.value = ''
  toolCalls.value = []
  statusText.value = '正在处理...'
  pendingContent = ''
  streamDone = false
  activeAssistantIndex = -1
  stopRenderer()
  loading.value = true

  messages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    content: text
  })

  const assistantMessage: ChatMessage = {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: '',
    timeline: []
  }
  activeAssistantMessageId.value = assistantMessage.id
  messages.value.push(assistantMessage)
  activeAssistantIndex = messages.value.length - 1
  input.value = ''
  scrollToBottom()
  startRenderer()

  cancelStream = streamOpsAssistant(
    {
      message: text,
      session_id: sessionId.value || undefined,
      host_id: selectedHost.value || undefined,
      time_range: timeRange.value ? { from: timeRange.value[0], to: timeRange.value[1] } : undefined
    },
    (event) => {
      if (event.type === 'graph_node') {
        appendTimelineEvent({
          type: 'graph_node',
          node: event.node,
          status: event.status,
          summary: event.summary
        })
      }
      if (event.type === 'tool_call' && event.tool) {
        toolCalls.value.push({
          tool: event.tool,
          summary: event.summary || event.tool,
          status: event.status as OpsAssistantToolCall['status'],
          duration_ms: event.duration_ms
        })
        appendTimelineEvent({
          type: 'tool_call',
          tool: event.tool,
          status: event.status,
          summary: event.summary || event.tool,
          duration_ms: event.duration_ms
        })
        statusText.value = event.summary || '正在查询监控数据...'
        scrollToBottom()
      }
      if (event.type === 'status') {
        statusText.value = event.content || '正在处理...'
        scrollToBottom()
      }
      if (event.type === 'report' && event.report) {
        completeRunningTimelineEvents()
        pendingContent = ''
        stopRenderer()
        updateActiveAssistantMessage({ report: event.report, content: '' })
        statusText.value = '诊断完成'
        scrollToBottom()
      }
      if (event.type === 'report_delta' && event.content) {
        pendingContent += event.content
        startRenderer()
      }
      if (event.type === 'content' && event.content) {
        statusText.value = '正在输出诊断结果...'
        pendingContent += event.content
        startRenderer()
      }
      if (event.type === 'done') {
        if (event.session_id) sessionId.value = event.session_id
        completeRunningTimelineEvents()
        streamDone = true
        if (!pendingContent) {
          loading.value = false
          cancelStream = null
        }
      }
      if (event.type === 'error') {
        errorMessage.value = event.message || '运维助手响应失败'
        loading.value = false
      }
    },
    (error) => {
      errorMessage.value = error.message
      loading.value = false
      cancelStream = null
      activeAssistantIndex = -1
      stopRenderer()
    },
    () => {
      loading.value = false
      cancelStream = null
    }
  )
}

const handleInputEnter = (event: KeyboardEvent) => {
  if (event.shiftKey || event.isComposing) {
    return
  }
  event.preventDefault()
  send()
}

const useExample = (prompt: string) => {
  input.value = prompt
}

const resetConversationState = () => {
  if (cancelStream) {
    cancelStream()
    cancelStream = null
  }
  stopRenderer()
  pendingContent = ''
  streamDone = false
  activeAssistantIndex = -1
  messages.value = []
  toolCalls.value = []
  sessionId.value = ''
  errorMessage.value = ''
  statusText.value = '正在处理...'
  activeAssistantMessageId.value = ''
  loading.value = false
  ElMessage.success('会话已清空')
}

const startNewSession = () => {
  resetConversationState()
  ElMessage.success('已开始新会话')
}

const clearConversation = async () => {
  const currentSessionId = sessionId.value
  resetConversationState()
  if (currentSessionId) {
    try {
      await deleteOpsAssistantSession(currentSessionId)
    } catch (error) {
      console.error('delete ops assistant session failed:', error)
    }
  }
}

const stopStream = () => {
  if (cancelStream) {
    cancelStream()
    cancelStream = null
  }
  stopRenderer()
  pendingContent = ''
  streamDone = false
  activeAssistantIndex = -1
  loading.value = false
  ElMessage.info('已停止生成')
}

const formatMessage = (content: string) => {
  const sanitized = stripThinkBlocks(content)
  const lines = sanitized.split('\n')
  const html: string[] = []
  let listType: 'ul' | 'ol' | null = null

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      closeList()
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      closeList()
      html.push(`<h${heading[1].length} class="md-heading md-h${heading[1].length}">${inlineMarkdown(heading[2])}</h${heading[1].length}>`)
      continue
    }

    const ordered = line.match(/^\d+[.)]\s+(.+)$/)
    if (ordered) {
      if (listType !== 'ol') {
        closeList()
        listType = 'ol'
        html.push('<ol class="md-list">')
      }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`)
      continue
    }

    const unordered = line.match(/^[-*]\s+(.+)$/)
    if (unordered) {
      if (listType !== 'ul') {
        closeList()
        listType = 'ul'
        html.push('<ul class="md-list">')
      }
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`)
      continue
    }

    closeList()
    html.push(`<p class="md-paragraph">${inlineMarkdown(line)}</p>`)
  }

  closeList()
  return html.join('')
}

const stripThinkBlocks = (content: string) => {
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .trim()
}

const inlineMarkdown = (content: string) => {
  return escapeHtml(content)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

const escapeHtml = (content: string) => {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

onMounted(() => {
  loadAgents()
})

onUnmounted(() => {
  if (cancelStream) {
    cancelStream()
  }
  stopRenderer()
})
</script>

<style scoped lang="scss">
.ops-assistant {
  padding: 20px;
  height: calc(100vh - 80px);
  box-sizing: border-box;
}

.assistant-card {
  height: 100%;

  :deep(.el-card__body) {
    height: calc(100% - 82px);
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-sizing: border-box;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #909399;
}

.context-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: #f7f9fc;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.context-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.context-label {
  flex: none;
  font-size: 13px;
  color: #606266;
}

.host-field {
  flex: 0 0 auto;
}

.time-field {
  flex: 0 0 auto;
}

.host-select {
  width: 260px;
}

.time-range {
  width: 260px;

  :deep(.el-range-input) {
    width: 82px;
  }

  :deep(.el-range-separator) {
    flex: 0 0 20px;
    padding: 0;
  }
}

.messages {
  flex: 1;
  min-height: 280px;
  overflow-y: auto;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-guide {
  width: min(760px, 100%);
  text-align: center;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.empty-subtitle {
  font-size: 13px;
  color: #909399;
  margin-bottom: 20px;
}

.example-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  text-align: left;
}

.example-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 78px;
  padding: 14px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  text-align: left;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 4px 14px rgba(64, 158, 255, 0.12);
    transform: translateY(-1px);
  }
}

.example-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.example-desc {
  font-size: 12px;
  line-height: 1.5;
  color: #606266;
}

.message-row {
  display: flex;
  margin-bottom: 14px;

  &.user {
    justify-content: flex-end;

    .message-bubble {
      background: #ecf5ff;
      border-color: #b3d8ff;
    }
  }

  &.assistant {
    justify-content: flex-start;

    .message-bubble {
      background: #fff;
      border-color: #e4e7ed;
    }
  }
}

.message-bubble {
  max-width: min(760px, 86%);
  padding: 12px 14px;
  border: 1px solid;
  border-radius: 6px;
  line-height: 1.7;
  word-break: break-word;
}

.message-role {
  margin-bottom: 6px;
  font-size: 12px;
  color: #909399;
}

.message-content {
  color: #303133;
  font-size: 14px;

  :deep(.md-heading) {
    margin: 14px 0 8px;
    font-weight: 600;
    color: #303133;
    line-height: 1.4;
  }

  :deep(.md-h1) {
    font-size: 20px;
    padding-bottom: 8px;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.md-h2) {
    font-size: 17px;
  }

  :deep(.md-h3),
  :deep(.md-h4) {
    font-size: 15px;
  }

  :deep(.md-paragraph) {
    margin: 8px 0;
    line-height: 1.8;
  }

  :deep(.md-list) {
    margin: 8px 0 12px 20px;
    padding-left: 18px;
    line-height: 1.8;
  }

  :deep(.md-list li) {
    margin: 4px 0;
  }

  :deep(code) {
    padding: 2px 5px;
    border-radius: 4px;
    background: #f0f2f5;
    color: #c45656;
    font-family: Consolas, Monaco, monospace;
    font-size: 13px;
  }
}

.inline-tool-panel {
  margin-bottom: 10px;
  padding: 10px;
  background: #f7f9fc;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.inline-tool-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.inline-tool-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 13px;
  color: #606266;
}

.thinking {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.thinking-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  animation: thinking-pulse 1.2s ease-in-out infinite;
}

@keyframes thinking-pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.45;
  }
  50% {
    transform: scale(1.25);
    opacity: 1;
  }
}

.error-alert {
  flex: none;
}

.input-area {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: end;
}

@media (max-width: 768px) {
  .ops-assistant {
    padding: 12px;
    height: auto;
    min-height: calc(100vh - 80px);
  }

  .context-field,
  .host-select,
  .time-range {
    width: 100%;
  }

  .host-field,
  .time-field {
    flex: 1 1 100%;
  }

  .example-grid {
    grid-template-columns: 1fr;
  }

  .input-area {
    grid-template-columns: 1fr;
  }

  .message-bubble {
    max-width: 94%;
  }
}
</style>
