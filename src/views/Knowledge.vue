<template>
  <div class="knowledge-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>
            <el-icon><Document /></el-icon>
            知识库
          </span>
          <el-button type="primary" @click="showSearchDialog = true">
            <el-icon><Search /></el-icon>
            AI智能搜索
          </el-button>
        </div>
      </template>

      <!-- Tab页 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 故障处理知识库 Tab -->
        <el-tab-pane label="故障处理知识库" name="troubleshooting">
          <template #label>
            <span>
              <el-icon><Warning /></el-icon>
              故障处理知识库
            </span>
          </template>

          <KnowledgeList
            ref="troubleshootingListRef"
            :category="'troubleshooting'"
            :columns="troubleshootingColumns"
            :filters="troubleshootingFilters"
            :api-functions="troubleshootingAPIs"
            @create="handleCreateTroubleshooting"
            @edit="handleEditTroubleshooting"
            @delete="handleDeleteTroubleshooting"
            @view="handleViewTroubleshooting"
          />
        </el-tab-pane>

        <!-- 最佳实践文档 Tab -->
        <el-tab-pane label="最佳实践文档" name="best-practices">
          <template #label>
            <span>
              <el-icon><Star /></el-icon>
              最佳实践文档
            </span>
          </template>

          <KnowledgeList
            ref="bestPracticeListRef"
            :category="'best-practices'"
            :columns="bestPracticeColumns"
            :filters="bestPracticeFilters"
            :api-functions="bestPracticeAPIs"
            @create="handleCreateBestPractice"
            @edit="handleEditBestPractice"
            @delete="handleDeleteBestPractice"
            @view="handleViewBestPractice"
          />
        </el-tab-pane>

        <!-- 故障案例库 Tab -->
        <el-tab-pane label="故障案例库" name="case-studies">
          <template #label>
            <span>
              <el-icon><Files /></el-icon>
              故障案例库
            </span>
          </template>

          <KnowledgeList
            ref="caseStudyListRef"
            :category="'case-studies'"
            :columns="caseStudyColumns"
            :filters="caseStudyFilters"
            :api-functions="caseStudyAPIs"
            @create="handleCreateCaseStudy"
            @edit="handleEditCaseStudy"
            @delete="handleDeleteCaseStudy"
            @view="handleViewCaseStudy"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- AI智能搜索对话框 -->
    <el-dialog
      v-model="showSearchDialog"
      title="AI智能搜索"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="search-dialog">
        <el-form :inline="true">
          <el-form-item label="搜索关键词">
            <el-input
              v-model="searchQuery"
              placeholder="请输入搜索关键词"
              style="width: 300px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="搜索范围">
            <el-select v-model="searchCategory" style="width: 200px">
              <el-option label="全部" value="" />
              <el-option label="故障处理知识库" value="troubleshooting" />
              <el-option label="最佳实践文档" value="best_practice" />
              <el-option label="故障案例库" value="case_study" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" :loading="searching">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 搜索结果 -->
        <div v-if="searchResult || searching" class="search-result">
          <div v-if="searching" class="search-loading">
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
            <p>AI正在搜索知识库...</p>
          </div>
          <div v-else-if="searchResult" class="search-content">
            <div class="markdown-content" v-html="formatMarkdown(searchResult)"></div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showSearchDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 详情/编辑对话框 -->
    <KnowledgeDetailDialog
      v-model="detailDialogVisible"
      :category="currentCategory"
      :item="currentItem"
      :mode="dialogMode"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Search, Warning, Star, Files, View, Edit, Delete, Plus, Refresh } from '@element-plus/icons-vue'
import type { ComponentPublicInstance } from 'vue'
import {
  listTroubleshootingGuides,
  getTroubleshootingGuide,
  createTroubleshootingGuide,
  updateTroubleshootingGuide,
  deleteTroubleshootingGuide,
  listBestPractices,
  getBestPractice,
  createBestPractice,
  updateBestPractice,
  deleteBestPractice,
  listCaseStudies,
  getCaseStudy,
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
  streamKnowledgeSearch,
  type TroubleshootingGuide,
  type BestPractice,
  type CaseStudy
} from '@/api/knowledge'
import KnowledgeList from './components/KnowledgeList.vue'
import KnowledgeDetailDialog from './components/KnowledgeDetailDialog.vue'

const activeTab = ref('troubleshooting')
const showSearchDialog = ref(false)
const searchQuery = ref('')
const searchCategory = ref('')
const searching = ref(false)
const searchResult = ref('')
let searchStreamCancelFn: (() => void) | null = null

const detailDialogVisible = ref(false)
const currentCategory = ref<'troubleshooting' | 'best-practices' | 'case-studies'>('troubleshooting')
const currentItem = ref<any>(null)
const dialogMode = ref<'view' | 'edit' | 'create'>('view')

// 列表组件引用
const troubleshootingListRef = ref<ComponentPublicInstance | null>(null)
const bestPracticeListRef = ref<ComponentPublicInstance | null>(null)
const caseStudyListRef = ref<ComponentPublicInstance | null>(null)

// Tab切换处理
const handleTabChange = (tab: string) => {
  // 可以在这里添加切换逻辑
}

// 故障处理知识库配置
const troubleshootingColumns = [
  { prop: 'title', label: '标题', width: 200 },
  { prop: 'problem_type', label: '问题类型', width: 120 },
  { prop: 'severity', label: '严重程度', width: 120 },
  { prop: 'author', label: '作者', width: 120 },
  { prop: 'view_count', label: '查看次数', width: 100 },
  { prop: 'created_at', label: '创建时间', width: 180 }
]

const troubleshootingFilters = [
  { key: 'problem_type', label: '问题类型', options: [
    { label: '全部', value: '' },
    { label: 'CPU', value: 'cpu' },
    { label: '内存', value: 'memory' },
    { label: '磁盘', value: 'disk' },
    { label: '网络', value: 'network' },
    { label: '应用', value: 'application' }
  ]},
  { key: 'severity', label: '严重程度', options: [
    { label: '全部', value: '' },
    { label: '严重', value: 'critical' },
    { label: '高', value: 'high' },
    { label: '中', value: 'medium' },
    { label: '低', value: 'low' }
  ]}
]

const troubleshootingAPIs = {
  list: listTroubleshootingGuides,
  get: getTroubleshootingGuide,
  create: createTroubleshootingGuide,
  update: updateTroubleshootingGuide,
  delete: deleteTroubleshootingGuide
}

// 最佳实践文档配置
const bestPracticeColumns = [
  { prop: 'title', label: '标题', width: 200 },
  { prop: 'domain', label: '领域', width: 120 },
  { prop: 'author', label: '作者', width: 120 },
  { prop: 'view_count', label: '查看次数', width: 100 },
  { prop: 'created_at', label: '创建时间', width: 180 }
]

const bestPracticeFilters = [
  { key: 'domain', label: '领域', options: [
    { label: '全部', value: '' },
    { label: '监控', value: 'monitoring' },
    { label: '告警', value: 'alerting' },
    { label: '优化', value: 'optimization' },
    { label: '安全', value: 'security' }
  ]}
]

const bestPracticeAPIs = {
  list: listBestPractices,
  get: getBestPractice,
  create: createBestPractice,
  update: updateBestPractice,
  delete: deleteBestPractice
}

// 故障案例库配置
const caseStudyColumns = [
  { prop: 'title', label: '标题', width: 200 },
  { prop: 'hostname', label: '主机', width: 150 },
  { prop: 'problem_type', label: '问题类型', width: 120 },
  { prop: 'severity', label: '严重程度', width: 120 },
  { prop: 'incident_date', label: '发生时间', width: 180 },
  { prop: 'view_count', label: '查看次数', width: 100 }
]

const caseStudyFilters = [
  { key: 'problem_type', label: '问题类型', options: [
    { label: '全部', value: '' },
    { label: 'CPU', value: 'cpu' },
    { label: '内存', value: 'memory' },
    { label: '磁盘', value: 'disk' },
    { label: '网络', value: 'network' },
    { label: '应用', value: 'application' }
  ]},
  { key: 'severity', label: '严重程度', options: [
    { label: '全部', value: '' },
    { label: '严重', value: 'critical' },
    { label: '高', value: 'high' },
    { label: '中', value: 'medium' },
    { label: '低', value: 'low' }
  ]}
]

const caseStudyAPIs = {
  list: listCaseStudies,
  get: getCaseStudy,
  create: createCaseStudy,
  update: updateCaseStudy,
  delete: deleteCaseStudy
}

// 事件处理
const handleCreateTroubleshooting = () => {
  currentCategory.value = 'troubleshooting'
  currentItem.value = null
  dialogMode.value = 'create'
  detailDialogVisible.value = true
}

const handleEditTroubleshooting = (item: TroubleshootingGuide) => {
  currentCategory.value = 'troubleshooting'
  currentItem.value = item
  dialogMode.value = 'edit'
  detailDialogVisible.value = true
}

const handleViewTroubleshooting = (item: TroubleshootingGuide) => {
  currentCategory.value = 'troubleshooting'
  currentItem.value = item
  dialogMode.value = 'view'
  detailDialogVisible.value = true
}

const handleDeleteTroubleshooting = async (item: TroubleshootingGuide) => {
  try {
    await ElMessageBox.confirm('确定要删除这条故障处理知识库吗？', '确认删除', {
      type: 'warning'
    })
    await deleteTroubleshootingGuide(item.id)
    ElMessage.success('删除成功')
    // 刷新列表
    if (troubleshootingListRef.value && 'loadData' in troubleshootingListRef.value) {
      (troubleshootingListRef.value as any).loadData()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }
}

const handleCreateBestPractice = () => {
  currentCategory.value = 'best-practices'
  currentItem.value = null
  dialogMode.value = 'create'
  detailDialogVisible.value = true
}

const handleEditBestPractice = (item: BestPractice) => {
  currentCategory.value = 'best-practices'
  currentItem.value = item
  dialogMode.value = 'edit'
  detailDialogVisible.value = true
}

const handleViewBestPractice = (item: BestPractice) => {
  currentCategory.value = 'best-practices'
  currentItem.value = item
  dialogMode.value = 'view'
  detailDialogVisible.value = true
}

const handleDeleteBestPractice = async (item: BestPractice) => {
  try {
    await ElMessageBox.confirm('确定要删除这条最佳实践文档吗？', '确认删除', {
      type: 'warning'
    })
    await deleteBestPractice(item.id)
    ElMessage.success('删除成功')
    if (bestPracticeListRef.value && 'loadData' in bestPracticeListRef.value) {
      (bestPracticeListRef.value as any).loadData()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }
}

const handleCreateCaseStudy = () => {
  currentCategory.value = 'case-studies'
  currentItem.value = null
  dialogMode.value = 'create'
  detailDialogVisible.value = true
}

const handleEditCaseStudy = (item: CaseStudy) => {
  currentCategory.value = 'case-studies'
  currentItem.value = item
  dialogMode.value = 'edit'
  detailDialogVisible.value = true
}

const handleViewCaseStudy = (item: CaseStudy) => {
  currentCategory.value = 'case-studies'
  currentItem.value = item
  dialogMode.value = 'view'
  detailDialogVisible.value = true
}

const handleDeleteCaseStudy = async (item: CaseStudy) => {
  try {
    await ElMessageBox.confirm('确定要删除这条故障案例吗？', '确认删除', {
      type: 'warning'
    })
    await deleteCaseStudy(item.id)
    ElMessage.success('删除成功')
    if (caseStudyListRef.value && 'loadData' in caseStudyListRef.value) {
      (caseStudyListRef.value as any).loadData()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }
}

const handleSave = () => {
  detailDialogVisible.value = false
  // 刷新列表
  if (currentCategory.value === 'troubleshooting' && troubleshootingListRef.value && 'loadData' in troubleshootingListRef.value) {
    (troubleshootingListRef.value as any).loadData()
  } else if (currentCategory.value === 'best-practices' && bestPracticeListRef.value && 'loadData' in bestPracticeListRef.value) {
    (bestPracticeListRef.value as any).loadData()
  } else if (currentCategory.value === 'case-studies' && caseStudyListRef.value && 'loadData' in caseStudyListRef.value) {
    (caseStudyListRef.value as any).loadData()
  }
}

// AI搜索
const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  searching.value = true
  searchResult.value = ''

  // 清除之前的流式连接
  if (searchStreamCancelFn) {
    searchStreamCancelFn()
    searchStreamCancelFn = null
  }

  // 转换category格式
  let category = searchCategory.value
  if (category === 'troubleshooting') {
    category = 'troubleshooting'
  } else if (category === 'best-practices') {
    category = 'best_practice'
  } else if (category === 'case-studies') {
    category = 'case_study'
  }

  searchStreamCancelFn = streamKnowledgeSearch(
    {
      q: searchQuery.value,
      category: category || undefined
    },
    (chunk) => {
      if (chunk.error) {
        console.error('流式搜索错误:', chunk.error)
        searching.value = false
        if (searchStreamCancelFn) {
          searchStreamCancelFn()
          searchStreamCancelFn = null
        }
        ElMessage.error('搜索失败：' + chunk.error)
        return
      }

      if (chunk.content) {
        searchResult.value += chunk.content
      }

      if (chunk.done) {
        searching.value = false
        if (searchStreamCancelFn) {
          searchStreamCancelFn()
          searchStreamCancelFn = null
        }
        ElMessage.success('搜索完成')
      }
    },
    (error) => {
      console.error('流式搜索连接错误:', error)
      searching.value = false
      if (searchStreamCancelFn) {
        searchStreamCancelFn()
        searchStreamCancelFn = null
      }
      ElMessage.error('搜索连接失败：' + (error.message || '未知错误'))
    },
    () => {
      searching.value = false
      if (searchStreamCancelFn) {
        searchStreamCancelFn()
        searchStreamCancelFn = null
      }
    }
  )
}

// Markdown格式化
const formatMarkdown = (text: string) => {
  if (!text) return ''
  
  // 简单的Markdown转HTML
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n/gim, '<br>')
}
</script>

<style scoped lang="scss">
.knowledge-container {
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
}

.search-dialog {
  .search-result {
    margin-top: 20px;
    min-height: 200px;
    max-height: 500px;
    overflow-y: auto;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 4px;

    .search-loading {
      text-align: center;
      padding: 40px;

      .loading-animation {
        margin-bottom: 20px;
      }
    }

    .search-content {
      .markdown-content {
        line-height: 1.8;
        color: #606266;

        h1, h2, h3 {
          margin: 16px 0 8px 0;
          color: #303133;
        }

        h2 {
          font-size: 18px;
          border-bottom: 2px solid #409EFF;
          padding-bottom: 8px;
        }

        h3 {
          font-size: 16px;
          color: #409EFF;
        }

        ul {
          margin: 10px 0;
          padding-left: 24px;

          li {
            margin: 8px 0;
            line-height: 1.6;
          }
        }

        p {
          margin: 10px 0;
          line-height: 1.8;
        }
      }
    }
  }
}

// 加载动画样式（复用AIAnalysis的样式）
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
