<template>
  <div class="ai-analysis-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>AI分析</span>
        </div>
      </template>

      <!-- Tab页 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- AI智能分析 Tab -->
        <el-tab-pane label="AI智能分析" name="ai-analysis">
          <template #label>
            <span>
              <el-icon><TrendCharts /></el-icon>
              AI智能分析
            </span>
          </template>

          <!-- 筛选条件 -->
          <div class="filter-section">
            <el-form :inline="true" :model="filterForm">
              <el-form-item label="选择主机">
                <el-select
                  v-model="filterForm.hostId"
                  placeholder="请选择主机"
                  filterable
                  style="width: 250px"
                  @change="handleHostChange"
                >
                  <el-option
                    v-for="agent in agents"
                    :key="agent?.host_id || agent?.id"
                    :label="`${agent?.hostname || '未知主机'} (${agent?.host_id || agent?.id || 'N/A'})`"
                    :value="agent?.host_id || agent?.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="资源类型">
                <el-select v-model="filterForm.resourceType" style="width: 150px" @change="loadPrediction">
                  <el-option label="CPU" value="cpu" />
                  <el-option label="内存" value="memory" />
                  <el-option label="磁盘" value="disk" />
                </el-select>
              </el-form-item>

              <el-form-item label="预测天数">
                <el-input-number
                  v-model="filterForm.days"
                  :min="7"
                  :max="90"
                  :step="7"
                  style="width: 120px"
                  @change="loadPrediction"
                />
              </el-form-item>

              <el-form-item label="阈值(%)">
                <el-input-number
                  v-model="filterForm.threshold"
                  :min="50"
                  :max="100"
                  :step="5"
                  style="width: 120px"
                  @change="loadPrediction"
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="loadPrediction" :loading="loading">
                  <el-icon><Search /></el-icon>
                  查询预测
                </el-button>
                <el-button type="info" @click="loadPredictionWithAI" :loading="loading || llmAnalyzing" :disabled="!filterForm.hostId">
                  <el-icon><TrendCharts /></el-icon>
                  AI分析
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 预测结果 -->
          <div v-if="predictionData" class="prediction-section">
        <!-- 预测概览卡片 -->
        <el-row :gutter="20" class="prediction-cards">
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover">
              <div class="card-content">
                <div class="card-label">当前使用率</div>
                <div class="card-value">{{ predictionData.prediction.current_value.toFixed(2) }}%</div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover">
              <div class="card-content">
                <div class="card-label">预测使用率</div>
                <div class="card-value">{{ predictionData.prediction.predicted_value.toFixed(2) }}%</div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover">
              <div class="card-content">
                <div class="card-label">达到阈值天数</div>
                <div class="card-value">
                  <span v-if="predictionData.prediction.days_to_threshold > 0">
                    {{ predictionData.prediction.days_to_threshold.toFixed(1) }} 天
                  </span>
                  <span v-else class="text-success">不会超过</span>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover">
              <div class="card-content">
                <div class="card-label">趋势</div>
                <div class="card-value">
                  <el-tag :type="getTrendType(predictionData.prediction.trend)">
                    {{ getTrendName(predictionData.prediction.trend) }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- AI容量规划建议 -->
        <el-alert
          v-if="predictionData.capacity"
          :title="predictionData.capacity.recommendation"
          :type="getUrgencyType(predictionData.capacity.urgency)"
          :closable="false"
          show-icon
          style="margin: 20px 0"
        >
          <template #default>
            <div>
              <p><strong>紧急程度：</strong>{{ getUrgencyName(predictionData.capacity.urgency) }}</p>
              <p v-if="predictionData.capacity.days_to_threshold > 0">
                <strong>预计扩容时间：</strong>{{ formatDate(predictionData.capacity.predicted_date) }}
              </p>
            </div>
          </template>
        </el-alert>

        <!-- 预测趋势图 -->
        <el-card shadow="hover" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>资源使用趋势预测（AI分析）</span>
            </div>
          </template>
          <div ref="chartRef" style="width: 100%; height: 400px;"></div>
        </el-card>

        <!-- LLM智能分析 -->
        <el-card v-if="predictionData && (predictionData.llm_analysis || llmAnalyzing || llmTimeout || llmFailed)" shadow="hover" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>AI智能分析</span>
              <el-tag v-if="llmAnalyzing" type="info" effect="plain" class="analyzing-tag">
                <span class="pulse-dot"></span>
                AI分析中...
              </el-tag>
            </div>
          </template>
          
          <div v-if="llmAnalyzing && !predictionData.llm_analysis" class="llm-loading">
            <div class="loading-content">
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
              <p class="loading-text">AI正在深度分析中，请稍候...</p>
              <p class="loading-subtext">正在生成专业的容量规划建议</p>
            </div>
          </div>
          
          <div v-else-if="predictionData.llm_analysis || llmTimeout || llmFailed" class="llm-analysis">
            <el-alert
              v-if="llmTimeout"
              type="warning"
              :closable="false"
              show-icon
              style="margin-bottom: 20px"
            >
              <template #title>
                <span style="font-weight: 600;">AI分析超时提示</span>
              </template>
              <template #default>
                <div style="line-height: 1.8;">
                  <p>AI分析请求已超时，但我们已经为您显示了基础分析结果。</p>
                  <p style="margin-top: 8px;">
                    <strong>可能的原因：</strong>
                  </p>
                  <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>网络连接不稳定或延迟较高</li>
                    <li>大模型需要更多时间处理复杂分析</li>
                    <li>当前服务器负载较高</li>
                  </ul>
                  <p style="margin-top: 8px;">
                    <strong>建议操作：</strong>
                  </p>
                  <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>稍后刷新页面查看完整分析结果（分析可能在后台继续处理）</li>
                    <li>检查网络连接是否正常</li>
                    <li>如问题持续，可以尝试重新发起分析请求</li>
                  </ul>
                </div>
              </template>
            </el-alert>
            <el-alert
              v-if="llmFailed"
              type="error"
              :closable="false"
              show-icon
              style="margin-bottom: 20px"
            >
              <template #title>
                <span style="font-weight: 600;">AI分析失败提示</span>
              </template>
              <template #default>
                <div style="line-height: 1.8;">
                  <p>AI分析请求失败。</p>
                  <p style="margin-top: 8px;">
                    <strong>可能的原因：</strong>
                  </p>
                  <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>网络连接问题：无法连接到AI服务，请检查网络连接</li>
                    <li>服务超时：AI服务响应超时，可能是服务器负载较高或网络延迟</li>
                    <li>服务暂时不可用：AI服务可能正在维护或暂时不可用</li>
                  </ul>
                  <p style="margin-top: 8px;">
                    <strong>建议操作：</strong>
                  </p>
                  <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>检查网络连接是否正常</li>
                    <li>稍后重试分析请求</li>
                    <li>如果问题持续，请联系系统管理员</li>
                    <li>可以尝试使用其他AI模型配置</li>
                  </ul>
                </div>
              </template>
            </el-alert>
            <!-- 只在成功且有分析结果时显示详细内容，失败时不显示 -->
            <template v-if="!llmFailed && predictionData.llm_analysis">
              <div class="analysis-section">
                <h4>摘要</h4>
                <div class="markdown-content" v-html="formatMarkdown(predictionData.llm_analysis?.summary)"></div>
              </div>
              <div class="analysis-section">
                <h4>详细分析</h4>
                <div class="markdown-content" v-html="formatMarkdown(predictionData.llm_analysis.analysis)"></div>
              </div>
              <div v-if="predictionData.llm_analysis.recommendations && predictionData.llm_analysis.recommendations.length > 0" class="analysis-section">
                <h4>建议</h4>
                <div class="markdown-content">
                  <ul>
                    <li v-for="(rec, index) in predictionData.llm_analysis.recommendations" :key="index" v-html="formatMarkdown(rec)"></li>
                  </ul>
                </div>
              </div>
              <div v-if="predictionData.llm_analysis.risks && predictionData.llm_analysis.risks.length > 0" class="analysis-section">
                <h4>风险提示</h4>
                <div class="markdown-content">
                  <ul>
                    <li v-for="(risk, index) in predictionData.llm_analysis.risks" :key="index" class="risk-item" v-html="formatMarkdown(risk)"></li>
                  </ul>
                </div>
              </div>
            </template>
          </div>
        </el-card>
          </div>

          <!-- 空状态 -->
          <el-empty
            v-if="!loading && !predictionData"
            description="请选择主机和资源类型，然后点击查询"
          />
        </el-tab-pane>

        <!-- 成本优化分析 Tab -->
        <el-tab-pane label="成本优化分析" name="cost-optimization">
          <template #label>
            <span>
              <el-icon><Money /></el-icon>
              成本优化分析
            </span>
          </template>

          <!-- 筛选条件 -->
          <div class="filter-section">
            <el-form :inline="true" :model="filterForm">
              <el-form-item label="选择主机">
                <el-select
                  v-model="filterForm.hostId"
                  placeholder="请选择主机"
                  filterable
                  style="width: 250px"
                  @change="handleHostChange"
                >
                  <el-option
                    v-for="agent in agents"
                    :key="agent?.host_id || agent?.id"
                    :label="`${agent?.hostname || '未知主机'} (${agent?.host_id || agent?.id || 'N/A'})`"
                    :value="agent?.host_id || agent?.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button type="success" @click="loadCostOptimization" :loading="costLoading || costAnalyzing" :disabled="!filterForm.hostId">
                  <el-icon><Money /></el-icon>
                  成本优化分析
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 成本优化分析 -->
          <el-card v-if="costOptimization || costAnalyzing" shadow="hover" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>成本优化建议</span>
            <el-tag v-if="costAnalyzing" type="info" effect="plain" class="analyzing-tag">
              <span class="pulse-dot"></span>
              AI分析中...
            </el-tag>
          </div>
        </template>
        
        <el-alert
          v-if="costTimeout"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        >
          <template #title>
            <span style="font-weight: 600;">成本优化分析超时提示</span>
          </template>
          <template #default>
            <div style="line-height: 1.8;">
              <p>成本优化分析请求已超时。</p>
              <p style="margin-top: 8px;">
                <strong>可能的原因：</strong>
              </p>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>网络连接不稳定或延迟较高</li>
                <li>大模型需要更多时间处理复杂分析</li>
                <li>当前服务器负载较高</li>
              </ul>
              <p style="margin-top: 8px;">
                <strong>建议操作：</strong>
              </p>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>稍后刷新页面查看分析结果（分析可能在后台继续处理）</li>
                <li>检查网络连接是否正常</li>
                <li>如问题持续，可以尝试重新发起分析请求</li>
              </ul>
            </div>
          </template>
        </el-alert>
        <el-alert
          v-if="costFailed"
          type="error"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        >
          <template #title>
            <span style="font-weight: 600;">成本优化分析失败提示</span>
          </template>
          <template #default>
            <div style="line-height: 1.8;">
              <p>成本优化分析请求失败。</p>
              <p style="margin-top: 8px;">
                <strong>可能的原因：</strong>
              </p>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>网络连接问题：无法连接到AI服务，请检查网络连接</li>
                <li>服务超时：AI服务响应超时，可能是服务器负载较高或网络延迟</li>
                <li>服务暂时不可用：AI服务可能正在维护或暂时不可用</li>
              </ul>
              <p style="margin-top: 8px;">
                <strong>建议操作：</strong>
              </p>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>检查网络连接是否正常</li>
                <li>稍后重试分析请求</li>
                <li>如果问题持续，请联系系统管理员</li>
                <li>可以尝试使用其他AI模型配置</li>
              </ul>
            </div>
          </template>
        </el-alert>
        
        <div v-if="costAnalyzing && (!costOptimization || !costOptimization.recommendation)" class="llm-loading">
          <div class="loading-content">
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
            <p class="loading-text">AI正在深度分析中，请稍候...</p>
            <p class="loading-subtext">正在生成专业的成本优化建议</p>
          </div>
        </div>
        
        <div v-else-if="!costFailed && costOptimization && costOptimization.recommendation" class="cost-optimization">
          <div class="recommendation-content" v-html="formatRecommendation(costOptimization.recommendation)"></div>
          
          <el-divider>资源预测对比</el-divider>
          
          <el-table :data="getCostOptimizationTableData()" stripe>
            <el-table-column prop="resource" label="资源类型" width="120">
              <template #header>
                <div class="table-header">
                  <span>资源类型</span>
                  <el-tooltip content="监控的资源类型：CPU、内存或磁盘" placement="top">
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="current" label="当前使用率" width="140">
              <template #header>
                <div class="table-header">
                  <span>当前使用率</span>
                  <el-tooltip content="资源当前的实际使用百分比" placement="top">
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
              </template>
              <template #default="{ row }">
                {{ row.current.toFixed(2) }}%
              </template>
            </el-table-column>
            <el-table-column prop="predicted" label="预测使用率" width="140">
              <template #header>
                <div class="table-header">
                  <span>预测使用率</span>
                  <el-tooltip content="基于历史数据预测的未来使用率" placement="top">
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
              </template>
              <template #default="{ row }">
                {{ row.predicted.toFixed(2) }}%
              </template>
            </el-table-column>
            <el-table-column prop="days" label="达到阈值天数" width="160">
              <template #header>
                <div class="table-header">
                  <span>达到阈值天数</span>
                  <el-tooltip content="预计多少天后资源使用率会达到设定的阈值（80%）" placement="top">
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
              </template>
              <template #default="{ row }">
                <span v-if="row.days > 0">{{ row.days.toFixed(1) }} 天</span>
                <span v-else class="text-success">不会超过</span>
              </template>
            </el-table-column>
            <el-table-column prop="trend" label="趋势" width="120">
              <template #header>
                <div class="table-header">
                  <span>趋势</span>
                  <el-tooltip content="资源使用率的变化趋势：上升、下降或稳定" placement="top">
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
              </template>
              <template #default="{ row }">
                <el-tag :type="getTrendType(row.trend)" size="small">
                  {{ getTrendName(row.trend) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>

          <!-- 空状态 -->
          <el-empty
            v-if="!costLoading && !costAnalyzing && !costOptimization"
            description="请选择主机，然后点击成本优化分析"
          />
        </el-tab-pane>

        <!-- 异常检测 Tab -->
        <el-tab-pane label="异常检测" name="anomaly-detection">
          <template #label>
            <span>
              <el-icon><Warning /></el-icon>
              异常检测
            </span>
          </template>

          <!-- 筛选条件 -->
          <div class="filter-section">
            <el-form :inline="true" :model="filterForm">
              <el-form-item label="选择主机">
                <el-select
                  v-model="filterForm.hostId"
                  placeholder="请选择主机"
                  filterable
                  style="width: 250px"
                  @change="handleHostChange"
                >
                  <el-option
                    v-for="agent in agents"
                    :key="agent?.host_id || agent?.id"
                    :label="`${agent?.hostname || '未知主机'} (${agent?.host_id || agent?.id || 'N/A'})`"
                    :value="agent?.host_id || agent?.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="资源类型">
                <el-select v-model="filterForm.resourceType" style="width: 150px">
                  <el-option label="全部" value="" />
                  <el-option label="CPU" value="cpu" />
                  <el-option label="内存" value="memory" />
                  <el-option label="磁盘" value="disk" />
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button type="warning" @click="detectAnomaliesHandler" :loading="anomalyDetecting" :disabled="!filterForm.hostId">
                  <el-icon><Warning /></el-icon>
                  异常检测
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- AI智能分析总结（流式输出，更直观的展示） -->
          <el-card v-if="llmSummary || llmSummaryAnalyzing || (anomalyDetecting && anomalyEvents.length > 0)" shadow="hover" style="margin-top: 20px" class="llm-summary-card">
            <template #header>
              <div class="card-header">
                <div class="header-left">
                  <el-icon class="summary-icon"><TrendCharts /></el-icon>
                  <span class="summary-title">AI智能分析总结</span>
                  <el-tooltip content="基于异常检测原理和检测结果，AI生成的综合分析报告" placement="top">
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <el-tag v-if="llmSummaryAnalyzing" type="info" effect="plain" class="analyzing-tag">
                  <span class="pulse-dot"></span>
                  AI分析中...
                </el-tag>
              </div>
            </template>

            <div v-if="llmSummaryAnalyzing && !llmSummary" class="llm-loading">
              <div class="loading-content">
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
                <p class="loading-text">AI正在深度分析异常检测结果，请稍候...</p>
                <p class="loading-subtext">正在结合检测原理和结果生成专业的分析总结</p>
              </div>
            </div>

            <div v-else-if="llmSummary" class="llm-analysis-summary">
              <div class="summary-content" v-html="formatMarkdown(llmSummary)"></div>
            </div>

            <div v-else-if="!llmSummaryAnalyzing && anomalyDetecting && anomalyEvents.length === 0" class="waiting-summary">
              <el-empty description="异常检测完成后，AI将自动生成分析总结" :image-size="100" />
            </div>
          </el-card>

          <!-- 异常检测结果 -->
          <el-card v-if="anomalyEvents.length > 0 || anomalyDetecting || anomalyStatistics" shadow="hover" style="margin-top: 20px">
            <template #header>
              <div class="card-header">
                <span>异常检测结果</span>
                <el-tag v-if="anomalyDetecting" type="info" effect="plain" class="analyzing-tag">
                  <span class="pulse-dot"></span>
                  检测中...
                </el-tag>
              </div>
            </template>

            <!-- 异常统计信息 -->
            <div v-if="anomalyStatistics" class="anomaly-statistics">
              <el-row :gutter="20">
                <el-col :span="6">
                  <div class="stat-item">
                    <div class="stat-label">异常总数</div>
                    <div class="stat-value">{{ anomalyStatistics.total_anomalies }}</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="stat-item">
                    <div class="stat-label">未解决</div>
                    <div class="stat-value text-warning">{{ anomalyStatistics.unresolved_count }}</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="stat-item">
                    <div class="stat-label">严重异常</div>
                    <div class="stat-value text-danger">{{ anomalyStatistics.by_severity?.critical || 0 }}</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="stat-item">
                    <div class="stat-label">高优先级</div>
                    <div class="stat-value text-warning">{{ anomalyStatistics.by_severity?.high || 0 }}</div>
                  </div>
                </el-col>
              </el-row>
            </div>

            <!-- 异常事件列表 -->
            <el-table v-if="anomalyEvents.length > 0" :data="anomalyEvents" stripe style="margin-top: 20px">
              <el-table-column prop="type" label="异常类型" width="150">
                <template #default="{ row }">
                  <el-tag :type="getAnomalyTypeTag(row.type)">
                    {{ getAnomalyTypeName(row.type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="metric_type" label="资源类型" width="120">
                <template #default="{ row }">
                  <span v-if="row.metric_type">
                    {{ row.metric_type === 'cpu' ? 'CPU' : row.metric_type === 'memory' ? '内存' : '磁盘' }}
                  </span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="severity" label="严重程度" width="120">
                <template #default="{ row }">
                  <el-tag :type="getSeverityType(row.severity)">
                    {{ getSeverityName(row.severity) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="value" label="异常值" width="120">
                <template #default="{ row }">
                  {{ row.value.toFixed(2) }}
                  <span v-if="row.metric_type">%</span>
                </template>
              </el-table-column>
              <el-table-column prop="deviation" label="偏差" width="120">
                <template #default="{ row }">
                  <el-text :type="row.deviation > 0 ? 'danger' : 'success'">
                    {{ row.deviation > 0 ? '+' : '' }}{{ row.deviation.toFixed(2) }}%
                  </el-text>
                </template>
              </el-table-column>
              <el-table-column prop="confidence" label="置信度" width="100">
                <template #default="{ row }">
                  {{ (row.confidence * 100).toFixed(1) }}%
                </template>
              </el-table-column>
              <el-table-column prop="timestamp" label="发生时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.timestamp) }}
                </template>
              </el-table-column>
              <el-table-column prop="is_resolved" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.is_resolved ? 'success' : 'danger'">
                    {{ row.is_resolved ? '已解决' : '未解决' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click="showAnomalyDetail(row)">
                    查看详情
                  </el-button>
                  <el-button
                    v-if="!row.is_resolved"
                    type="success"
                    size="small"
                    @click="resolveAnomaly(row)"
                  >
                    标记已解决
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 空状态 -->
            <el-empty
              v-if="!anomalyDetecting && anomalyEvents.length === 0 && !anomalyStatistics"
              description="请选择主机，然后点击异常检测"
            >
              <template #description>
                <div style="text-align: center; padding: 20px;">
                  <p style="margin-bottom: 10px; color: #909399;">请选择主机，然后点击异常检测</p>
                  <p style="font-size: 12px; color: #C0C4CC; line-height: 1.6;">
                    异常检测功能会分析最近24小时的监控数据，检测以下类型的异常：<br/>
                    • 指标突增/突降（CPU、内存、磁盘使用率异常波动）<br/>
                    • 日志错误模式（错误日志频率异常）<br/>
                    • 指标漂移（长期趋势异常）
                  </p>
                </div>
              </template>
            </el-empty>
            
            <!-- 检测完成但无异常 -->
            <el-empty
              v-if="!anomalyDetecting && anomalyEvents.length === 0 && anomalyStatistics"
              description="未检测到异常"
            >
              <template #description>
                <div style="text-align: center; padding: 20px;">
                  <p style="margin-bottom: 10px; color: #67C23A;">
                    <el-icon style="font-size: 48px; margin-bottom: 10px;"><CircleCheck /></el-icon><br/>
                    未检测到异常
                  </p>
                  <p style="font-size: 13px; color: #909399; line-height: 1.8; max-width: 500px; margin: 0 auto;">
                    系统运行正常，未发现异常模式。这可能表示：<br/>
                    • 系统运行稳定，指标波动在正常范围内<br/>
                    • 监控数据正常，未达到异常检测阈值<br/>
                    • 建议定期进行异常检测，以便及时发现潜在问题
                  </p>
                </div>
              </template>
            </el-empty>
          </el-card>
        </el-tab-pane>

        <!-- 性能分析 Tab -->
        <el-tab-pane label="性能分析" name="performance-analysis">
          <template #label>
            <span>
              <el-icon><TrendCharts /></el-icon>
              性能分析
            </span>
          </template>

          <!-- 筛选条件 -->
          <div class="filter-section">
            <el-form :inline="true" :model="performanceForm">
              <el-form-item label="选择主机">
                <el-select
                  v-model="performanceForm.hostId"
                  placeholder="请选择主机"
                  filterable
                  style="width: 250px"
                  @change="handlePerformanceHostChange"
                >
                  <el-option
                    v-for="agent in agents"
                    :key="agent?.host_id || agent?.id"
                    :label="`${agent?.hostname || '未知主机'} (${agent?.host_id || agent?.id || 'N/A'})`"
                    :value="agent?.host_id || agent?.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="时间范围">
                <el-select v-model="performanceForm.hours" style="width: 150px">
                  <el-option label="最近6小时" :value="6" />
                  <el-option label="最近12小时" :value="12" />
                  <el-option label="最近24小时" :value="24" />
                  <el-option label="最近48小时" :value="48" />
                  <el-option label="最近72小时" :value="72" />
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="analyzePerformanceHandler" :loading="performanceAnalyzing" :disabled="!performanceForm.hostId">
                  <el-icon><TrendCharts /></el-icon>
                  开始性能分析
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- AI性能分析报告（流式输出） -->
          <el-card v-if="performanceSummary || performanceAnalyzing" shadow="hover" style="margin-top: 20px" class="performance-summary-card">
            <template #header>
              <div class="card-header">
                <div class="header-left">
                  <el-icon class="summary-icon"><TrendCharts /></el-icon>
                  <span class="summary-title">AI性能分析报告</span>
                  <el-tooltip content="基于CPU、内存、磁盘等资源使用情况，AI生成的性能分析和优化建议" placement="top">
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <el-tag v-if="performanceAnalyzing" type="info" effect="plain" class="analyzing-tag">
                  <span class="pulse-dot"></span>
                  AI分析中...
                </el-tag>
              </div>
            </template>

            <div v-if="performanceAnalyzing && !performanceSummary" class="llm-loading">
              <div class="loading-content">
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
                <p class="loading-text">AI正在深度分析性能数据，请稍候...</p>
                <p class="loading-subtext">正在分析性能瓶颈、资源使用效率和生成优化建议</p>
              </div>
            </div>

            <div v-else-if="performanceSummary" class="performance-analysis-summary">
              <div class="summary-content" v-html="formatMarkdown(performanceSummary)"></div>
            </div>
          </el-card>

          <!-- 空状态 -->
          <el-empty
            v-if="!performanceAnalyzing && !performanceSummary"
            description="请选择主机和时间范围，然后点击开始性能分析"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 异常详情对话框 -->
    <el-dialog
      v-model="anomalyDetailVisible"
      title="异常详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedAnomaly" class="anomaly-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="异常类型">
            <el-tag :type="getAnomalyTypeTag(selectedAnomaly.type)">
              {{ getAnomalyTypeName(selectedAnomaly.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="资源类型">
            <span v-if="selectedAnomaly.metric_type">
              {{ selectedAnomaly.metric_type === 'cpu' ? 'CPU' : selectedAnomaly.metric_type === 'memory' ? '内存' : '磁盘' }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="严重程度">
            <el-tag :type="getSeverityType(selectedAnomaly.severity)">
              {{ getSeverityName(selectedAnomaly.severity) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="异常值">
            {{ selectedAnomaly.value.toFixed(2) }}
            <span v-if="selectedAnomaly.metric_type">%</span>
          </el-descriptions-item>
          <el-descriptions-item label="预期值" v-if="selectedAnomaly.expected_value !== undefined">
            {{ selectedAnomaly.expected_value.toFixed(2) }}
            <span v-if="selectedAnomaly.metric_type">%</span>
          </el-descriptions-item>
          <el-descriptions-item label="偏差">
            <el-text :type="selectedAnomaly.deviation > 0 ? 'danger' : 'success'">
              {{ selectedAnomaly.deviation > 0 ? '+' : '' }}{{ selectedAnomaly.deviation.toFixed(2) }}%
            </el-text>
          </el-descriptions-item>
          <el-descriptions-item label="置信度">
            {{ (selectedAnomaly.confidence * 100).toFixed(1) }}%
          </el-descriptions-item>
          <el-descriptions-item label="发生时间">
            {{ formatDate(selectedAnomaly.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedAnomaly.is_resolved ? 'success' : 'danger'">
              {{ selectedAnomaly.is_resolved ? '已解决' : '未解决' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <div class="anomaly-message">
          <h4>异常信息</h4>
          <div class="markdown-content" v-html="formatMarkdown(selectedAnomaly.message)"></div>
        </div>

        <div v-if="selectedAnomaly.root_cause" class="anomaly-root-cause">
          <h4>根因分析</h4>
          <div class="markdown-content" v-html="formatMarkdown(selectedAnomaly.root_cause)"></div>
        </div>

        <div v-if="selectedAnomaly.recommendations && selectedAnomaly.recommendations.length > 0" class="anomaly-recommendations">
          <h4>建议措施</h4>
          <ul>
            <li v-for="(rec, index) in selectedAnomaly.recommendations" :key="index" v-html="formatMarkdown(rec)"></li>
          </ul>
        </div>

        <div v-if="selectedAnomaly.related_metrics" class="anomaly-related-metrics">
          <h4>关联指标</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item
              v-for="(value, key) in selectedAnomaly.related_metrics"
              :key="key"
              :label="key"
            >
              {{ typeof value === 'object' ? JSON.stringify(value) : value }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <template #footer>
        <el-button @click="anomalyDetailVisible = false">关闭</el-button>
        <el-button
          v-if="selectedAnomaly && !selectedAnomaly.is_resolved"
          type="success"
          @click="resolveAnomaly(selectedAnomaly)"
        >
          标记已解决
        </el-button>
      </template>
    </el-dialog>
  </div>

</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Money, TrendCharts, QuestionFilled, Warning, Refresh, CircleCheck, DataAnalysis } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { getAgents } from '@/api/agent'
import { getCapacityPrediction, getCostOptimization, getLLMTaskStatus, streamCostOptimization, type CapacityPredictionResponse, type CostOptimizationResponse, type LLMTask } from '@/api/prediction'
import { getHistoryMetrics } from '@/api/metrics'
import { detectAnomalies, getAnomalyStatistics, resolveAnomalyEvent, getAnomalyEventDetail, streamAnomalyAnalysis, type AnomalyEvent, type AnomalyStatistics } from '@/api/anomaly'
import { streamPerformanceAnalysis } from '@/api/performance'

const activeTab = ref('ai-analysis') // 当前激活的tab
const loading = ref(false)
const costLoading = ref(false)
const llmAnalyzing = ref(false) // LLM分析中
const costAnalyzing = ref(false) // 成本优化分析中
const llmTimeout = ref(false) // LLM分析超时
const costTimeout = ref(false) // 成本优化分析超时
const llmFailed = ref(false) // LLM分析失败
const costFailed = ref(false) // 成本优化分析失败
const agents = ref<any[]>([])
const predictionData = ref<CapacityPredictionResponse | null>(null)
const costOptimization = ref<CostOptimizationResponse | null>(null)
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
let llmPollingTimer: number | null = null
let costPollingTimer: number | null = null
let streamCancelFn: (() => void) | null = null // SSE流式连接取消函数（容量分析）
const streamContent = ref('') // 流式内容累积（容量分析）
let costStreamCancelFn: (() => void) | null = null // SSE流式连接取消函数（成本优化）
const costStreamContent = ref('') // 流式内容累积（成本优化）
const anomalyDetecting = ref(false) // 异常检测中
const anomalyEvents = ref<AnomalyEvent[]>([]) // 异常事件列表
const anomalyStatistics = ref<AnomalyStatistics | null>(null) // 异常统计信息
const anomalyDetailVisible = ref(false) // 异常详情对话框显示状态
const selectedAnomaly = ref<AnomalyEvent | null>(null) // 选中的异常事件
const llmSummaryAnalyzing = ref(false) // LLM分析中
const llmSummary = ref('') // LLM生成的总结（流式累积）
let anomalyStreamCancelFn: (() => void) | null = null // SSE流式连接取消函数（异常分析）

// 性能分析相关
const performanceForm = reactive({
  hostId: '',
  hours: 24
})
const performanceAnalyzing = ref(false) // 性能分析中
const performanceSummary = ref('') // 性能分析总结（流式累积）
let performanceStreamCancelFn: (() => void) | null = null // SSE流式连接取消函数（性能分析）

const filterForm = reactive({
  hostId: '',
  resourceType: 'cpu' as 'cpu' | 'memory' | 'disk',
  days: 30,
  threshold: 80
})

// Tab切换处理
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  console.log('切换到tab:', tabName)
}

// 加载主机列表
const loadAgents = async () => {
  try {
    const res = await getAgents({ page_size: 1000 }) // 获取所有主机
    // 处理分页响应格式：res.data 是 PaginatedResponse<Agent>
    if (res.data) {
      if (Array.isArray(res.data)) {
        // 直接是数组
        agents.value = res.data
      } else if (res.data.agents && Array.isArray(res.data.agents)) {
        // 分页响应格式：{ agents: [...], total: ... }
        agents.value = res.data.agents
      } else if (res.data.data && Array.isArray(res.data.data)) {
        // 嵌套格式
        agents.value = res.data.data
      } else {
        agents.value = []
      }
    } else {
      agents.value = []
    }
    console.log('Loaded agents:', agents.value.length, agents.value)
  } catch (error: any) {
    console.error('Failed to load agents:', error)
    ElMessage.error('加载主机列表失败：' + (error.message || '未知错误'))
    agents.value = []
  }
}

// 主机变化
const handleHostChange = () => {
  predictionData.value = null
  costOptimization.value = null
  llmTimeout.value = false
  costTimeout.value = false
  anomalyEvents.value = []
  anomalyStatistics.value = null
  llmSummary.value = ''
  llmSummaryAnalyzing.value = false
  if (chart) {
    chart.dispose()
    chart = null
  }
}

// 性能分析主机变更处理
const handlePerformanceHostChange = () => {
  performanceSummary.value = ''
  performanceAnalyzing.value = false
  if (performanceStreamCancelFn) {
    performanceStreamCancelFn()
    performanceStreamCancelFn = null
  }
}

// 性能分析
const analyzePerformanceHandler = async () => {
  if (!performanceForm.hostId) {
    ElMessage.warning('请先选择主机')
    return
  }

  performanceAnalyzing.value = true
  performanceSummary.value = ''
  
  // 清除之前的流式连接
  if (performanceStreamCancelFn) {
    performanceStreamCancelFn()
    performanceStreamCancelFn = null
  }

  try {
    performanceStreamCancelFn = streamPerformanceAnalysis(
      {
        host_id: performanceForm.hostId,
        hours: performanceForm.hours || 24
      },
      (chunk) => {
        // 接收流式数据块
        if (chunk.error) {
          console.error('流式性能分析错误:', chunk.error)
          performanceAnalyzing.value = false
          if (performanceStreamCancelFn) {
            performanceStreamCancelFn()
            performanceStreamCancelFn = null
          }
          ElMessage.error('AI分析失败：' + chunk.error)
          return
        }
        
        // 累积内容
        if (chunk.content) {
          performanceSummary.value += chunk.content
        }
        
        // 如果完成
        if (chunk.done) {
          performanceAnalyzing.value = false
          if (performanceStreamCancelFn) {
            performanceStreamCancelFn()
            performanceStreamCancelFn = null
          }
          ElMessage.success('性能分析报告生成完成')
        }
      },
      (error) => {
        // 错误处理
        console.error('流式性能分析连接错误:', error)
        performanceAnalyzing.value = false
        if (performanceStreamCancelFn) {
          performanceStreamCancelFn()
          performanceStreamCancelFn = null
        }
        ElMessage.error('AI分析连接失败：' + (error.message || '未知错误'))
      },
      () => {
        // 完成回调
        performanceAnalyzing.value = false
        if (performanceStreamCancelFn) {
          performanceStreamCancelFn()
          performanceStreamCancelFn = null
        }
      }
    )
  } catch (error: any) {
    console.error('性能分析失败:', error)
    ElMessage.error('性能分析失败：' + (error.message || '未知错误'))
    performanceAnalyzing.value = false
    performanceSummary.value = ''
  }
}

// 轮询LLM任务状态
const pollLLMTask = async (taskId: string, type: 'capacity' | 'cost') => {
  const maxAttempts = 60 // 最多轮询60次（5分钟）
  let attempts = 0
  
  const poll = async () => {
    try {
      const res = await getLLMTaskStatus(taskId)
      const task = res.data || res
      
      if (task.status === 'completed') {
        // 任务完成，更新数据
        if (type === 'capacity' && predictionData.value) {
          predictionData.value = {
            ...predictionData.value,
            llm_analysis: task.result
          }
          llmTimeout.value = false // 清除超时状态
          llmFailed.value = false // 清除失败状态
        } else if (type === 'cost' && costOptimization.value) {
          costOptimization.value = {
            ...costOptimization.value,
            recommendation: task.result || ''
          }
          costTimeout.value = false // 清除超时状态
          costFailed.value = false // 清除失败状态
        }
        
        if (type === 'capacity') {
          llmAnalyzing.value = false
          if (llmPollingTimer) {
            clearInterval(llmPollingTimer)
            llmPollingTimer = null
          }
        } else {
          costAnalyzing.value = false
          if (costPollingTimer) {
            clearInterval(costPollingTimer)
            costPollingTimer = null
          }
        }
        ElMessage.success('AI分析完成')
        return
      } else if (task.status === 'failed') {
        // 任务失败
        if (type === 'capacity') {
          llmAnalyzing.value = false
          llmTimeout.value = false
          llmFailed.value = true
          if (llmPollingTimer) {
            clearInterval(llmPollingTimer)
            llmPollingTimer = null
          }
          // 失败时不设置llm_analysis，只显示失败提示
          if (predictionData.value) {
            predictionData.value.llm_analysis = undefined
          }
        } else {
          costAnalyzing.value = false
          costTimeout.value = false
          costFailed.value = true
          if (costPollingTimer) {
            clearInterval(costPollingTimer)
            costPollingTimer = null
          }
          // 失败时清除推荐内容，只显示失败提示
          if (costOptimization.value) {
            costOptimization.value.recommendation = undefined
          }
        }
        ElMessage.warning('AI分析请求失败，已显示提示信息')
        return
      }
      
      // 继续轮询
      attempts++
      if (attempts >= maxAttempts) {
        // 超时
        if (type === 'capacity') {
          llmAnalyzing.value = false
          llmTimeout.value = true
          if (llmPollingTimer) {
            clearInterval(llmPollingTimer)
            llmPollingTimer = null
          }
          // 显示超时提示信息
          if (predictionData.value) {
            predictionData.value.llm_analysis = {
              summary: 'AI分析超时',
              analysis: '抱歉，AI分析请求超时。可能的原因包括：\n\n1. **网络延迟**：网络连接不稳定或延迟较高\n2. **模型处理时间过长**：大模型需要更多时间处理复杂分析\n3. **服务器负载**：当前服务器负载较高\n\n**建议操作：**\n- 请稍后刷新页面查看结果（分析可能在后台继续处理）\n- 如果问题持续，请联系管理员检查系统状态\n- 可以尝试重新发起分析请求',
              recommendations: ['稍后刷新页面查看分析结果', '检查网络连接是否正常', '如问题持续，联系系统管理员'],
              cost_optimization: '由于分析超时，成本优化建议暂不可用。请稍后重试。',
              risks: ['分析超时可能导致建议不完整', '建议手动检查资源使用情况']
            }
          }
        } else {
          costAnalyzing.value = false
          costTimeout.value = true
          if (costPollingTimer) {
            clearInterval(costPollingTimer)
            costPollingTimer = null
          }
          // 显示超时提示信息
          if (costOptimization.value) {
            costOptimization.value.recommendation = '抱歉，成本优化分析请求超时。可能的原因包括：\n\n1. **网络延迟**：网络连接不稳定或延迟较高\n2. **模型处理时间过长**：大模型需要更多时间处理复杂分析\n3. **服务器负载**：当前服务器负载较高\n\n**建议操作：**\n- 请稍后刷新页面查看结果（分析可能在后台继续处理）\n- 如果问题持续，请联系管理员检查系统状态\n- 可以尝试重新发起分析请求'
          }
        }
        ElMessage.warning('AI分析超时，已显示提示信息')
      }
    } catch (error: any) {
      console.error('Poll LLM task error:', error)
      attempts++
      if (attempts >= maxAttempts) {
        if (type === 'capacity') {
          llmAnalyzing.value = false
          llmTimeout.value = false
          llmFailed.value = true // 轮询失败时也设置失败状态
          if (llmPollingTimer) {
            clearInterval(llmPollingTimer)
            llmPollingTimer = null
          }
          // 失败时不设置llm_analysis，只显示失败提示
          if (predictionData.value) {
            predictionData.value.llm_analysis = undefined
          }
        } else {
          costAnalyzing.value = false
          if (costPollingTimer) {
            clearInterval(costPollingTimer)
            costPollingTimer = null
          }
        }
      }
    }
  }
  
  // 立即执行一次
  await poll()
  
  // 每5秒轮询一次
  if (type === 'capacity') {
    llmPollingTimer = window.setInterval(poll, 5000)
  } else {
    costPollingTimer = window.setInterval(poll, 5000)
  }
}

// 加载预测数据（不包含AI分析）
const loadPrediction = async () => {
  if (!filterForm.hostId) {
    ElMessage.warning('请先选择主机')
    return
  }

  loading.value = true
  llmAnalyzing.value = false
  llmTimeout.value = false // 清除超时状态
  llmFailed.value = false // 清除失败状态
  // 清除之前的轮询
  if (llmPollingTimer) {
    clearInterval(llmPollingTimer)
    llmPollingTimer = null
  }
  
  try {
    const res = await getCapacityPrediction({
      host_id: filterForm.hostId,
      type: filterForm.resourceType,
      days: filterForm.days,
      threshold: filterForm.threshold,
      enable_llm: false // 不启用AI分析
    })
    const data = res.data || res
    predictionData.value = {
      ...data,
      llm_analysis: undefined // 不显示LLM分析
    }
    
    await nextTick()
    if (!chart && chartRef.value) {
      initChart()
    } else {
      updateChart()
    }
  } catch (error: any) {
    ElMessage.error('加载预测数据失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 加载预测数据（包含AI分析）- 使用流式输出
const loadPredictionWithAI = async () => {
  if (!filterForm.hostId) {
    ElMessage.warning('请先选择主机')
    return
  }

  loading.value = true
  llmAnalyzing.value = false
  llmTimeout.value = false
  llmFailed.value = false
  streamContent.value = '' // 清空流式内容
  
  // 清除之前的轮询和流式连接
  if (llmPollingTimer) {
    clearInterval(llmPollingTimer)
    llmPollingTimer = null
  }
  if (streamCancelFn) {
    streamCancelFn()
    streamCancelFn = null
  }
  
  try {
    // 先加载基础预测数据
    const res = await getCapacityPrediction({
      host_id: filterForm.hostId,
      type: filterForm.resourceType,
      days: filterForm.days,
      threshold: filterForm.threshold,
      enable_llm: false // 先不启用AI分析，使用流式接口
    })
    const data = res.data || res
    predictionData.value = {
      ...data,
      llm_analysis: undefined // 先不显示LLM分析
    }
    
    await nextTick()
    if (!chart && chartRef.value) {
      initChart()
    } else {
      updateChart()
    }
    
    // 开始流式分析
    llmAnalyzing.value = true
    llmTimeout.value = false
    llmFailed.value = false
    
    // 初始化流式分析结果
    if (!predictionData.value.llm_analysis) {
      predictionData.value.llm_analysis = {
        summary: '',
        analysis: '',
        recommendations: [],
        cost_optimization: '',
        risks: []
      }
    }
    
    // 使用流式接口
    const { streamCapacityAnalysis } = await import('@/api/prediction')
    streamCancelFn = streamCapacityAnalysis(
      {
        host_id: filterForm.hostId,
        type: filterForm.resourceType,
        days: filterForm.days,
        threshold: filterForm.threshold
      },
      (chunk) => {
        // 接收流式数据块
        if (chunk.error) {
          console.error('流式分析错误:', chunk.error)
          llmAnalyzing.value = false
          llmFailed.value = true
          if (streamCancelFn) {
            streamCancelFn()
            streamCancelFn = null
          }
          ElMessage.error('AI分析失败：' + chunk.error)
          return
        }
        
        // 累积内容
        streamContent.value += chunk.content
        
        // 实时解析并更新显示
        parseAndUpdateStreamContent(streamContent.value)
        
        // 如果完成
        if (chunk.done) {
          llmAnalyzing.value = false
          if (streamCancelFn) {
            streamCancelFn()
            streamCancelFn = null
          }
          ElMessage.success('AI分析完成')
        }
      },
      (error) => {
        // 错误处理
        console.error('流式分析连接错误:', error)
        llmAnalyzing.value = false
        llmFailed.value = true
        if (streamCancelFn) {
          streamCancelFn()
          streamCancelFn = null
        }
        ElMessage.error('AI分析连接失败：' + (error.message || '未知错误'))
      },
      () => {
        // 完成回调
        llmAnalyzing.value = false
        if (streamCancelFn) {
          streamCancelFn()
          streamCancelFn = null
        }
      }
    )
    
    // 设置超时保护（5分钟）
    setTimeout(() => {
      if (llmAnalyzing.value) {
        llmAnalyzing.value = false
        llmTimeout.value = true
        if (streamCancelFn) {
          streamCancelFn()
          streamCancelFn = null
        }
        ElMessage.warning('AI分析超时')
      }
    }, 5 * 60 * 1000)
    
  } catch (error: any) {
    console.error('加载预测数据失败:', error)
    llmAnalyzing.value = false
    llmFailed.value = true
    
    if (!predictionData.value) {
      try {
        const res = await getCapacityPrediction({
          host_id: filterForm.hostId,
          type: filterForm.resourceType,
          days: filterForm.days,
          threshold: filterForm.threshold,
          enable_llm: false
        })
        const data = res.data || res
        predictionData.value = {
          ...data,
          llm_analysis: undefined
        }
        await nextTick()
        if (!chart && chartRef.value) {
          initChart()
        } else {
          updateChart()
        }
      } catch (loadError: any) {
        console.error('加载基础预测数据也失败:', loadError)
      }
    } else {
      predictionData.value.llm_analysis = undefined
    }
    ElMessage.error('加载预测数据失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 解析并更新流式内容
const parseAndUpdateStreamContent = (content: string) => {
  if (!predictionData.value) {
    return
  }
  
  // 确保 llm_analysis 对象存在
  if (!predictionData.value.llm_analysis) {
    predictionData.value.llm_analysis = {
      summary: '',
      analysis: '',
      recommendations: [],
      cost_optimization: '',
      risks: []
    }
  }
  
  // 解析Markdown格式的内容
  // 查找各个部分 - 改进正则表达式，支持单个换行符或双换行符
  // 摘要部分：匹配 "## 摘要" 后跟一个或多个换行符，然后匹配内容直到下一个 "##" 或字符串结尾
  const summaryMatch = content.match(/##\s*摘要\s*\n+([\s\S]*?)(?=\n##|$)/)
  const analysisMatch = content.match(/##\s*详细分析\s*\n+([\s\S]*?)(?=\n##|$)/)
  const recommendationsMatch = content.match(/##\s*建议\s*\n+([\s\S]*?)(?=\n##|$)/)
  const costOptMatch = content.match(/##\s*成本优化建议\s*\n+([\s\S]*?)(?=\n##|$)/)
  const risksMatch = content.match(/##\s*风险提示\s*\n+([\s\S]*?)(?=\n##|$)/)
  
  // 如果找不到标准格式，尝试更宽松的匹配（支持中文标点）
  const summaryMatchLoose = summaryMatch || content.match(/##\s*摘要[：:]\s*\n*([\s\S]*?)(?=\n##|$)/)
  const analysisMatchLoose = analysisMatch || content.match(/##\s*详细分析[：:]\s*\n*([\s\S]*?)(?=\n##|$)/)
  
  if (summaryMatchLoose && summaryMatchLoose[1]) {
    const summaryText = summaryMatchLoose[1].trim()
    // 如果摘要内容不为空，更新
    if (summaryText && summaryText !== predictionData.value.llm_analysis.summary) {
      predictionData.value.llm_analysis.summary = summaryText
      console.log('更新摘要:', summaryText.substring(0, 50))
    }
  }
  
  if (analysisMatchLoose && analysisMatchLoose[1]) {
    const analysisText = analysisMatchLoose[1].trim()
    if (analysisText && analysisText !== predictionData.value.llm_analysis.analysis) {
      predictionData.value.llm_analysis.analysis = analysisText
    }
  }
  
  if (recommendationsMatch && recommendationsMatch[1]) {
    // 解析建议列表（支持 1. 或 - 格式）
    const recText = recommendationsMatch[1].trim()
    const recs = recText.split(/\n(?=\d+[\.、]|\-|\*)/).map(r => r.replace(/^\d+[\.、]\s*|^[-*]\s*/, '').trim()).filter(r => r)
    if (recs.length > 0) {
      predictionData.value.llm_analysis.recommendations = recs
    }
  }
  
  if (costOptMatch && costOptMatch[1]) {
    const costText = costOptMatch[1].trim()
    if (costText && costText !== predictionData.value.llm_analysis.cost_optimization) {
      predictionData.value.llm_analysis.cost_optimization = costText
    }
  }
  
  if (risksMatch && risksMatch[1]) {
    // 解析风险列表
    const riskText = risksMatch[1].trim()
    const risks = riskText.split(/\n(?=\d+[\.、]|\-|\*)/).map(r => r.replace(/^\d+[\.、]\s*|^[-*]\s*/, '').trim()).filter(r => r)
    if (risks.length > 0) {
      predictionData.value.llm_analysis.risks = risks
    }
  }
}

// 加载成本优化（使用流式输出）
const loadCostOptimization = async () => {
  if (!filterForm.hostId) {
    ElMessage.warning('请先选择主机')
    return
  }

  costLoading.value = true
  costAnalyzing.value = false
  costTimeout.value = false // 清除超时状态
  costFailed.value = false // 清除失败状态
  costStreamContent.value = '' // 清空流式内容
  
  // 清除之前的轮询和流式连接
  if (costPollingTimer) {
    clearInterval(costPollingTimer)
    costPollingTimer = null
  }
  if (costStreamCancelFn) {
    costStreamCancelFn()
    costStreamCancelFn = null
  }
  
  try {
    // 先获取基础数据（预测数据）
    const res = await getCostOptimization(filterForm.hostId)
    const data = res.data || res
    costOptimization.value = {
      ...data,
      recommendation: '' // 先不显示建议，等待流式结果
    }
    
    // 开始流式分析
    costAnalyzing.value = true
    costTimeout.value = false
    costFailed.value = false
    
    // 使用流式接口
    costStreamCancelFn = streamCostOptimization(
      {
        host_id: filterForm.hostId
      },
      (chunk) => {
        // 接收流式数据块
        if (chunk.error) {
          console.error('流式成本优化分析错误:', chunk.error)
          costAnalyzing.value = false
          costFailed.value = true
          if (costStreamCancelFn) {
            costStreamCancelFn()
            costStreamCancelFn = null
          }
          ElMessage.error('成本优化分析失败：' + chunk.error)
          return
        }
        
        // 累积内容
        costStreamContent.value += chunk.content
        
        // 实时更新显示
        if (costOptimization.value) {
          costOptimization.value.recommendation = costStreamContent.value
        }
        
        // 如果完成
        if (chunk.done) {
          costAnalyzing.value = false
          if (costStreamCancelFn) {
            costStreamCancelFn()
            costStreamCancelFn = null
          }
          ElMessage.success('成本优化分析完成')
        }
      },
      (error) => {
        // 错误处理
        console.error('流式成本优化分析连接错误:', error)
        costAnalyzing.value = false
        costFailed.value = true
        if (costStreamCancelFn) {
          costStreamCancelFn()
          costStreamCancelFn = null
        }
        ElMessage.error('成本优化分析失败：' + (error.message || '未知错误'))
      },
      () => {
        // 完成处理
        costAnalyzing.value = false
        if (costStreamCancelFn) {
          costStreamCancelFn()
          costStreamCancelFn = null
        }
      }
    )
  } catch (error: any) {
    costLoading.value = false
    costAnalyzing.value = false
    ElMessage.error('加载成本优化建议失败：' + (error.message || '未知错误'))
  } finally {
    costLoading.value = false
  }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  if (chart) {
    chart.dispose()
  }
  chart = echarts.init(chartRef.value)
  if (predictionData.value) {
    updateChart()
  }
}

// 更新图表
const updateChart = async () => {
  if (!chart || !predictionData.value || !filterForm.hostId) return

  // 获取历史数据
  try {
    const historyRes = await getHistoryMetrics({
      host_id: filterForm.hostId,
      type: filterForm.resourceType,
      start: `-${filterForm.days * 2}d`,
      end: 'now',
      interval: '1h'
    })

    const historyData = historyRes.data || []
    const prediction = predictionData.value.prediction

    // 准备历史数据
    const historyTimes = historyData.map((item: any) => dayjs(item.timestamp).format('MM-DD HH:mm'))
    const historyValues = historyData.map((item: any) => {
      if (filterForm.resourceType === 'cpu') {
        return item.values?.usage_percent || 0
      } else if (filterForm.resourceType === 'memory') {
        return item.values?.used_percent || 0
      } else {
        return item.values?.used_percent || 0
      }
    })

    // 生成预测数据点
    const now = dayjs()
    const predictedTime = dayjs(prediction.predicted_time)
    const daysDiff = predictedTime.diff(now, 'hour')
    const predictionTimes: string[] = []
    const predictionValues: number[] = []

    // 从当前值线性增长到预测值
    const currentValue = prediction.current_value
    const predictedValue = prediction.predicted_value
    const growthRate = (predictedValue - currentValue) / daysDiff

    for (let i = 0; i <= daysDiff; i += 6) {
      const time = now.add(i, 'hour')
      predictionTimes.push(time.format('MM-DD HH:mm'))
      predictionValues.push(Math.max(0, Math.min(100, currentValue + growthRate * i)))
    }

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: (params: any) => {
          if (!params || params.length === 0) return ''
          let result = `<div style="margin-bottom: 4px; font-weight: 500;">${params[0].axisValue}</div>`
          params.forEach((item: any) => {
            // 跳过null、undefined或空值
            if (item.value === null || item.value === undefined || item.value === '') {
              return
            }
            // 只处理数值类型
            if (typeof item.value === 'number') {
              const value = item.value.toFixed(2)
              result += `<div style="margin: 4px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
                <span style="margin-right: 8px;">${item.seriesName}:</span>
                <span style="font-weight: 500;">${value}%</span>
              </div>`
            }
          })
          return result
        }
      },
      legend: {
        data: ['历史数据', '预测数据', '阈值线'],
        top: 10, // 图例放在顶部
        left: 'center', // 居中显示
        itemGap: 20 // 图例项之间的间距
      },
      grid: {
        left: '3%',
        right: '4%',
        top: '15%', // 为顶部图例留出空间
        bottom: '10%', // 增加底部空间，避免与x轴标签重叠
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [...historyTimes, ...predictionTimes]
      },
      yAxis: {
        type: 'value',
        name: '使用率 (%)',
        min: 0,
        max: 100,
        axisLine: {
          lineStyle: {
            color: '#999'
          }
        }
      },
      series: [
        {
          name: '历史数据',
          type: 'line',
          data: [...historyValues, ...new Array(predictionTimes.length).fill(null)],
          smooth: true,
          itemStyle: {
            color: '#409EFF'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          }
        },
        {
          name: '预测数据',
          type: 'line',
          data: [...new Array(historyTimes.length).fill(null), ...predictionValues],
          smooth: true,
          itemStyle: {
            color: '#E6A23C'
          },
          lineStyle: {
            type: 'dashed'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
              { offset: 1, color: 'rgba(230, 162, 60, 0.1)' }
            ])
          }
        },
        {
          name: '阈值线',
          type: 'line',
          data: new Array(historyTimes.length + predictionTimes.length).fill(filterForm.threshold),
          lineStyle: {
            color: '#F56C6C',
            type: 'dashed',
            width: 2
          },
          symbol: 'none',
          markLine: {
            data: [
              {
                yAxis: filterForm.threshold,
                name: '阈值'
              }
            ]
          }
        }
      ]
    }

    chart.setOption(option)
  } catch (error: any) {
    console.error('更新图表失败：', error)
  }
}

// 获取趋势类型
const getTrendType = (trend: string) => {
  const types: Record<string, string> = {
    increasing: 'danger',
    decreasing: 'success',
    stable: 'info'
  }
  return types[trend] || 'info'
}

// 获取趋势名称
const getTrendName = (trend: string) => {
  const names: Record<string, string> = {
    increasing: '上升',
    decreasing: '下降',
    stable: '稳定'
  }
  return names[trend] || trend
}

// 获取紧急程度类型
const getUrgencyType = (urgency: string) => {
  const types: Record<string, string> = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success'
  }
  return types[urgency] || 'info'
}

// 获取紧急程度名称
const getUrgencyName = (urgency: string) => {
  const names: Record<string, string> = {
    critical: '紧急',
    high: '高',
    medium: '中等',
    low: '低'
  }
  return names[urgency] || urgency
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

// 格式化Markdown内容（支持标题、列表等）
const formatMarkdown = (text: string | null | undefined): string => {
  if (!text) return ''
  
  // 转义HTML特殊字符，防止XSS攻击
  const escapeHtml = (str: string | null | undefined): string => {
    if (!str) return ''
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return str.replace(/[&<>"']/g, (m) => map[m] || m)
  }
  
  // 按行分割处理
  const lines = text.split('\n')
  const result: string[] = []
  let inParagraph = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined) continue
    const trimmedLine = line.trim()
    
    // 空行处理
    if (!trimmedLine) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      // 空行也保留，作为段落分隔
      continue
    }
    
    // 处理 ### 标题（三级标题，必须在 ## 之前检查）
    if (trimmedLine.startsWith('### ')) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      const content = escapeHtml(trimmedLine.substring(4).trim())
      if (content) {
        result.push(`<h4 class="markdown-h4">${content}</h4>`)
      }
      continue
    }
    
    // 处理 ## 标题（二级标题，包括 ## 1. 这种格式）
    if (trimmedLine.startsWith('## ')) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      const content = escapeHtml(trimmedLine.substring(3).trim())
      if (content) {
        result.push(`<h3 class="markdown-h3">${content}</h3>`)
      }
      continue
    }
    
    // 处理 # 标题（一级标题，但不能是 ## 或 ###）
    if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('##')) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      const content = escapeHtml(trimmedLine.substring(2).trim())
      if (content) {
        result.push(`<h2 class="markdown-h2">${content}</h2>`)
      }
      continue
    }
    
    // 处理有序列表（1. 2. 3. 等，但排除标题中的数字）
    // 支持格式：1. 内容 或 1、内容（中文标点）
    const orderedListMatch = trimmedLine.match(/^(\d+[\.、]\s+)(.+)$/)
    if (orderedListMatch && !trimmedLine.startsWith('#')) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      const content = escapeHtml(trimmedLine)
      if (content) {
        result.push(`<div class="markdown-list-item">${content}</div>`)
      }
      continue
    }
    
    // 处理无序列表（- 或 *）
    const unorderedListMatch = trimmedLine.match(/^[-*]\s+(.+)$/)
    if (unorderedListMatch && unorderedListMatch[1]) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      const content = escapeHtml(unorderedListMatch[1])
      if (content) {
        result.push(`<div class="markdown-list-item">• ${content}</div>`)
      }
      continue
    }
    
    // 处理缩进列表（以空格或制表符开头的列表项，如子列表）
    if (/^[\s\t]+[-*]\s+(.+)$/.test(trimmedLine)) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      const indentMatch = trimmedLine.match(/^[\s\t]+[-*]\s+(.+)$/)
      if (indentMatch && indentMatch[1]) {
        const content = escapeHtml(indentMatch[1])
        if (content) {
          result.push(`<div class="markdown-list-item" style="margin-left: 30px;">• ${content}</div>`)
        }
      }
      continue
    }
    
    // 普通文本 - 确保所有非空内容都被显示
    const escapedLine = escapeHtml(trimmedLine)
    if (escapedLine) {
      if (!inParagraph) {
        result.push(`<p class="markdown-paragraph">${escapedLine}`)
        inParagraph = true
      } else {
        // 继续当前段落，添加换行
        result[result.length - 1] += '<br/>' + escapedLine
      }
    }
  }
  
  // 关闭最后一个段落
  if (inParagraph) {
    result.push('</p>')
  }
  
  const output = result.join('')
  // 如果结果为空，至少显示原始文本（转义后）
  if (!output && text.trim()) {
    return `<p class="markdown-paragraph">${escapeHtml(text.trim())}</p>`
  }
  
  return output
}

// 格式化推荐内容（支持换行）
const formatRecommendation = (text: string) => {
  if (!text) return ''
  return formatMarkdown(text)
}

// 获取成本优化表格数据
const getCostOptimizationTableData = () => {
  if (!costOptimization.value || !costOptimization.value.predictions) return []
  
  return Object.entries(costOptimization.value.predictions).map(([resource, pred]: [string, any]) => ({
    resource: resource === 'cpu' ? 'CPU' : resource === 'memory' ? '内存' : '磁盘',
    current: pred.current_value || 0,
    predicted: pred.predicted_value || 0,
    days: pred.days_to_threshold || -1,
    trend: pred.trend || 'stable'
  }))
}

// 检测异常
const detectAnomaliesHandler = async () => {
  if (!filterForm.hostId) {
    ElMessage.warning('请先选择主机')
    return
  }

  anomalyDetecting.value = true
  anomalyEvents.value = []
  anomalyStatistics.value = null
  llmSummary.value = ''
  llmSummaryAnalyzing.value = false
  
  // 清除之前的流式连接
  if (anomalyStreamCancelFn) {
    anomalyStreamCancelFn()
    anomalyStreamCancelFn = null
  }

  try {
    // 1. 先进行异常检测
    const res = await detectAnomalies({
      host_id: filterForm.hostId,
      metric_type: filterForm.resourceType || '',
      hours: 24
    })
    const data = res.data || res
    anomalyEvents.value = data.anomalies || []
    
    // 加载统计信息
    await loadAnomalyStatistics()
    
    if (anomalyEvents.value.length > 0) {
      ElMessage.success(`检测到 ${anomalyEvents.value.length} 个异常事件，正在生成AI分析总结...`)
    } else {
      ElMessage.info('未检测到异常')
    }
    
    // 2. 调用流式LLM分析（无论是否检测到异常都进行分析）
    llmSummaryAnalyzing.value = true
    llmSummary.value = ''
    
    anomalyStreamCancelFn = streamAnomalyAnalysis(
      {
        host_id: filterForm.hostId,
        metric_type: filterForm.resourceType || '',
        hours: 24
      },
      (chunk) => {
        // 接收流式数据块
        if (chunk.error) {
          console.error('流式异常分析错误:', chunk.error)
          llmSummaryAnalyzing.value = false
          if (anomalyStreamCancelFn) {
            anomalyStreamCancelFn()
            anomalyStreamCancelFn = null
          }
          ElMessage.error('AI分析失败：' + chunk.error)
          return
        }
        
        // 累积内容
        if (chunk.content) {
          llmSummary.value += chunk.content
        }
        
        // 如果完成
        if (chunk.done) {
          llmSummaryAnalyzing.value = false
          if (anomalyStreamCancelFn) {
            anomalyStreamCancelFn()
            anomalyStreamCancelFn = null
          }
          ElMessage.success('AI分析总结生成完成')
        }
      },
      (error) => {
        // 错误处理
        console.error('流式异常分析连接错误:', error)
        llmSummaryAnalyzing.value = false
        if (anomalyStreamCancelFn) {
          anomalyStreamCancelFn()
          anomalyStreamCancelFn = null
        }
        ElMessage.error('AI分析连接失败：' + (error.message || '未知错误'))
      },
      () => {
        // 完成回调
        llmSummaryAnalyzing.value = false
        if (anomalyStreamCancelFn) {
          anomalyStreamCancelFn()
          anomalyStreamCancelFn = null
        }
      }
    )
    
  } catch (error: any) {
    console.error('异常检测失败:', error)
    const errorMsg = error.message || '未知错误'
    ElMessage.error({
      message: `异常检测失败：${errorMsg}`,
      duration: 5000,
      showClose: true
    })
    
    // 如果是数据不足的错误，给出更友好的提示
    if (errorMsg.includes('Insufficient') || errorMsg.includes('数据不足') || errorMsg.includes('no data')) {
      ElMessage.warning({
        message: '提示：历史数据不足，无法进行异常检测。请确保：\n1. 主机已正常运行一段时间（至少24小时）\n2. 已收集到足够的监控数据\n3. 选择的资源类型有对应的监控数据',
        duration: 6000,
        showClose: true
      })
    }
    
    // 出错时也要重置LLM分析状态
    llmSummaryAnalyzing.value = false
    llmSummary.value = ''
  } finally {
    anomalyDetecting.value = false
  }
}

// 加载异常统计信息
const loadAnomalyStatistics = async () => {
  if (!filterForm.hostId) return
  
  try {
    const res = await getAnomalyStatistics(filterForm.hostId)
    anomalyStatistics.value = res.data || res
  } catch (error: any) {
    console.error('加载异常统计失败:', error)
  }
}

// 显示异常详情
const showAnomalyDetail = async (anomaly: AnomalyEvent) => {
  selectedAnomaly.value = anomaly
  anomalyDetailVisible.value = true
  
  // 如果需要获取完整详情，可以调用API
  try {
    const res = await getAnomalyEventDetail(anomaly.id)
    selectedAnomaly.value = res.data || res
  } catch (error: any) {
    console.error('获取异常详情失败:', error)
  }
}

// 解决异常
const resolveAnomaly = async (anomaly: AnomalyEvent) => {
  try {
    await resolveAnomalyEvent(anomaly.id)
    ElMessage.success('异常已标记为已解决')
    // 更新本地状态
    anomaly.is_resolved = true
    anomaly.resolved_at = new Date().toISOString()
    // 刷新统计信息
    await loadAnomalyStatistics()
  } catch (error: any) {
    ElMessage.error('标记异常失败：' + (error.message || '未知错误'))
  }
}

// 获取异常类型标签
const getAnomalyTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    metric_spike: 'danger',
    metric_drop: 'warning',
    metric_drift: 'info',
    log_error: 'danger',
    log_pattern: 'warning',
    correlation: 'info',
    behavior: 'warning'
  }
  return tags[type] || 'info'
}

// 获取异常类型名称
const getAnomalyTypeName = (type: string) => {
  const names: Record<string, string> = {
    metric_spike: '指标突增',
    metric_drop: '指标突降',
    metric_drift: '指标漂移',
    log_error: '日志错误',
    log_pattern: '日志模式异常',
    correlation: '关联异常',
    behavior: '行为异常'
  }
  return names[type] || type
}

// 获取严重程度标签类型
const getSeverityType = (severity: string) => {
  const types: Record<string, string> = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'success'
  }
  return types[severity] || 'info'
}

// 获取严重程度名称
const getSeverityName = (severity: string) => {
  const names: Record<string, string> = {
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低'
  }
  return names[severity] || severity
}

// 获取日志级别标签类型
const getLogLevelType = (level: string) => {
  const types: Record<string, string> = {
    ERROR: 'danger',
    FATAL: 'danger',
    WARN: 'warning',
    WARNING: 'warning',
    INFO: 'info',
    DEBUG: 'info'
  }
  return types[level] || 'info'
}

// 窗口大小变化时调整图表
const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

onMounted(() => {
  loadAgents()
  nextTick(() => {
    initChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }
  window.removeEventListener('resize', handleResize)
  
  // 清理流式连接（容量分析）
  if (streamCancelFn) {
    streamCancelFn()
    streamCancelFn = null
  }
  
  // 清理流式连接（成本优化）
  if (costStreamCancelFn) {
    costStreamCancelFn()
    costStreamCancelFn = null
  }
  
  // 清理流式连接（异常分析）
  if (anomalyStreamCancelFn) {
    anomalyStreamCancelFn()
    anomalyStreamCancelFn = null
  }
  
  // 清理流式连接（性能分析）
  if (performanceStreamCancelFn) {
    performanceStreamCancelFn()
    performanceStreamCancelFn = null
  }
  
  // 清除轮询定时器
  if (llmPollingTimer) {
    clearInterval(llmPollingTimer)
    llmPollingTimer = null
  }
  if (costPollingTimer) {
    clearInterval(costPollingTimer)
    costPollingTimer = null
  }
})
</script>

<style scoped lang="scss">
.ai-analysis-container {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: bold;
  }

  .filter-section {
    margin-bottom: 20px;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 4px;
  }

  .prediction-cards {
    margin-bottom: 20px;

    .card-content {
      text-align: center;

      .card-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 10px;
      }

      .card-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
      }
    }
  }

  .llm-summary-card {
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .summary-icon {
        font-size: 20px;
        color: #409EFF;
      }

      .summary-title {
        font-size: 18px;
        font-weight: 600;
      }

      .help-icon {
        font-size: 16px;
        color: #909399;
        cursor: help;
        transition: color 0.3s;

        &:hover {
          color: #409EFF;
        }
      }
    }
  }

  .llm-analysis-summary {
    .summary-content {
      padding: 10px 0;
      line-height: 1.8;
      color: #606266;

      // 使用已有的markdown样式
      .markdown-h2 {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        margin: 24px 0 16px 0;
        padding-bottom: 10px;
        border-bottom: 3px solid #409EFF;
      }

      .markdown-h3 {
        font-size: 18px;
        font-weight: 600;
        color: #409EFF;
        margin: 20px 0 12px 0;
      }

      .markdown-h4 {
        font-size: 16px;
        font-weight: 500;
        color: #606266;
        margin: 16px 0 10px 0;
      }

      .markdown-paragraph {
        margin: 12px 0;
        line-height: 1.8;
        color: #606266;
        word-break: break-word;
        white-space: pre-wrap;
      }

      .markdown-list-item {
        margin: 10px 0 10px 24px;
        line-height: 1.8;
        color: #606266;
        position: relative;
        padding-left: 8px;
      }
    }
  }

  .waiting-summary {
    padding: 40px 20px;
    text-align: center;
  }

  .performance-summary-card {
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .summary-icon {
        font-size: 20px;
        color: #409EFF;
      }

      .summary-title {
        font-size: 18px;
        font-weight: 600;
      }

      .help-icon {
        font-size: 16px;
        color: #909399;
        cursor: help;
        transition: color 0.3s;

        &:hover {
          color: #409EFF;
        }
      }
    }
  }

  .performance-analysis-summary {
    .summary-content {
      padding: 10px 0;
      line-height: 1.8;
      color: #606266;

      // 使用已有的markdown样式
      .markdown-h2 {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        margin: 24px 0 16px 0;
        padding-bottom: 10px;
        border-bottom: 3px solid #409EFF;
      }

      .markdown-h3 {
        font-size: 18px;
        font-weight: 600;
        color: #409EFF;
        margin: 20px 0 12px 0;
      }

      .markdown-h4 {
        font-size: 16px;
        font-weight: 500;
        color: #606266;
        margin: 16px 0 10px 0;
      }

      .markdown-paragraph {
        margin: 12px 0;
        line-height: 1.8;
        color: #606266;
        word-break: break-word;
        white-space: pre-wrap;
      }

      .markdown-list-item {
        margin: 10px 0 10px 24px;
        line-height: 1.8;
        color: #606266;
        position: relative;
        padding-left: 8px;
      }
    }
  }

  .llm-analysis {
    .analysis-section {
      margin-bottom: 20px;

      h4 {
        margin-bottom: 10px;
        color: #303133;
        font-size: 16px;
      }

      .markdown-content {
        line-height: 1.8;
        color: #606266;

        .markdown-h2 {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin: 20px 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #409EFF;
        }

        .markdown-h3 {
          font-size: 16px;
          font-weight: 600;
          color: #409EFF;
          margin: 16px 0 10px 0;
        }

        .markdown-h4 {
          font-size: 15px;
          font-weight: 500;
          color: #606266;
          margin: 12px 0 8px 0;
        }

        .markdown-paragraph {
          margin: 10px 0;
          line-height: 1.8;
          color: #606266;
          word-break: break-word; // 允许长单词（如主机名）换行
          white-space: pre-wrap; // 保留空格和换行
        }

        .markdown-list-item {
          margin: 8px 0 8px 20px;
          line-height: 1.6;
          color: #606266;
          position: relative;
          padding-left: 8px;
        }

        p {
          line-height: 1.8;
          color: #606266;
          margin: 10px 0;
        }
      }

      ul {
        margin: 10px 0;
        padding-left: 20px;

        li {
          margin-bottom: 8px;
          line-height: 1.6;
          color: #606266;
        }
      }

      .risk-item {
        color: #E6A23C;
      }
    }
  }

  .cost-optimization {
    .recommendation-content {
      line-height: 1.8;
      color: #606266;

      // 支持所有 markdown 样式
      .markdown-h2 {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin: 20px 0 12px 0;
        padding-bottom: 8px;
        border-bottom: 2px solid #409EFF;
      }

      .markdown-h3 {
        font-size: 16px;
        font-weight: 600;
        color: #409EFF;
        margin: 16px 0 10px 0;
      }

      .markdown-h4 {
        font-size: 15px;
        font-weight: 500;
        color: #606266;
        margin: 12px 0 8px 0;
      }

      .markdown-paragraph {
        margin: 10px 0;
        line-height: 1.8;
        color: #606266;
        word-break: break-word;
        white-space: pre-wrap;
      }

      .markdown-list-item {
        margin: 8px 0 8px 20px;
        line-height: 1.6;
        color: #606266;
        position: relative;
        padding-left: 8px;
      }

      p {
        margin-bottom: 10px;
        line-height: 1.8;
        color: #606266;
      }

      ul {
        margin: 10px 0;
        padding-left: 20px;

        li {
          margin-bottom: 8px;
          line-height: 1.6;
          color: #606266;
        }
      }
    }
  }

  .text-success {
    color: #67C23A;
  }

  .text-warning {
    color: #E6A23C;
  }

  .text-danger {
    color: #F56C6C;
  }

  .llm-loading {
    padding: 40px 20px;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-content {
    text-align: center;
    width: 100%;
  }

  .loading-animation {
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 120px;
  }

  .robot-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .robot {
    position: relative;
    width: 80px;
    height: 100px;
    animation: robot-bounce 2s ease-in-out infinite;
  }

  .robot-head {
    width: 60px;
    height: 50px;
    background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
    border-radius: 15px 15px 5px 5px;
    margin: 0 auto;
    position: relative;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  }

  .robot-eye {
    width: 8px;
    height: 8px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    top: 15px;
    animation: robot-blink 2s ease-in-out infinite;
  }

  .robot-eye.left-eye {
    left: 15px;
  }

  .robot-eye.right-eye {
    right: 15px;
  }

  .robot-mouth {
    width: 20px;
    height: 8px;
    border: 2px solid #fff;
    border-top: none;
    border-radius: 0 0 10px 10px;
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    animation: robot-talk 1s ease-in-out infinite;
  }

  .robot-body {
    width: 70px;
    height: 50px;
    background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
    border-radius: 8px;
    margin: 5px auto 0;
    position: relative;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  }

  .robot-panel {
    width: 40px;
    height: 25px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    
    &::before,
    &::after {
      content: '';
      width: 4px;
      height: 4px;
      background: #fff;
      border-radius: 50%;
      animation: robot-pulse 1.5s ease-in-out infinite;
    }
    
    &::after {
      animation-delay: 0.5s;
    }
  }

  .robot-arm {
    width: 12px;
    height: 35px;
    background: linear-gradient(135deg, #66b1ff 0%, #409EFF 100%);
    border-radius: 6px;
    position: absolute;
    top: 55px;
    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
  }

  .robot-arm.left-arm {
    left: -8px;
    transform-origin: top center;
    animation: robot-arm-swing-left 2s ease-in-out infinite;
  }

  .robot-arm.right-arm {
    right: -8px;
    transform-origin: top center;
    animation: robot-arm-swing-right 2s ease-in-out infinite;
  }

  @keyframes robot-bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes robot-blink {
    0%, 45%, 55%, 100% {
      transform: scaleY(1);
    }
    50% {
      transform: scaleY(0.1);
    }
  }

  @keyframes robot-talk {
    0%, 100% {
      width: 20px;
    }
    50% {
      width: 25px;
    }
  }

  @keyframes robot-pulse {
    0%, 100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
  }

  @keyframes robot-arm-swing-left {
    0%, 100% {
      transform: rotate(-10deg);
    }
    50% {
      transform: rotate(10deg);
    }
  }

  @keyframes robot-arm-swing-right {
    0%, 100% {
      transform: rotate(10deg);
    }
    50% {
      transform: rotate(-10deg);
    }
  }

  .loading-text {
    font-size: 16px;
    color: #303133;
    font-weight: 500;
    margin: 0 0 8px 0;
  }

  .loading-subtext {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }

  .analyzing-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #409EFF;
    animation: pulse-dot 1.5s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.3);
      opacity: 0.7;
    }
  }

  .table-header {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .help-icon {
      color: #909399;
      font-size: 14px;
      cursor: help;
      transition: color 0.3s;
      
      &:hover {
        color: #409EFF;
      }
    }
  }

  .anomaly-statistics {
    margin-bottom: 20px;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 4px;

    .stat-item {
      text-align: center;
      padding: 15px;

      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 10px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
      }
    }
  }

  .anomaly-message,
  .anomaly-root-cause,
  .anomaly-recommendations,
  .anomaly-related-metrics {
    margin-top: 20px;

    h4 {
      margin-bottom: 10px;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
    }

    ul {
      margin: 10px 0;
      padding-left: 20px;

      li {
        margin-bottom: 8px;
        line-height: 1.6;
        color: #606266;
      }
    }
  }

  .anomaly-detail {
    .markdown-content {
      line-height: 1.8;
      color: #606266;

      .markdown-h2 {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin: 20px 0 12px 0;
        padding-bottom: 8px;
        border-bottom: 2px solid #409EFF;
      }

      .markdown-h3 {
        font-size: 16px;
        font-weight: 600;
        color: #409EFF;
        margin: 16px 0 10px 0;
      }

      .markdown-paragraph {
        margin: 10px 0;
        line-height: 1.8;
        color: #606266;
      }

      ul {
        margin: 10px 0;
        padding-left: 20px;

        li {
          margin-bottom: 8px;
          line-height: 1.6;
          color: #606266;
        }
      }
    }
  }
}
</style>
