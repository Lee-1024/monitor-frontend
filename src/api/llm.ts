import request from '@/utils/request'

export interface LLMModelConfig {
  id?: number
  created_at?: string
  updated_at?: string
  name: string
  provider: string // openai, deepseek, qwen, doubao, zhipu, claude, custom
  api_key: string
  base_url?: string
  model: string
  temperature: number
  max_tokens: number
  timeout: number
  enabled: boolean
  is_default?: boolean
  description?: string
  config?: Record<string, string>
}

// 获取LLM模型配置列表
export function getLLMModelConfigs(enabled?: boolean) {
  const params: any = {
    _t: Date.now() // 添加时间戳避免缓存
  }
  if (enabled !== undefined) {
    params.enabled = enabled
  }
  return request<LLMModelConfig[]>({
    url: '/v1/llm/models',
    method: 'get',
    params
  })
}

// 创建LLM模型配置
export function createLLMModelConfig(config: LLMModelConfig) {
  return request<LLMModelConfig>({
    url: '/v1/llm/models',
    method: 'post',
    data: config
  })
}

// 更新LLM模型配置
export function updateLLMModelConfig(id: number, config: LLMModelConfig) {
  return request({
    url: `/v1/llm/models/${id}`,
    method: 'put',
    data: config
  })
}

// 删除LLM模型配置
export function deleteLLMModelConfig(id: number) {
  return request({
    url: `/v1/llm/models/${id}`,
    method: 'delete'
  })
}

// 获取LLM模型配置
export function getLLMModelConfig(id: number) {
  return request<LLMModelConfig>({
    url: `/v1/llm/models/${id}`,
    method: 'get'
  })
}

// 设置默认LLM模型配置
export function setDefaultLLMModelConfig(id: number) {
  return request({
    url: `/v1/llm/models/${id}/set-default`,
    method: 'post'
  })
}

// 测试LLM模型配置
export function testLLMModelConfig(config: LLMModelConfig) {
  return request<{
    success: boolean
    response?: string
    error?: string
    provider?: string
    model?: string
  }>({
    url: '/v1/llm/models/test',
    method: 'post',
    data: config
  })
}

// 通过ID测试LLM模型配置
export function testLLMModelConfigByID(id: number) {
  return request<{
    success: boolean
    response?: string
    error?: string
    provider?: string
    model?: string
  }>({
    url: `/v1/llm/models/${id}/test`,
    method: 'post'
  })
}
