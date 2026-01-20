<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="900px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      v-loading="saving"
    >
      <!-- 基础信息 -->
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入标题"
          :disabled="mode === 'view'"
        />
      </el-form-item>

      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="formData.tags"
          multiple
          filterable
          allow-create
          placeholder="选择或输入标签"
          style="width: 100%"
          :disabled="mode === 'view'"
        />
      </el-form-item>

      <el-form-item label="内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="10"
          placeholder="请输入内容"
          :disabled="mode === 'view'"
        />
      </el-form-item>

      <el-form-item label="摘要">
        <el-input
          v-model="formData.summary"
          type="textarea"
          :rows="3"
          placeholder="请输入摘要（可选，LLM可自动生成）"
          :disabled="mode === 'view'"
        />
      </el-form-item>

      <el-form-item label="作者">
        <el-input
          v-model="formData.author"
          placeholder="请输入作者"
          :disabled="mode === 'view'"
        />
      </el-form-item>

      <el-form-item label="发布状态">
        <el-switch
          v-model="formData.is_published"
          :disabled="mode === 'view'"
        />
      </el-form-item>

      <!-- 故障处理知识库特有字段 -->
      <template v-if="category === 'troubleshooting'">
        <el-form-item label="问题类型" prop="problem_type">
          <el-select
            v-model="formData.problem_type"
            placeholder="请选择问题类型"
            style="width: 100%"
            :disabled="mode === 'view'"
          >
            <el-option label="CPU" value="cpu" />
            <el-option label="内存" value="memory" />
            <el-option label="磁盘" value="disk" />
            <el-option label="网络" value="network" />
            <el-option label="应用" value="application" />
          </el-select>
        </el-form-item>

        <el-form-item label="严重程度" prop="severity">
          <el-select
            v-model="formData.severity"
            placeholder="请选择严重程度"
            style="width: 100%"
            :disabled="mode === 'view'"
          >
            <el-option label="严重" value="critical" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>

        <el-form-item label="症状描述">
          <el-input
            v-model="symptomsText"
            type="textarea"
            :rows="4"
            placeholder="请输入症状描述，每行一条"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="根本原因">
          <el-input
            v-model="rootCausesText"
            type="textarea"
            :rows="4"
            placeholder="请输入根本原因，每行一条"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="解决方案">
          <el-input
            v-model="solutionsText"
            type="textarea"
            :rows="5"
            placeholder="请输入解决方案，每行一条"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="预防建议">
          <el-input
            v-model="preventionTipsText"
            type="textarea"
            :rows="4"
            placeholder="请输入预防建议，每行一条"
            :disabled="mode === 'view'"
          />
        </el-form-item>
      </template>

      <!-- 最佳实践文档特有字段 -->
      <template v-if="category === 'best-practices'">
        <el-form-item label="领域" prop="domain">
          <el-select
            v-model="formData.domain"
            placeholder="请选择领域"
            style="width: 100%"
            :disabled="mode === 'view'"
          >
            <el-option label="监控" value="monitoring" />
            <el-option label="告警" value="alerting" />
            <el-option label="优化" value="optimization" />
            <el-option label="安全" value="security" />
          </el-select>
        </el-form-item>

        <el-form-item label="适用场景">
          <el-input
            v-model="formData.applicability"
            placeholder="请输入适用场景"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="收益">
          <el-input
            v-model="benefitsText"
            type="textarea"
            :rows="4"
            placeholder="请输入收益，每行一条"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="实施步骤">
          <el-input
            v-model="implementationText"
            type="textarea"
            :rows="5"
            placeholder="请输入实施步骤，每行一条"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="参考资源">
          <el-input
            v-model="referencesText"
            type="textarea"
            :rows="3"
            placeholder="请输入参考资源，每行一条（如：URL、文档链接等）"
            :disabled="mode === 'view'"
          />
        </el-form-item>
      </template>

      <!-- 故障案例库特有字段 -->
      <template v-if="category === 'case-studies'">
        <el-form-item label="事件发生时间" prop="incident_date">
          <el-date-picker
            v-model="formData.incident_date"
            type="datetime"
            placeholder="选择事件发生时间"
            style="width: 100%"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="解决时间">
          <el-date-picker
            v-model="formData.resolved_date"
            type="datetime"
            placeholder="选择解决时间（可选）"
            style="width: 100%"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="相关主机ID">
          <el-input
            v-model="formData.host_id"
            placeholder="请输入主机ID（可选）"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="主机名">
          <el-input
            v-model="formData.hostname"
            placeholder="请输入主机名（可选）"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="问题类型" prop="problem_type">
          <el-select
            v-model="formData.problem_type"
            placeholder="请选择问题类型"
            style="width: 100%"
            :disabled="mode === 'view'"
          >
            <el-option label="CPU" value="cpu" />
            <el-option label="内存" value="memory" />
            <el-option label="磁盘" value="disk" />
            <el-option label="网络" value="network" />
            <el-option label="应用" value="application" />
          </el-select>
        </el-form-item>

        <el-form-item label="严重程度" prop="severity">
          <el-select
            v-model="formData.severity"
            placeholder="请选择严重程度"
            style="width: 100%"
            :disabled="mode === 'view'"
          >
            <el-option label="严重" value="critical" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>

        <el-form-item label="影响范围">
          <el-input
            v-model="formData.impact"
            type="textarea"
            :rows="3"
            placeholder="请输入影响范围"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="时间线">
          <el-input
            v-model="formData.timeline"
            type="textarea"
            :rows="3"
            placeholder="请输入时间线"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="解决方案">
          <el-input
            v-model="formData.resolution"
            type="textarea"
            :rows="5"
            placeholder="请输入解决方案"
            :disabled="mode === 'view'"
          />
        </el-form-item>

        <el-form-item label="经验教训">
          <el-input
            v-model="formData.lessons_learned"
            type="textarea"
            :rows="5"
            placeholder="请输入经验教训"
            :disabled="mode === 'view'"
          />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button v-if="mode !== 'view'" type="primary" @click="handleSave" :loading="saving">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  createTroubleshootingGuide,
  updateTroubleshootingGuide,
  createBestPractice,
  updateBestPractice,
  createCaseStudy,
  updateCaseStudy
} from '@/api/knowledge'

interface Props {
  modelValue: boolean
  category: 'troubleshooting' | 'best-practices' | 'case-studies'
  item?: any
  mode: 'view' | 'edit' | 'create'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: []
}>()

const formRef = ref<FormInstance>()
const saving = ref(false)

const dialogTitle = computed(() => {
  if (props.mode === 'view') return '查看详情'
  if (props.mode === 'edit') return '编辑'
  return '新增'
})

// 文本字段（用于多行输入，保存时转换为数组）
const symptomsText = ref('')
const rootCausesText = ref('')
const solutionsText = ref('')
const preventionTipsText = ref('')
const benefitsText = ref('')
const implementationText = ref('')
const referencesText = ref('')

// 将数组转换为文本（用换行符连接）
const arrayToText = (arr: string[]): string => {
  if (!arr || arr.length === 0) return ''
  return arr.join('\n')
}

// 将文本转换为数组（按行分割，过滤空行）
const textToArray = (text: string): string[] => {
  if (!text) return []
  return text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
}

const formData = reactive<any>({
  title: '',
  tags: [],
  content: '',
  summary: '',
  author: '',
  is_published: true,
  // 故障处理知识库
  problem_type: '',
  severity: 'medium',
  symptoms: [],
  root_causes: [],
  solutions: [],
  prevention_tips: [],
  related_cases: [],
  // 最佳实践文档
  domain: '',
  applicability: '',
  benefits: [],
  implementation: [],
  references: [],
  // 故障案例库
  incident_date: new Date(),
  resolved_date: undefined,
  host_id: '',
  hostname: '',
  impact: '',
  timeline: '',
  resolution: '',
  lessons_learned: '',
  related_guides: []
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

// 监听item变化，填充表单
watch(() => props.item, (newItem) => {
  if (newItem) {
    Object.assign(formData, {
      title: newItem.title || '',
      tags: newItem.tags || [],
      content: newItem.content || '',
      summary: newItem.summary || '',
      author: newItem.author || '',
      is_published: newItem.is_published !== undefined ? newItem.is_published : true,
      problem_type: newItem.problem_type || '',
      severity: newItem.severity || 'medium',
      symptoms: newItem.symptoms || [],
      root_causes: newItem.root_causes || [],
      solutions: newItem.solutions || [],
      prevention_tips: newItem.prevention_tips || [],
      related_cases: newItem.related_cases || [],
      domain: newItem.domain || '',
      applicability: newItem.applicability || '',
      benefits: newItem.benefits || [],
      implementation: newItem.implementation || [],
      references: newItem.references || [],
      incident_date: newItem.incident_date ? new Date(newItem.incident_date) : new Date(),
      resolved_date: newItem.resolved_date ? new Date(newItem.resolved_date) : undefined,
      host_id: newItem.host_id || '',
      hostname: newItem.hostname || '',
      impact: newItem.impact || '',
      timeline: newItem.timeline || '',
      resolution: newItem.resolution || '',
      lessons_learned: newItem.lessons_learned || '',
      related_guides: newItem.related_guides || []
    })
    
    // 将数组字段转换为文本
    symptomsText.value = arrayToText(newItem.symptoms || [])
    rootCausesText.value = arrayToText(newItem.root_causes || [])
    solutionsText.value = arrayToText(newItem.solutions || [])
    preventionTipsText.value = arrayToText(newItem.prevention_tips || [])
    benefitsText.value = arrayToText(newItem.benefits || [])
    implementationText.value = arrayToText(newItem.implementation || [])
    referencesText.value = arrayToText(newItem.references || [])
  } else {
    // 重置表单
    Object.assign(formData, {
      title: '',
      tags: [],
      content: '',
      summary: '',
      author: '',
      is_published: true,
      problem_type: '',
      severity: 'medium',
      symptoms: [],
      root_causes: [],
      solutions: [],
      prevention_tips: [],
      related_cases: [],
      domain: '',
      applicability: '',
      benefits: [],
      implementation: [],
      references: [],
      incident_date: new Date(),
      resolved_date: undefined,
      host_id: '',
      hostname: '',
      impact: '',
      timeline: '',
      resolution: '',
      lessons_learned: '',
      related_guides: []
    })
    
    // 重置文本字段
    symptomsText.value = ''
    rootCausesText.value = ''
    solutionsText.value = ''
    preventionTipsText.value = ''
    benefitsText.value = ''
    implementationText.value = ''
    referencesText.value = ''
  }
}, { immediate: true })

// 保存
const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const data: any = {
        title: formData.title,
        tags: formData.tags,
        content: formData.content,
        summary: formData.summary,
        author: formData.author,
        is_published: formData.is_published
      }

      if (props.category === 'troubleshooting') {
        Object.assign(data, {
          problem_type: formData.problem_type,
          severity: formData.severity,
          symptoms: textToArray(symptomsText.value),
          root_causes: textToArray(rootCausesText.value),
          solutions: textToArray(solutionsText.value),
          prevention_tips: textToArray(preventionTipsText.value),
          related_cases: formData.related_cases
        })

        if (props.mode === 'create') {
          await createTroubleshootingGuide(data)
        } else {
          await updateTroubleshootingGuide(props.item.id, data)
        }
      } else if (props.category === 'best-practices') {
        Object.assign(data, {
          domain: formData.domain,
          applicability: formData.applicability,
          benefits: textToArray(benefitsText.value),
          implementation: textToArray(implementationText.value),
          references: textToArray(referencesText.value)
        })

        if (props.mode === 'create') {
          await createBestPractice(data)
        } else {
          await updateBestPractice(props.item.id, data)
        }
      } else if (props.category === 'case-studies') {
        Object.assign(data, {
          incident_date: formData.incident_date,
          resolved_date: formData.resolved_date,
          host_id: formData.host_id,
          hostname: formData.hostname,
          problem_type: formData.problem_type,
          severity: formData.severity,
          impact: formData.impact,
          timeline: formData.timeline,
          resolution: formData.resolution,
          lessons_learned: formData.lessons_learned,
          related_guides: formData.related_guides
        })

        if (props.mode === 'create') {
          await createCaseStudy(data)
        } else {
          await updateCaseStudy(props.item.id, data)
        }
      }

      ElMessage.success('保存成功')
      emit('save')
      handleClose()
    } catch (error: any) {
      ElMessage.error('保存失败：' + (error.message || '未知错误'))
    } finally {
      saving.value = false
    }
  })
}

// 关闭
const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>
