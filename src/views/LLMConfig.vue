<template>
  <div class="llm-config-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>LLM模型配置</span>
        </div>
      </template>

      <div class="tab-header">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增配置
        </el-button>
        <el-button @click="loadConfigs">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="configs"
        :key="tableKey"
        row-key="id"
        stripe
        style="width: 100%"
        empty-text="暂无数据"
      >
        <el-table-column prop="name" label="配置名称" width="200" />
        <el-table-column prop="provider" label="提供商" width="120">
          <template #default="{ row }">
            <el-tag :type="getProviderTagType(row.provider)">
              {{ getProviderName(row.provider) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="model" label="模型" width="180" />
        <el-table-column prop="base_url" label="API地址" show-overflow-tooltip />
        <el-table-column prop="enabled" label="启用" width="80">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              @update:model-value="(val: boolean) => handleToggle(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="is_default" label="默认" width="80">
          <template #default="{ row }">
            <!-- 确保 is_default 是布尔值，兼容字符串 "true" 和数字 1 -->
            <!-- 使用计算属性确保正确判断 -->
            <el-tag v-if="!!row.is_default && (row.is_default === true || row.is_default === 'true' || row.is_default === 1 || String(row.is_default).toLowerCase() === 'true')" type="success">默认</el-tag>
            <el-button
              v-else
              type="primary"
              link
              size="small"
              @click="handleSetDefault(row)"
            >
              设为默认
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="handleTest(row)">
              <el-icon><Connection /></el-icon>
              测试
            </el-button>
            <el-button type="primary" link @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑/创建对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="配置名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入配置名称" />
        </el-form-item>

        <el-form-item label="提供商" prop="provider">
          <el-select v-model="form.provider" placeholder="请选择提供商" @change="handleProviderChange">
            <el-option label="OpenAI" value="openai" />
            <el-option label="DeepSeek" value="deepseek" />
            <el-option label="阿里千问" value="qwen" />
            <el-option label="豆包" value="doubao" />
            <el-option label="智普" value="zhipu" />
            <el-option label="Claude" value="claude" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item label="API密钥" prop="api_key">
          <el-input
            v-model="form.api_key"
            type="password"
            show-password
            :placeholder="form.id ? '留空则不更新密钥，如需修改请重新输入' : '请输入API密钥'"
          />
          <div v-if="form.id && !form.api_key" class="form-tip">
            留空则不更新密钥，如需修改请重新输入
          </div>
        </el-form-item>

        <el-form-item label="API地址" prop="base_url">
          <el-input
            v-model="form.base_url"
            placeholder="留空使用默认地址"
          />
          <div class="form-tip">
            {{ getDefaultBaseURL() }}
          </div>
        </el-form-item>

        <el-form-item label="模型名称" prop="model">
          <el-input v-model="form.model" :placeholder="getDefaultModel()" />
          <div class="form-tip">
            推荐模型：{{ getRecommendedModels() }}
          </div>
        </el-form-item>

        <el-form-item label="温度参数" prop="temperature">
          <el-slider
            v-model="form.temperature"
            :min="0"
            :max="2"
            :step="0.1"
            show-input
          />
        </el-form-item>

        <el-form-item label="最大Token数" prop="max_tokens">
          <el-input-number
            v-model="form.max_tokens"
            :min="100"
            :max="10000"
            :step="100"
          />
        </el-form-item>

        <el-form-item label="超时时间(秒)" prop="timeout">
          <el-input-number
            v-model="form.timeout"
            :min="10"
            :max="300"
            :step="10"
          />
        </el-form-item>

        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>

        <el-form-item label="设为默认">
          <el-switch v-model="form.is_default" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleTest(form)" :loading="testing">
          <el-icon><Connection /></el-icon>
          测试连接
        </el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 测试结果对话框 -->
    <el-dialog
      v-model="testDialogVisible"
      title="测试结果"
      width="600px"
    >
      <div v-if="testResult">
        <el-alert
          :type="testResult.success ? 'success' : 'error'"
          :title="testResult.success ? '测试成功' : '测试失败'"
          :closable="false"
          style="margin-bottom: 20px"
        />
        <div v-if="testResult.success">
          <p><strong>提供商：</strong>{{ testResult.provider }}</p>
          <p><strong>模型：</strong>{{ testResult.model }}</p>
          <p><strong>响应：</strong></p>
          <el-input
            :model-value="testResult.response"
            type="textarea"
            :rows="5"
            readonly
          />
        </div>
        <div v-else>
          <p><strong>错误信息：</strong></p>
          <el-input
            :model-value="testResult.error"
            type="textarea"
            :rows="5"
            readonly
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, Edit, Delete, Connection } from '@element-plus/icons-vue'
import {
  getLLMModelConfigs,
  createLLMModelConfig,
  updateLLMModelConfig,
  deleteLLMModelConfig,
  setDefaultLLMModelConfig,
  testLLMModelConfig,
  testLLMModelConfigByID,
  type LLMModelConfig
} from '@/api/llm'

const loading = ref(false)
const configs = ref<LLMModelConfig[]>([])
const tableKey = ref(0) // 用于强制刷新表格
const dialogVisible = ref(false)
const dialogTitle = ref('新增配置')
const formRef = ref<FormInstance>()
const testing = ref(false)
const testDialogVisible = ref(false)
const testResult = ref<{
  success: boolean
  response?: string
  error?: string
  provider?: string
  model?: string
} | null>(null)

const form = reactive<LLMModelConfig>({
  name: '',
  provider: 'openai',
  api_key: '',
  base_url: '',
  model: '',
  temperature: 0.7,
  max_tokens: 8000,
  timeout: 30,
  enabled: true,
  is_default: false,
  description: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
  api_key: [
    {
      validator: (rule: any, value: string, callback: any) => {
        // 如果是编辑模式且值为空，允许（表示不更新密钥）
        if (form.id && !value) {
          callback()
          return
        }
        // 如果是新增模式或编辑模式有值，必须填写
        if (!value) {
          callback(new Error('请输入API密钥'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  model: [{ required: true, message: '请输入模型名称', trigger: 'blur' }]
}

const providerDefaults: Record<string, { baseURL: string; model: string; models: string[] }> = {
  openai: {
    baseURL: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder']
  },
  qwen: {
    baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'qwen-turbo',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max']
  },
  doubao: {
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'doubao-pro-32k',
    models: ['doubao-pro-32k', 'doubao-lite-32k']
  },
  zhipu: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4',
    models: ['glm-4', 'glm-3-turbo']
  },
  claude: {
    baseURL: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-sonnet-20240229',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
  },
  custom: {
    baseURL: '',
    model: '',
    models: []
  }
}

const getProviderName = (provider: string) => {
  const names: Record<string, string> = {
    openai: 'OpenAI',
    deepseek: 'DeepSeek',
    qwen: '阿里千问',
    doubao: '豆包',
    zhipu: '智普',
    claude: 'Claude',
    custom: '自定义'
  }
  return names[provider] || provider
}

const getProviderTagType = (provider: string) => {
  const types: Record<string, string> = {
    openai: 'success',
    deepseek: 'info',
    qwen: 'warning',
    doubao: 'success',
    zhipu: 'info',
    claude: 'warning',
    custom: ''
  }
  return types[provider] || ''
}

const getDefaultBaseURL = () => {
  const defaults = providerDefaults[form.provider]
  return defaults ? `默认：${defaults.baseURL}` : ''
}

const getDefaultModel = () => {
  const defaults = providerDefaults[form.provider]
  return defaults ? `默认：${defaults.model}` : '请输入模型名称'
}

const getRecommendedModels = () => {
  const defaults = providerDefaults[form.provider]
  return defaults ? defaults.models.join('、') : ''
}

const handleProviderChange = () => {
  const defaults = providerDefaults[form.provider]
  if (defaults) {
    if (!form.base_url) {
      form.base_url = defaults.baseURL
    }
    if (!form.model) {
      form.model = defaults.model
    }
  }
}

const loadConfigs = async () => {
  loading.value = true
  try {
    const res = await getLLMModelConfigs()
    console.log('loadConfigs 原始响应:', res)
    console.log('loadConfigs 原始响应类型:', typeof res)
    console.log('loadConfigs 原始响应是否为数组:', Array.isArray(res))
    
    // 确保正确解析响应数据（处理不同的响应格式）
    let data: LLMModelConfig[] = []
    if (Array.isArray(res)) {
      data = res
      console.log('loadConfigs: 响应是数组格式，长度:', data.length)
    } else if (res && typeof res === 'object' && 'data' in res) {
      data = Array.isArray((res as any).data) ? (res as any).data : []
      console.log('loadConfigs: 从 res.data 提取数据，长度:', data.length)
      console.log('loadConfigs: res.data 内容:', (res as any).data)
    } else if (res && typeof res === 'object' && 'Data' in res) {
      data = Array.isArray((res as any).Data) ? (res as any).Data : []
      console.log('loadConfigs: 从 res.Data 提取数据，长度:', data.length)
    }
    
    // 记录原始数据中每个配置的 is_default 值
    console.log('loadConfigs: 解析后的数据（原始）:', data)
    data.forEach((c, i) => {
      console.log(`loadConfigs: 原始数据[${i}]: ID=${c.id}, 名称=${c.name}, is_default=${c.is_default} (类型: ${typeof c.is_default}, 原始值: ${JSON.stringify(c.is_default)})`)
    })
    const defaultInRaw = data.find(c => c.is_default)
    console.log('loadConfigs: 原始数据中的默认配置:', defaultInRaw)
    
    // 确保 is_default 是布尔值，并创建全新的数组和对象
    const processedData = data.map((item, index) => {
      const newItem: LLMModelConfig = { ...item }
      // 记录原始值
      const originalIsDefault = newItem.is_default
      // 确保 is_default 是布尔值（处理可能的字符串 "true"/"false"）
      if (newItem.is_default !== undefined && newItem.is_default !== null) {
        newItem.is_default = newItem.is_default === true || newItem.is_default === 'true' || newItem.is_default === 1 || String(newItem.is_default).toLowerCase() === 'true'
      } else {
        newItem.is_default = false
      }
      console.log(`loadConfigs: 处理后的项[${index}]: ID=${newItem.id}, 名称=${newItem.name}, 原始is_default=${JSON.stringify(originalIsDefault)}, 处理后is_default=${newItem.is_default} (类型: ${typeof newItem.is_default})`)
      return newItem
    })
    
    console.log('loadConfigs: 处理后的数据:', processedData)
    const defaultInProcessed = processedData.find(c => c.is_default === true)
    console.log('loadConfigs: 处理后的数据中的默认配置:', defaultInProcessed)
    
    // 强制更新响应式数据 - 直接赋值新数组，确保触发响应式更新
    // 使用展开运算符确保创建全新的对象引用
    configs.value = processedData.map(item => ({ ...item }))
    // 强制刷新表格
    tableKey.value = Date.now() // 使用时间戳确保每次都是新值
    
    await nextTick()
    console.log('loadConfigs: 更新后的 configs.value:', configs.value)
    console.log('loadConfigs: 更新后的 configs.value 长度:', configs.value.length)
    // 详细检查每个配置的 is_default 值
    configs.value.forEach((c, i) => {
      console.log(`loadConfigs: 配置[${i}]: ID=${c.id}, 名称=${c.name}, is_default=${c.is_default} (类型: ${typeof c.is_default})`)
    })
    const defaultConfig = configs.value.find(c => c.is_default === true)
    console.log('loadConfigs: 更新后的默认配置:', defaultConfig)
    
    // 验证表格数据 - 使用 JSON 序列化来查看实际值
    await nextTick()
    const serialized = JSON.parse(JSON.stringify(configs.value))
    console.log('loadConfigs: 最终验证 - 序列化后的数据:', serialized)
    serialized.forEach((c: any, i: number) => {
      console.log(`loadConfigs: 序列化配置[${i}]: ID=${c.id}, 名称=${c.name}, is_default=${c.is_default} (类型: ${typeof c.is_default})`)
    })
  } catch (error: any) {
    console.error('loadConfigs 错误:', error)
    ElMessage.error('加载配置失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  dialogTitle.value = '新增配置'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: LLMModelConfig) => {
  dialogTitle.value = '编辑配置'
  Object.assign(form, {
    ...row,
    api_key: row.api_key.includes('****') ? '' : row.api_key // 如果已隐藏，清空让用户重新输入
  })
  dialogVisible.value = true
}

const handleDelete = async (row: LLMModelConfig) => {
  try {
    await ElMessageBox.confirm('确定要删除此配置吗？', '提示', {
      type: 'warning'
    })
    await deleteLLMModelConfig(row.id!)
    ElMessage.success('删除成功')
    loadConfigs()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }
}

const handleToggle = async (row: LLMModelConfig, enabled: boolean) => {
  try {
    await updateLLMModelConfig(row.id!, { ...row, enabled })
    ElMessage.success(enabled ? '已启用' : '已禁用')
    loadConfigs()
  } catch (error: any) {
    ElMessage.error('操作失败：' + (error.message || '未知错误'))
    loadConfigs()
  }
}

const handleSetDefault = async (row: LLMModelConfig) => {
  console.log('设置默认配置，ID:', row.id, '名称:', row.name)
  try {
    const response = await setDefaultLLMModelConfig(row.id!)
    console.log('设置默认配置响应:', response)
    ElMessage.success('设置成功')
    // 等待一下确保后端更新完成，然后重新加载
    await new Promise(resolve => setTimeout(resolve, 300))
    // 强制重新加载
    await loadConfigs()
    // 等待Vue更新DOM
    await nextTick()
    // 再次检查数据
    console.log('重新加载后的配置列表:', configs.value)
    const defaultConfig = configs.value.find(c => c.is_default)
    console.log('当前默认配置:', defaultConfig)
    if (!defaultConfig || defaultConfig.id !== row.id) {
      console.warn('警告: 默认配置未正确更新，强制重新加载')
      await loadConfigs()
    }
  } catch (error: any) {
    console.error('设置默认配置失败:', error)
    ElMessage.error('设置失败：' + (error.message || '未知错误'))
    // 即使失败也重新加载，确保数据同步
    await loadConfigs()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    // 清理URL的前后空格
    if (form.base_url) {
      form.base_url = form.base_url.trim()
    }

    try {
      if (form.id) {
        await updateLLMModelConfig(form.id, form)
        ElMessage.success('更新成功')
      } else {
        await createLLMModelConfig(form)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadConfigs()
    } catch (error: any) {
      ElMessage.error('操作失败：' + (error.message || '未知错误'))
    }
  })
}

const handleDialogClose = () => {
  resetForm()
  formRef.value?.resetFields()
}

const resetForm = () => {
  Object.assign(form, {
    id: undefined,
    name: '',
    provider: 'openai',
    api_key: '',
    base_url: '',
    model: '',
    temperature: 0.7,
    max_tokens: 8000,
    timeout: 30,
    enabled: true,
    is_default: false,
    description: ''
  })
}

const handleTest = async (config: LLMModelConfig) => {
  testing.value = true
  testResult.value = null

  try {
    let res
    // 如果配置有ID且API密钥被隐藏，使用ID接口测试
    if (config.id && (config.api_key.includes('****') || !config.api_key)) {
      res = await testLLMModelConfigByID(config.id)
    } else {
      // 验证必填字段
      if (!config.provider || !config.api_key || !config.model) {
        ElMessage.warning('请先填写提供商、API密钥和模型名称')
        return
      }
      res = await testLLMModelConfig(config)
    }
    testResult.value = res.data || res
    testDialogVisible.value = true
  } catch (error: any) {
    testResult.value = {
      success: false,
      error: error.message || '测试失败'
    }
    testDialogVisible.value = true
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  loadConfigs()
})
</script>

<style scoped lang="scss">
.llm-config-container {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: bold;
  }

  .tab-header {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
  }
}
</style>
