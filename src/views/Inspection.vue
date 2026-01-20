<template>
  <div class="inspection-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>
            <el-icon><Search /></el-icon>
            智能巡检与日报生成
          </span>
          <div>
            <el-date-picker
              v-model="inspectionDate"
              type="date"
              placeholder="选择巡检日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 180px; margin-right: 10px"
            />
            <el-button type="primary" @click="handleRunInspection" :loading="running">
              <el-icon><VideoPlay /></el-icon>
              执行巡检
            </el-button>
            <el-button @click="loadReports">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 巡检报告列表 -->
      <el-table
        v-loading="loading"
        :data="reports"
        stripe
        style="width: 100%"
        empty-text="暂无巡检报告"
      >
        <el-table-column prop="date" label="巡检日期" width="120" sortable>
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_hosts" label="总主机数" width="100">
          <template #default="{ row }">
            {{ row.total_hosts || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="online_hosts" label="在线" width="80">
          <template #default="{ row }">
            <el-tag type="success">{{ row.online_hosts || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="offline_hosts" label="离线" width="80">
          <template #default="{ row }">
            <el-tag type="info">{{ row.offline_hosts || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warning_hosts" label="告警" width="80">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.warning_hosts || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="critical_hosts" label="严重" width="80">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.critical_hosts || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleViewReport(row)"
            >
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
            <el-button
              v-if="row.status === 'completed'"
              type="success"
              size="small"
              link
              @click="handleGenerateReport(row)"
              :loading="generatingReportId === row.id"
            >
              <el-icon><Document /></el-icon>
              生成日报
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 报告详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="巡检报告详情"
      width="1200px"
      :close-on-click-modal="false"
    >
      <div v-if="currentReport" class="report-detail">
        <!-- 报告概览 -->
        <el-descriptions :column="4" border>
          <el-descriptions-item label="巡检日期">
            {{ formatDate(currentReport.date) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentReport.status)">
              {{ getStatusName(currentReport.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatDateTime(currentReport.start_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间" v-if="currentReport.end_time">
            {{ formatDateTime(currentReport.end_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="总主机数">
            {{ currentReport.total_hosts }}
          </el-descriptions-item>
          <el-descriptions-item label="在线主机">
            <el-tag type="success">{{ currentReport.online_hosts }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="离线主机">
            <el-tag type="info">{{ currentReport.offline_hosts }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="告警主机">
            <el-tag type="warning">{{ currentReport.warning_hosts }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- Tab页：记录列表和日报 -->
        <el-tabs v-model="detailTab" style="margin-top: 20px">
          <el-tab-pane label="巡检记录" name="records">
            <el-table
              :data="currentReport.records || []"
              stripe
              style="width: 100%; margin-top: 20px"
              max-height="500"
            >
              <el-table-column prop="hostname" label="主机名" width="150" />
              <el-table-column prop="host_id" label="主机ID" width="120" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)">
                    {{ getStatusName(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="cpu_usage" label="CPU" width="80">
                <template #default="{ row }">
                  {{ row.cpu_usage.toFixed(1) }}%
                </template>
              </el-table-column>
              <el-table-column prop="memory_usage" label="内存" width="80">
                <template #default="{ row }">
                  {{ row.memory_usage.toFixed(1) }}%
                </template>
              </el-table-column>
              <el-table-column prop="disk_usage" label="磁盘" width="80">
                <template #default="{ row }">
                  {{ row.disk_usage.toFixed(1) }}%
                </template>
              </el-table-column>
              <el-table-column prop="service_running" label="运行服务" width="100" />
              <el-table-column prop="alert_count" label="告警数" width="80" />
              <el-table-column label="问题" min-width="200">
                <template #default="{ row }">
                  <div v-if="row.issues && row.issues.length > 0">
                    <el-tag
                      v-for="(issue, idx) in row.issues"
                      :key="idx"
                      type="danger"
                      size="small"
                      style="margin-right: 5px; margin-bottom: 5px"
                    >
                      {{ issue }}
                    </el-tag>
                  </div>
                  <span v-else style="color: #999">无</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="巡检日报" name="report">
            <div class="report-content">
              <div v-if="reportGenerating" class="report-loading">
                <div class="loading-animation">
                  <div class="robot-container">
                    <div class="robot">
                      <div class="robot-head">
                        <div class="robot-eye left-eye"></div>
                        <div class="robot-eye right-eye"></div>
                        <div class="robot-mouth"></div>
                      </div>
                      <div class="robot-body">
                        <div class="robot-panel"></div>
                      </div>
                      <div class="robot-arm left-arm"></div>
                      <div class="robot-arm right-arm"></div>
                    </div>
                  </div>
                </div>
                <p>AI正在生成巡检日报...</p>
              </div>
              <div v-else-if="reportContent" class="markdown-content" v-html="formatMarkdown(reportContent)"></div>
              <el-empty v-else description="点击生成日报按钮生成巡检日报" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentReport && currentReport.status === 'completed'"
          type="primary"
          @click="handleGenerateReport(currentReport)"
          :loading="generatingReportId === currentReport?.id"
        >
          <el-icon><Document /></el-icon>
          {{ reportContent ? '重新生成日报' : '生成日报' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, VideoPlay, Refresh, View, Document } from '@element-plus/icons-vue'
import {
  runInspection,
  listInspectionReports,
  getInspectionReport,
  streamInspectionReport,
  type InspectionReport
} from '@/api/inspection'

const loading = ref(false)
const running = ref(false)
const reports = ref<InspectionReport[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const inspectionDate = ref<string>('')

const detailDialogVisible = ref(false)
const currentReport = ref<InspectionReport | null>(null)
const detailTab = ref('records')
const reportContent = ref('')
const reportGenerating = ref(false)
const generatingReportId = ref<number | null>(null)
let reportStreamCancelFn: (() => void) | null = null

// 加载报告列表
const loadReports = async () => {
  loading.value = true
  try {
    const res = await listInspectionReports({
      page: currentPage.value,
      page_size: pageSize.value
    })
    const data = res.data || res
    console.log('[Frontend] API响应:', res)
    console.log('[Frontend] 解析后的数据:', data)
    reports.value = data.items || []
    total.value = data.total || 0
    console.log('[Frontend] 报告列表:', reports.value)
    if (reports.value.length > 0) {
      console.log('[Frontend] 第一个报告数据:', reports.value[0])
      console.log('[Frontend] 第一个报告的统计:', {
        total_hosts: reports.value[0].total_hosts,
        online_hosts: reports.value[0].online_hosts,
        offline_hosts: reports.value[0].offline_hosts,
        warning_hosts: reports.value[0].warning_hosts,
        critical_hosts: reports.value[0].critical_hosts
      })
    }
  } catch (error: any) {
    ElMessage.error('加载报告列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 执行巡检
const handleRunInspection = async () => {
  if (running.value) return

  running.value = true
  try {
    await runInspection(inspectionDate.value || undefined)
    ElMessage.success('巡检任务已启动，请稍候查看结果')
    // 等待一下再刷新列表
    setTimeout(() => {
      loadReports()
    }, 2000)
  } catch (error: any) {
    ElMessage.error('启动巡检失败：' + (error.message || '未知错误'))
  } finally {
    running.value = false
  }
}

// 查看报告详情
const handleViewReport = async (report: InspectionReport) => {
  try {
    const res = await getInspectionReport(report.id)
    const data = res.data || res
    currentReport.value = data
    detailDialogVisible.value = true
    detailTab.value = 'records'
    
    // 如果报告已完成且有内容，显示日报
    if (data.status === 'completed' && data.report_content) {
      reportContent.value = data.report_content
      console.log(`[Frontend] 从数据库加载报告内容，长度=${data.report_content.length}`)
      console.log(`[Frontend] 内容检查: 包含'六'=${data.report_content.includes('六')}, 包含'七'=${data.report_content.includes('七')}, 包含'八'=${data.report_content.includes('八')}`)
    } else {
      reportContent.value = ''
    }
  } catch (error: any) {
    ElMessage.error('获取报告详情失败：' + (error.message || '未知错误'))
  }
}

// 生成日报
const handleGenerateReport = async (report: InspectionReport) => {
  if (report.status !== 'completed') {
    ElMessage.warning('只能为已完成的巡检报告生成日报')
    return
  }

  // 防止重复调用
  if (reportGenerating.value || generatingReportId.value === report.id) {
    console.log('[Frontend] 日报正在生成中，跳过重复调用')
    return
  }

  reportGenerating.value = true
  reportContent.value = ''
  generatingReportId.value = report.id

  // 清除之前的流式连接
  if (reportStreamCancelFn) {
    reportStreamCancelFn()
    reportStreamCancelFn = null
  }

  console.log('[Frontend] 开始生成日报，ReportID:', report.id)
  reportStreamCancelFn = streamInspectionReport(
    report.id,
    (chunk) => {
      if (chunk.error) {
        console.error('流式生成日报错误:', chunk.error)
        reportGenerating.value = false
        generatingReportId.value = null
        if (reportStreamCancelFn) {
          reportStreamCancelFn()
          reportStreamCancelFn = null
        }
        ElMessage.error('生成日报失败：' + chunk.error)
        return
      }

      if (chunk.content) {
        reportContent.value += chunk.content
        console.log(`[Frontend] 收到chunk内容，长度=${chunk.content.length}，当前总长度=${reportContent.value.length}`)
        // 切换到日报标签页
        if (detailTab.value !== 'report') {
          detailTab.value = 'report'
        }
      }

      if (chunk.done) {
        console.log(`[Frontend] 流式输出完成，最终内容长度=${reportContent.value.length}`)
        console.log(`[Frontend] 内容检查: 包含'六'=${reportContent.value.includes('六')}, 包含'七'=${reportContent.value.includes('七')}, 包含'八'=${reportContent.value.includes('八')}`)
        reportGenerating.value = false
        generatingReportId.value = null
        if (reportStreamCancelFn) {
          reportStreamCancelFn()
          reportStreamCancelFn = null
        }
        ElMessage.success('日报生成完成')
        // 刷新当前报告数据以获取保存到数据库的内容
        if (currentReport.value) {
          handleViewReport(currentReport.value)
        }
      }
    },
    (error) => {
      console.error('流式生成日报连接错误:', error)
      reportGenerating.value = false
      generatingReportId.value = null
      if (reportStreamCancelFn) {
        reportStreamCancelFn()
        reportStreamCancelFn = null
      }
      ElMessage.error('生成日报连接失败：' + (error.message || '未知错误'))
    },
    () => {
      reportGenerating.value = false
      generatingReportId.value = null
      if (reportStreamCancelFn) {
        reportStreamCancelFn()
        reportStreamCancelFn = null
      }
    }
  )
}

// 分页
const handleSizeChange = () => {
  currentPage.value = 1
  loadReports()
}

const handlePageChange = () => {
  loadReports()
}

// 辅助函数
const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    running: 'warning',
    completed: 'success',
    failed: 'danger',
    online: 'success',
    offline: 'info',
    warning: 'warning',
    critical: 'danger'
  }
  return map[status] || 'info'
}

const getStatusName = (status: string) => {
  const map: Record<string, string> = {
    running: '执行中',
    completed: '已完成',
    failed: '失败',
    online: '在线',
    offline: '离线',
    warning: '告警',
    critical: '严重'
  }
  return map[status] || status
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (datetime: string) => {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleString('zh-CN')
}

// Markdown格式化
const formatMarkdown = (text: string) => {
  if (!text) return ''
  
  // 简单的Markdown转HTML
  return text
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/\n/gim, '<br>')
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped lang="scss">
.inspection-container {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: bold;

    span {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

.report-detail {
  .report-content {
    min-height: 400px;
    max-height: 600px;
    overflow-y: auto;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-top: 20px;

    .report-loading {
      text-align: center;
      padding: 40px;

      .loading-animation {
        margin-bottom: 20px;
      }

      p {
        color: #606266;
        font-size: 14px;
      }
    }

    .markdown-content {
      line-height: 1.8;
      color: #606266;

      h1, h2, h3, h4 {
        margin: 20px 0 10px 0;
        color: #303133;
        font-weight: bold;
      }

      h1 {
        font-size: 24px;
        border-bottom: 3px solid #409EFF;
        padding-bottom: 10px;
      }

      h2 {
        font-size: 20px;
        border-bottom: 2px solid #409EFF;
        padding-bottom: 8px;
        margin-top: 24px;
      }

      h3 {
        font-size: 18px;
        color: #409EFF;
        margin-top: 20px;
      }

      h4 {
        font-size: 16px;
        color: #67C23A;
      }

      ul, ol {
        margin: 10px 0;
        padding-left: 24px;

        li {
          margin: 8px 0;
          line-height: 1.6;
        }
      }

      p {
        margin: 12px 0;
        line-height: 1.8;
      }

      strong {
        color: #303133;
        font-weight: bold;
      }
    }
  }
}

// 加载动画样式
.loading-animation {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;

  .robot-container {
    width: 120px;
    height: 120px;
    position: relative;

    .robot {
      width: 100%;
      height: 100%;
      position: relative;
      animation: float 3s ease-in-out infinite;

      .robot-head {
        width: 60px;
        height: 60px;
        background: #409EFF;
        border-radius: 50%;
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        justify-content: center;
        align-items: center;

        .robot-eye {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          position: absolute;
          animation: blink 2s infinite;

          &.left-eye {
            left: 18px;
          }

          &.right-eye {
            right: 18px;
          }
        }

        .robot-mouth {
          width: 20px;
          height: 10px;
          border: 2px solid white;
          border-top: none;
          border-radius: 0 0 20px 20px;
          position: absolute;
          bottom: 12px;
        }
      }

      .robot-body {
        width: 70px;
        height: 50px;
        background: #409EFF;
        border-radius: 8px;
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        justify-content: center;
        align-items: center;

        .robot-panel {
          width: 40px;
          height: 30px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          animation: pulse 2s infinite;
        }
      }

      .robot-arm {
        width: 8px;
        height: 30px;
        background: #409EFF;
        border-radius: 4px;
        position: absolute;
        top: 30px;
        animation: wave 2s infinite;

        &.left-arm {
          left: 5px;
          transform-origin: top;
        }

        &.right-arm {
          right: 5px;
          transform-origin: top;
          animation-delay: 0.5s;
        }
      }
    }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes blink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-20deg); }
}
</style>
