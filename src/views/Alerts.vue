<template>
  <div class="alerts-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>告警管理</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 通知渠道配置 -->
        <el-tab-pane label="通知渠道" name="channels">
          <div class="tab-header">
            <el-button type="primary" @click="handleCreateChannel">
              <el-icon><Plus /></el-icon>
              新增渠道
            </el-button>
            <el-button @click="loadChannels">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>

          <el-table
            v-loading="channelsLoading"
            :data="channels"
            stripe
            style="width: 100%"
            empty-text="暂无数据"
          >
            <el-table-column prop="name" label="名称" width="150" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag
                  :type="getChannelTypeTag(row.type)"
                  :style="getChannelTypeStyle(row.type)"
                  effect="dark"
                >
                  {{ getChannelTypeName(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.enabled"
                  @update:model-value="(val: boolean) => handleToggleChannel(row, val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleEditChannel(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button type="danger" link @click="handleDeleteChannel(row)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 告警规则配置 -->
        <el-tab-pane label="告警规则" name="rules">
          <div class="tab-header">
            <el-button type="primary" @click="handleCreateRule">
              <el-icon><Plus /></el-icon>
              新增规则
            </el-button>
            <el-button @click="loadRules">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>

          <el-table
            v-loading="rulesLoading"
            :data="rules"
            stripe
            style="width: 100%"
            empty-text="暂无数据"
          >
            <el-table-column prop="name" label="规则名称" width="200" />
            <el-table-column prop="metric_type" label="指标类型" width="120">
              <template #default="{ row }">
                <el-tag>{{ getMetricTypeName(row.metric_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="condition" label="条件" width="100">
              <template #default="{ row }">
                <span v-if="row.metric_type !== 'host_down'">{{ getConditionName(row.condition) }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="threshold" label="阈值" width="100">
              <template #default="{ row }">
                <span v-if="row.metric_type !== 'host_down'">{{ row.threshold }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="inhibit_duration" label="抑制时间" width="120">
              <template #default="{ row }">
                {{ row.inhibit_duration || 0 }}秒
              </template>
            </el-table-column>
            <el-table-column prop="severity" label="严重程度" width="120">
              <template #default="{ row }">
                <el-tag :type="getSeverityTag(row.severity)">
                  {{ getSeverityName(row.severity) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.enabled"
                  @update:model-value="(val: boolean) => handleToggleRule(row, val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleEditRule(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button type="danger" link @click="handleDeleteRule(row)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 告警静默配置 -->
        <el-tab-pane label="告警静默" name="silences">
          <div class="tab-header">
            <el-button type="primary" @click="handleCreateSilence">
              <el-icon><Plus /></el-icon>
              新增静默
            </el-button>
            <el-button @click="loadSilences">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>

          <el-table
            v-loading="silencesLoading"
            :data="silences"
            stripe
            style="width: 100%"
            empty-text="暂无数据"
          >
            <el-table-column prop="name" label="名称" width="200" />
            <el-table-column prop="start_time" label="开始时间" width="180">
              <template #default="{ row }">
                {{ dayjs(row.start_time).format('YYYY-MM-DD HH:mm:ss') }}
              </template>
            </el-table-column>
            <el-table-column prop="end_time" label="结束时间" width="180">
              <template #default="{ row }">
                {{ dayjs(row.end_time).format('YYYY-MM-DD HH:mm:ss') }}
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.enabled"
                  @update:model-value="(val: boolean) => handleToggleSilence(row, val)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="comment" label="备注" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleEditSilence(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button type="danger" link @click="handleDeleteSilence(row)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 告警历史 -->
        <el-tab-pane label="告警历史" name="history">
          <div class="tab-header">
            <el-select v-model="historyFilter.host_id" placeholder="选择主机" clearable style="width: 200px" @change="loadHistory">
              <el-option label="全部主机" value="" />
              <el-option
                v-for="agent in agents"
                :key="agent.host_id"
                :label="`${agent.hostname || agent.host_id} (${agent.host_id})`"
                :value="agent.host_id"
              />
            </el-select>
            <el-select v-model="historyFilter.status" placeholder="选择状态" clearable style="width: 150px; margin-left: 10px" @change="loadHistory">
              <el-option label="全部" value="" />
              <el-option label="告警中" value="firing" />
              <el-option label="已恢复" value="resolved" />
            </el-select>
            <el-button @click="loadHistory" style="margin-left: 10px">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button 
              type="danger" 
              :disabled="selectedHistoryIds.length === 0"
              style="margin-left: 10px"
              @click="handleBatchDeleteHistory"
            >
              <el-icon><Delete /></el-icon>
              批量删除 ({{ selectedHistoryIds.length }})
            </el-button>
          </div>

          <el-table
            v-loading="historyLoading"
            :data="history"
            stripe
            style="width: 100%"
            empty-text="暂无数据"
            @selection-change="handleHistorySelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="rule_name" label="规则名称" width="200" />
            <el-table-column prop="hostname" label="主机" width="150" />
            <el-table-column prop="severity" label="严重程度" width="120">
              <template #default="{ row }">
                <el-tag :type="getSeverityTag(row.severity)">
                  {{ getSeverityName(row.severity) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status)">
                  {{ getStatusName(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="metric_value" label="指标值" width="100">
              <template #default="{ row }">
                <span v-if="row.metric_type === 'host_down'">-</span>
                <span v-else>{{ row.metric_value != null ? row.metric_value.toFixed(2) : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="threshold" label="阈值" width="100">
              <template #default="{ row }">
                <span v-if="row.metric_type === 'host_down'">-</span>
                <span v-else>{{ row.threshold != null ? row.threshold : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="fired_at" label="触发时间" width="180">
              <template #default="{ row }">
                {{ dayjs(row.fired_at).format('YYYY-MM-DD HH:mm:ss') }}
              </template>
            </el-table-column>
            <el-table-column prop="resolved_at" label="恢复时间" width="180">
              <template #default="{ row }">
                {{ row.resolved_at ? dayjs(row.resolved_at).format('YYYY-MM-DD HH:mm:ss') : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="notify_status" label="通知状态" width="120">
              <template #default="{ row }">
                <el-tooltip v-if="row.notify_status === 'failed' && row.notify_error" :content="row.notify_error" placement="top">
                  <el-tag :type="row.notify_status === 'success' ? 'success' : row.notify_status === 'failed' ? 'danger' : 'info'">
                    {{ row.notify_status === 'success' ? '成功' : row.notify_status === 'failed' ? '失败' : '待发送' }}
                  </el-tag>
                </el-tooltip>
                <el-tag v-else :type="row.notify_status === 'success' ? 'success' : row.notify_status === 'failed' ? 'danger' : 'info'">
                  {{ row.notify_status === 'success' ? '成功' : row.notify_status === 'failed' ? '失败' : '待发送' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="消息" min-width="200" show-overflow-tooltip />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" link @click="handleDeleteHistory(row)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 通知渠道对话框 -->
    <el-dialog
      v-model="channelDialogVisible"
      :title="channelDialogTitle"
      width="600px"
      @close="resetChannelForm"
    >
      <el-form
        ref="channelFormRef"
        :model="channelForm"
        :rules="channelFormRules"
        label-width="120px"
      >
        <el-form-item label="渠道类型" prop="type">
          <el-select v-model="channelForm.type" placeholder="请选择渠道类型" :disabled="isEditChannel">
            <el-option value="email">
              <el-tag :style="getChannelTypeStyle('email')" effect="dark" size="small">邮件</el-tag>
            </el-option>
            <el-option value="dingtalk">
              <el-tag :style="getChannelTypeStyle('dingtalk')" effect="dark" size="small">钉钉</el-tag>
            </el-option>
            <el-option value="wechat">
              <el-tag :style="getChannelTypeStyle('wechat')" effect="dark" size="small">企业微信</el-tag>
            </el-option>
            <el-option value="feishu">
              <el-tag :style="getChannelTypeStyle('feishu')" effect="dark" size="small">飞书</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="渠道名称" prop="name">
          <el-input v-model="channelForm.name" placeholder="请输入渠道名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="channelForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="channelForm.enabled" />
        </el-form-item>

        <!-- 邮件配置 -->
        <template v-if="channelForm.type === 'email'">
          <el-form-item label="SMTP主机" prop="config.smtp_host">
            <el-input v-model="channelForm.config.smtp_host" placeholder="例如: smtp.example.com" />
          </el-form-item>
          <el-form-item label="SMTP端口" prop="config.smtp_port">
            <el-input-number v-model="channelForm.config.smtp_port" :min="1" :max="65535" />
          </el-form-item>
          <el-form-item label="SMTP用户" prop="config.smtp_user">
            <el-input v-model="channelForm.config.smtp_user" placeholder="SMTP用户名" />
          </el-form-item>
          <el-form-item label="SMTP密码" prop="config.smtp_password">
            <el-input v-model="channelForm.config.smtp_password" type="password" show-password placeholder="SMTP密码" />
          </el-form-item>
          <el-form-item label="发件人邮箱" prop="config.from_email">
            <el-input v-model="channelForm.config.from_email" placeholder="例如: alerts@example.com" />
          </el-form-item>
          <el-form-item label="发件人名称" prop="config.from_name">
            <el-input v-model="channelForm.config.from_name" placeholder="例如: 监控系统" />
          </el-form-item>
        </template>

        <!-- 钉钉配置 -->
        <template v-if="channelForm.type === 'dingtalk'">
          <el-form-item label="Webhook URL" prop="config.webhook_url">
            <el-input v-model="channelForm.config.webhook_url" placeholder="钉钉机器人Webhook地址" />
          </el-form-item>
        </template>

        <!-- 企业微信配置 -->
        <template v-if="channelForm.type === 'wechat'">
          <el-form-item label="Webhook URL" prop="config.webhook_url">
            <el-input v-model="channelForm.config.webhook_url" placeholder="企业微信机器人Webhook地址" />
          </el-form-item>
        </template>

        <!-- 飞书配置 -->
        <template v-if="channelForm.type === 'feishu'">
          <el-form-item label="Webhook URL" prop="config.webhook_url">
            <el-input v-model="channelForm.config.webhook_url" placeholder="飞书机器人Webhook地址" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="channelDialogVisible = false">取消</el-button>
        <el-button type="info" :loading="channelTestLoading" @click="handleTestChannel">
          测试
        </el-button>
        <el-button type="primary" :loading="channelSubmitLoading" @click="handleChannelSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 告警规则对话框 -->
    <el-dialog
      v-model="ruleDialogVisible"
      :title="ruleDialogTitle"
      width="700px"
      @close="resetRuleForm"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleFormRules"
        label-width="120px"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="ruleForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="指标类型" prop="metric_type">
          <el-select v-model="ruleForm.metric_type" placeholder="请选择指标类型">
            <el-option label="CPU使用率" value="cpu" />
            <el-option label="内存使用率" value="memory" />
            <el-option label="磁盘使用率" value="disk" />
            <el-option label="网络" value="network" />
            <el-option label="主机宕机" value="host_down" />
          </el-select>
        </el-form-item>
        <el-form-item label="主机ID" prop="host_id">
          <el-select v-model="ruleForm.host_id" placeholder="选择主机（留空表示所有主机）" clearable filterable>
            <el-option label="全部主机" value="" />
            <el-option
              v-for="agent in agents"
              :key="agent.host_id"
              :label="`${agent.hostname || agent.host_id} (${agent.host_id})`"
              :value="agent.host_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="条件" prop="condition" v-if="ruleForm.metric_type !== 'host_down'">
          <el-select v-model="ruleForm.condition" placeholder="请选择条件">
            <el-option label="大于 (>) " value="gt" />
            <el-option label="大于等于 (>=)" value="gte" />
            <el-option label="小于 (<)" value="lt" />
            <el-option label="小于等于 (<=)" value="lte" />
            <el-option label="等于 (=)" value="eq" />
            <el-option label="不等于 (!=)" value="neq" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值" prop="threshold" v-if="ruleForm.metric_type !== 'host_down'">
          <el-input-number 
            v-model="ruleForm.threshold" 
            :precision="2" 
            :min="0" 
            :max="100" 
            :step="0.1"
            controls-position="right"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item v-if="ruleForm.metric_type === 'host_down'" label="说明">
          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              主机宕机告警：当Agent通信失败（超过2分钟未收到心跳）时立即触发告警。无需设置阈值。
            </template>
          </el-alert>
        </el-form-item>
        <el-form-item label="持续时间(秒)" prop="duration">
          <el-input-number 
            v-model="ruleForm.duration" 
            :min="1" 
            :step="1"
            :precision="0"
            :controls="true"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #909399">持续多长时间才触发告警</span>
        </el-form-item>
        <el-form-item label="抑制时间(秒)" prop="inhibit_duration">
          <el-input-number 
            v-model="ruleForm.inhibit_duration" 
            :min="0" 
            :max="3600" 
            :step="1"
            :precision="0"
            :controls="true"
            style="width: 200px"
            placeholder="请输入抑制时间（0表示不抑制）"
          />
          <span style="margin-left: 10px; color: #909399">相同告警在此时间内只发送一次通知（0表示不抑制，默认300秒）</span>
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-select v-model="ruleForm.severity" placeholder="请选择严重程度">
            <el-option label="严重" value="critical" />
            <el-option label="警告" value="warning" />
            <el-option label="信息" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知渠道" prop="notify_channels">
          <el-checkbox-group v-model="ruleForm.notify_channels">
            <el-checkbox
              v-for="channel in enabledChannels"
              :key="channel.id"
              :label="channel.type"
            >
              <el-tag
                :style="getChannelTypeStyle(channel.type)"
                effect="dark"
                size="small"
                style="margin-right: 5px"
              >
                {{ getChannelTypeName(channel.type) }}
              </el-tag>
              {{ channel.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="接收人" prop="receivers">
          <el-input
            v-model="ruleForm.receiversStr"
            type="textarea"
            :rows="3"
            placeholder="请输入接收人，多个用逗号分隔（例如：admin@example.com,user@example.com）"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="ruleSubmitLoading" @click="handleRuleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 告警静默对话框 -->
    <el-dialog
      v-model="silenceDialogVisible"
      :title="silenceDialogTitle"
      width="600px"
      @close="resetSilenceForm"
    >
      <el-form
        ref="silenceFormRef"
        :model="silenceForm"
        :rules="silenceFormRules"
        label-width="120px"
      >
        <el-form-item label="静默名称" prop="name">
          <el-input v-model="silenceForm.name" placeholder="请输入静默名称" />
        </el-form-item>
        <el-form-item label="规则ID" prop="rule_ids">
          <el-select
            v-model="silenceForm.rule_ids"
            multiple
            placeholder="选择规则（留空表示所有规则）"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="rule in rules"
              :key="rule.id"
              :label="rule.name"
              :value="rule.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="主机ID" prop="host_ids">
          <el-select
            v-model="silenceForm.host_ids"
            multiple
            placeholder="选择主机（留空表示所有主机）"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="agent in agents"
              :key="agent.host_id"
              :label="`${agent.hostname || agent.host_id} (${agent.host_id})`"
              :value="agent.host_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker
            v-model="silenceForm.start_time"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker
            v-model="silenceForm.end_time"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="备注" prop="comment">
          <el-input v-model="silenceForm.comment" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="silenceForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="silenceDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="silenceSubmitLoading" @click="handleSilenceSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import {
  getNotificationChannels,
  createNotificationChannel,
  updateNotificationChannel,
  deleteNotificationChannel,
  testNotificationChannel,
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  getAlertHistory,
  deleteAlertHistory,
  deleteAlertHistories,
  getAlertSilences,
  createAlertSilence,
  updateAlertSilence,
  deleteAlertSilence,
  type NotificationChannel,
  type AlertRule,
  type AlertHistory,
  type AlertSilence
} from '@/api/alert'
import { axios } from '@/utils/request'
import type { Agent, ApiResponse } from '@/types'
import { useAlertStore } from '@/stores/alert'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const alertStore = useAlertStore()

// 从路由参数获取tab，如果没有则默认为channels
const activeTab = ref((route.query.tab as string) || 'channels')

// 通知渠道相关
const channelsLoading = ref(false)
const channels = ref<NotificationChannel[]>([])
const channelDialogVisible = ref(false)
const channelDialogTitle = computed(() => isEditChannel.value ? '编辑通知渠道' : '新增通知渠道')
const isEditChannel = ref(false)
const channelSubmitLoading = ref(false)
const channelTestLoading = ref(false)
const channelFormRef = ref<FormInstance>()
const channelForm = reactive<Partial<NotificationChannel> & { config: Record<string, string> }>({
  type: 'email',
  name: '',
  description: '',
  enabled: true,
  config: {}
})

const channelFormRules: FormRules = {
  type: [{ required: true, message: '请选择渠道类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }]
}

// 告警规则相关
const rulesLoading = ref(false)
const rules = ref<AlertRule[]>([])
const ruleDialogVisible = ref(false)
const ruleDialogTitle = computed(() => isEditRule.value ? '编辑告警规则' : '新增告警规则')
const isEditRule = ref(false)
const ruleSubmitLoading = ref(false)
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive<Partial<AlertRule> & { receiversStr: string }>({
  name: '',
  description: '',
  metric_type: 'cpu',
  host_id: '',
  condition: 'gte',
  threshold: 80,
  duration: 60,
  inhibit_duration: 300, // 默认5分钟
  severity: 'warning',
  notify_channels: [],
  receivers: [],
  enabled: true,
  receiversStr: ''
})

const ruleFormRules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  metric_type: [{ required: true, message: '请选择指标类型', trigger: 'change' }],
  condition: [
    {
      validator: (rule: any, value: any, callback: any) => {
        if (ruleForm.metric_type !== 'host_down' && !value) {
          callback(new Error('请选择条件'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  threshold: [
    {
      validator: (rule: any, value: any, callback: any) => {
        if (ruleForm.metric_type !== 'host_down' && value === undefined) {
          callback(new Error('请输入阈值'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  duration: [{ required: true, message: '请输入持续时间', trigger: 'blur' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }]
}

// 告警静默相关
const silencesLoading = ref(false)
const silences = ref<AlertSilence[]>([])
const silenceDialogVisible = ref(false)
const silenceDialogTitle = computed(() => isEditSilence.value ? '编辑告警静默' : '新增告警静默')
const isEditSilence = ref(false)
const silenceSubmitLoading = ref(false)
const silenceFormRef = ref<FormInstance>()
const silenceForm = reactive<Partial<AlertSilence>>({
  name: '',
  rule_ids: [],
  host_ids: [],
  start_time: '',
  end_time: '',
  enabled: true,
  comment: '',
  creator: ''
})

const silenceFormRules: FormRules = {
  name: [{ required: true, message: '请输入静默名称', trigger: 'blur' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

// 告警历史相关
const historyLoading = ref(false)
const history = ref<AlertHistory[]>([])
const selectedHistoryIds = ref<number[]>([])
const historyFilter = reactive({
  host_id: '',
  status: ''
})

// Agent列表
const agents = ref<Agent[]>([])

// 启用的通知渠道
const enabledChannels = computed(() => channels.value.filter(c => c.enabled))

// 加载数据
const loadChannels = async () => {
  try {
    channelsLoading.value = true
    const res = await getNotificationChannels()
    if (res.code === 200 && res.data) {
      channels.value = res.data
    }
  } catch (error: any) {
    ElMessage.error('加载通知渠道失败: ' + (error.response?.data?.message || error.message))
  } finally {
    channelsLoading.value = false
  }
}

const loadRules = async () => {
  try {
    rulesLoading.value = true
    const res = await getAlertRules()
    if (res.code === 200 && res.data) {
      rules.value = res.data
    }
  } catch (error: any) {
    ElMessage.error('加载告警规则失败: ' + (error.response?.data?.message || error.message))
  } finally {
    rulesLoading.value = false
  }
}

const loadSilences = async () => {
  try {
    silencesLoading.value = true
    const res = await getAlertSilences()
    if (res.code === 200 && res.data) {
      silences.value = res.data
    }
  } catch (error: any) {
    ElMessage.error('加载告警静默失败: ' + (error.response?.data?.message || error.message))
  } finally {
    silencesLoading.value = false
  }
}

const loadHistory = async () => {
  try {
    historyLoading.value = true
    const params: any = { limit: 100 }
    if (historyFilter.host_id) {
      params.host_id = historyFilter.host_id
    }
    if (historyFilter.status) {
      params.status = historyFilter.status
    }
    const res = await getAlertHistory(params)
    if (res.code === 200 && res.data) {
      history.value = res.data
    }
  } catch (error: any) {
    ElMessage.error('加载告警历史失败: ' + (error.response?.data?.message || error.message))
  } finally {
    historyLoading.value = false
  }
}

// 删除告警历史
const handleDeleteHistory = async (historyItem: AlertHistory) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除告警历史记录吗？\n规则: ${historyItem.rule_name}\n主机: ${historyItem.hostname || historyItem.host_id}\n时间: ${dayjs(historyItem.fired_at).format('YYYY-MM-DD HH:mm:ss')}`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )
    
    await deleteAlertHistory(historyItem.id)
    ElMessage.success('删除成功')
    loadHistory() // 重新加载列表
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message))
    }
  }
}

// 批量删除告警历史
const handleBatchDeleteHistory = async () => {
  if (selectedHistoryIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的告警历史记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedHistoryIds.value.length} 条告警历史记录吗？此操作不可恢复！`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )
    
    await deleteAlertHistories(selectedHistoryIds.value)
    ElMessage.success(`成功删除 ${selectedHistoryIds.value.length} 条告警历史记录`)
    selectedHistoryIds.value = [] // 清空选择
    loadHistory() // 重新加载列表
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败: ' + (error.response?.data?.message || error.message))
    }
  }
}

// 处理告警历史表格选择变化
const handleHistorySelectionChange = (selection: AlertHistory[]) => {
  selectedHistoryIds.value = selection.map(item => item.id)
}

const loadAgents = async () => {
  try {
    const res = await axios.get('/v1/agents', { params: { page: 1, page_size: 1000 } }) as unknown as ApiResponse<{ agents: Agent[] }>
    agents.value = res.data?.agents || []
  } catch (error) {
    console.error('Failed to load agents:', error)
  }
}

// Tab切换
const handleTabChange = (tab: string) => {
  // 更新 URL 参数，保持 URL 和 tab 状态一致（但不触发 watch，避免循环）
  const currentTab = route.query.tab as string
  if (currentTab !== tab) {
    router.replace({
      path: route.path,
      query: { ...route.query, tab }
    }).catch(() => {
      // 忽略错误，避免影响正常流程
    })
  }
  
  if (tab === 'channels') {
    loadChannels()
  } else if (tab === 'rules') {
    loadRules()
    loadChannels() // 加载渠道用于选择
  } else if (tab === 'silences') {
    loadSilences()
    loadRules() // 加载规则用于选择
    loadAgents()
  } else if (tab === 'history') {
    loadHistory()
    loadAgents()
    // 切换到告警历史页面时，清除未读提示
    alertStore.clearUnread()
  }
}

// 通知渠道操作
const handleCreateChannel = () => {
  isEditChannel.value = false
  resetChannelForm()
  channelDialogVisible.value = true
}

const handleEditChannel = (channel: NotificationChannel) => {
  isEditChannel.value = true
  Object.assign(channelForm, {
    id: channel.id,
    type: channel.type,
    name: channel.name,
    description: channel.description,
    enabled: channel.enabled,
    config: { ...channel.config }
  })
  channelDialogVisible.value = true
}

const handleDeleteChannel = async (channel: NotificationChannel) => {
  try {
    await ElMessageBox.confirm(`确定要删除通知渠道 "${channel.name}" 吗？`, '提示', {
      type: 'warning'
    })
    await deleteNotificationChannel(channel.id)
    ElMessage.success('删除成功')
    loadChannels()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message))
    }
  }
}

const handleToggleChannel = async (channel: NotificationChannel, newValue: boolean) => {
  const originalEnabled = channel.enabled
  // 先更新本地状态以提供即时反馈
  const index = channels.value.findIndex(c => c.id === channel.id)
  if (index !== -1) {
    channels.value[index].enabled = newValue
  }
  try {
    const res = await updateNotificationChannel(channel.id, { enabled: newValue })
    if (res.code === 200) {
      // 无论是否有返回数据，都重新加载列表以确保状态同步
      await loadChannels()
      ElMessage.success('更新成功')
    } else {
      // 如果返回码不是200，恢复原状态
      if (index !== -1) {
        channels.value[index].enabled = originalEnabled
      }
      ElMessage.error('更新失败')
    }
  } catch (error: any) {
    // 更新失败，恢复原状态
    if (index !== -1) {
      channels.value[index].enabled = originalEnabled
    }
    ElMessage.error('更新失败: ' + (error.response?.data?.message || error.message))
  }
}

const handleTestChannel = async () => {
  if (!channelFormRef.value) return
  
  // 验证必填字段
  await channelFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请先填写必填项')
      return
    }
    
    // 根据类型验证必填配置
    if (channelForm.type === 'email') {
      if (!channelForm.config.smtp_host) {
        ElMessage.warning('请填写SMTP主机')
        return
      }
    } else if (channelForm.type === 'dingtalk' || channelForm.type === 'wechat' || channelForm.type === 'feishu') {
      if (!channelForm.config.webhook_url) {
        ElMessage.warning('请填写Webhook URL')
        return
      }
    }
    
    try {
      channelTestLoading.value = true
      const data: any = {
        type: channelForm.type,
        name: channelForm.name || '测试渠道',
        description: channelForm.description || '',
        enabled: channelForm.enabled,
        config: channelForm.config
      }
      
      await testNotificationChannel(data)
      ElMessage.success('测试通知发送成功，请检查您的通知渠道是否收到消息')
    } catch (error: any) {
      ElMessage.error('测试失败: ' + (error.response?.data?.message || error.message))
    } finally {
      channelTestLoading.value = false
    }
  }, ['type', 'name'])
}

const handleChannelSubmit = async () => {
  if (!channelFormRef.value) return
  await channelFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        channelSubmitLoading.value = true
        const data: any = {
          type: channelForm.type,
          name: channelForm.name,
          description: channelForm.description,
          enabled: channelForm.enabled,
          config: channelForm.config
        }

        if (isEditChannel.value && channelForm.id) {
          await updateNotificationChannel(channelForm.id, data)
          ElMessage.success('更新成功')
        } else {
          await createNotificationChannel(data)
          ElMessage.success('创建成功')
        }
        channelDialogVisible.value = false
        loadChannels()
      } catch (error: any) {
        ElMessage.error('操作失败: ' + (error.response?.data?.message || error.message))
      } finally {
        channelSubmitLoading.value = false
      }
    }
  })
}

const resetChannelForm = () => {
  Object.assign(channelForm, {
    type: 'email',
    name: '',
    description: '',
    enabled: true,
    config: {}
  })
  channelFormRef.value?.resetFields()
}

// 告警规则操作
const handleCreateRule = () => {
  isEditRule.value = false
  resetRuleForm()
  ruleDialogVisible.value = true
}

const handleEditRule = (rule: AlertRule) => {
  isEditRule.value = true
  Object.assign(ruleForm, {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    metric_type: rule.metric_type,
    host_id: rule.host_id,
    condition: rule.condition,
    threshold: rule.threshold,
    duration: rule.duration,
    inhibit_duration: rule.inhibit_duration !== undefined && rule.inhibit_duration !== null ? rule.inhibit_duration : 300,
    severity: rule.severity,
    // 确保 notify_channels 和 receivers 是数组，即使它们是 undefined 或 null
    notify_channels: Array.isArray(rule.notify_channels) ? rule.notify_channels : [],
    receivers: Array.isArray(rule.receivers) ? rule.receivers : [],
    enabled: rule.enabled,
    receiversStr: Array.isArray(rule.receivers) ? rule.receivers.join(',') : ''
  })
  ruleDialogVisible.value = true
}

const handleDeleteRule = async (rule: AlertRule) => {
  try {
    await ElMessageBox.confirm(`确定要删除告警规则 "${rule.name}" 吗？`, '提示', {
      type: 'warning'
    })
    await deleteAlertRule(rule.id)
    ElMessage.success('删除成功')
    loadRules()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message))
    }
  }
}

const handleToggleRule = async (rule: AlertRule, newValue: boolean) => {
  const originalEnabled = rule.enabled
  // 先更新本地状态以提供即时反馈
  const index = rules.value.findIndex(r => r.id === rule.id)
  if (index !== -1) {
    rules.value[index].enabled = newValue
  }
  try {
    const res = await updateAlertRule(rule.id, { enabled: newValue })
    if (res.code === 200) {
      // 无论是否有返回数据，都重新加载列表以确保状态同步
      await loadRules()
      ElMessage.success('更新成功')
    } else {
      // 如果返回码不是200，恢复原状态
      if (index !== -1) {
        rules.value[index].enabled = originalEnabled
      }
      ElMessage.error('更新失败')
    }
  } catch (error: any) {
    // 更新失败，恢复原状态
    if (index !== -1) {
      rules.value[index].enabled = originalEnabled
    }
    ElMessage.error('更新失败: ' + (error.response?.data?.message || error.message))
  }
}

const handleRuleSubmit = async () => {
  if (!ruleFormRef.value) return
  await ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        ruleSubmitLoading.value = true
        const receivers = ruleForm.receiversStr
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0)

        const data: any = {
          name: ruleForm.name,
          description: ruleForm.description,
          metric_type: ruleForm.metric_type,
          host_id: ruleForm.host_id || '',
          condition: ruleForm.condition,
          threshold: ruleForm.threshold,
          duration: ruleForm.duration,
          inhibit_duration: ruleForm.inhibit_duration !== undefined && ruleForm.inhibit_duration !== null ? ruleForm.inhibit_duration : 300, // 确保 0 值也能正确传递
          severity: ruleForm.severity,
          notify_channels: ruleForm.notify_channels,
          receivers: receivers,
          enabled: ruleForm.enabled
        }

        if (isEditRule.value && ruleForm.id) {
          await updateAlertRule(ruleForm.id, data)
          ElMessage.success('更新成功')
        } else {
          await createAlertRule(data)
          ElMessage.success('创建成功')
        }
        ruleDialogVisible.value = false
        loadRules()
      } catch (error: any) {
        ElMessage.error('操作失败: ' + (error.response?.data?.message || error.message))
      } finally {
        ruleSubmitLoading.value = false
      }
    }
  })
}

const resetRuleForm = () => {
  Object.assign(ruleForm, {
    name: '',
    description: '',
    metric_type: 'cpu',
    host_id: '',
    condition: 'gte',
    threshold: 80,
    duration: 60,
    inhibit_duration: 300,
    severity: 'warning',
    notify_channels: [],
    receivers: [],
    enabled: true,
    receiversStr: ''
  })
  ruleFormRef.value?.resetFields()
}

// 告警静默操作
const handleCreateSilence = () => {
  isEditSilence.value = false
  resetSilenceForm()
  silenceDialogVisible.value = true
}

const handleEditSilence = (silence: AlertSilence) => {
  isEditSilence.value = true
  Object.assign(silenceForm, {
    id: silence.id,
    name: silence.name,
    rule_ids: silence.rule_ids,
    host_ids: silence.host_ids,
    start_time: silence.start_time,
    end_time: silence.end_time,
    enabled: silence.enabled,
    comment: silence.comment,
    creator: silence.creator
  })
  silenceDialogVisible.value = true
}

const handleDeleteSilence = async (silence: AlertSilence) => {
  try {
    await ElMessageBox.confirm(`确定要删除告警静默 "${silence.name}" 吗？`, '提示', {
      type: 'warning'
    })
    await deleteAlertSilence(silence.id)
    ElMessage.success('删除成功')
    loadSilences()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message))
    }
  }
}

const handleToggleSilence = async (silence: AlertSilence, newValue: boolean) => {
  const originalEnabled = silence.enabled
  // 先更新本地状态以提供即时反馈
  const index = silences.value.findIndex(s => s.id === silence.id)
  if (index !== -1) {
    silences.value[index].enabled = newValue
  }
  try {
    const res = await updateAlertSilence(silence.id, { enabled: newValue })
    if (res.code === 200) {
      // 无论是否有返回数据，都重新加载列表以确保状态同步
      await loadSilences()
      ElMessage.success('更新成功')
    } else {
      // 如果返回码不是200，恢复原状态
      if (index !== -1) {
        silences.value[index].enabled = originalEnabled
      }
      ElMessage.error('更新失败')
    }
  } catch (error: any) {
    // 更新失败，恢复原状态
    if (index !== -1) {
      silences.value[index].enabled = originalEnabled
    }
    ElMessage.error('更新失败: ' + (error.response?.data?.message || error.message))
  }
}

const handleSilenceSubmit = async () => {
  if (!silenceFormRef.value) return
  await silenceFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        silenceSubmitLoading.value = true
        // 确保时间格式正确（ISO 8601 UTC 格式）
        // el-date-picker 返回的时间是本地时间字符串（格式：YYYY-MM-DDTHH:mm:ss，没有时区信息）
        // 需要将其转换为 UTC 时间字符串（格式：YYYY-MM-DDTHH:mm:ssZ）
        // 注意：new Date('2024-01-08T14:30:00') 会将字符串当作本地时间解析
        // 然后 toISOString() 会将其转换为 UTC 时间
        let startTime = silenceForm.start_time
        let endTime = silenceForm.end_time
        
        if (startTime) {
          // 如果时间字符串没有时区信息（没有 Z 或 +/-），将其当作本地时间解析，然后转换为 UTC
          if (!startTime.endsWith('Z') && !startTime.includes('+') && !startTime.match(/-\d{2}:\d{2}$/)) {
            // 解析为本地时间，然后转换为 UTC ISO 字符串
            // 例如：用户选择 2024-01-08 14:30:00（本地时间，假设是 UTC+8）
            // new Date('2024-01-08T14:30:00') 会解析为本地时间 14:30:00
            // toISOString() 会转换为 UTC 时间 06:30:00Z（减去8小时）
            const localDate = new Date(startTime)
            if (!isNaN(localDate.getTime())) {
              startTime = localDate.toISOString()
            }
          }
        }
        
        if (endTime) {
          // 如果时间字符串没有时区信息，将其当作本地时间解析，然后转换为 UTC
          if (!endTime.endsWith('Z') && !endTime.includes('+') && !endTime.match(/-\d{2}:\d{2}$/)) {
            const localDate = new Date(endTime)
            if (!isNaN(localDate.getTime())) {
              endTime = localDate.toISOString()
            }
          }
        }
        
        const data: any = {
          name: silenceForm.name,
          rule_ids: silenceForm.rule_ids || [],
          host_ids: silenceForm.host_ids || [],
          start_time: startTime,
          end_time: endTime,
          enabled: silenceForm.enabled,
          comment: silenceForm.comment || '',
          creator: 'admin' // TODO: 从用户store获取
        }

        if (isEditSilence.value && silenceForm.id) {
          await updateAlertSilence(silenceForm.id, data)
          ElMessage.success('更新成功')
        } else {
          await createAlertSilence(data)
          ElMessage.success('创建成功')
        }
        silenceDialogVisible.value = false
        loadSilences()
      } catch (error: any) {
        ElMessage.error('操作失败: ' + (error.response?.data?.message || error.message))
      } finally {
        silenceSubmitLoading.value = false
      }
    }
  })
}

const resetSilenceForm = () => {
  Object.assign(silenceForm, {
    name: '',
    rule_ids: [],
    host_ids: [],
    start_time: '',
    end_time: '',
    enabled: true,
    comment: '',
    creator: ''
  })
  silenceFormRef.value?.resetFields()
}

// 辅助函数
const getChannelTypeName = (type: string) => {
  const map: Record<string, string> = {
    email: '邮件',
    dingtalk: '钉钉',
    wechat: '企业微信',
    feishu: '飞书'
  }
  return map[type] || type
}

const getChannelTypeTag = (type: string) => {
  const map: Record<string, string> = {
    email: 'primary',
    dingtalk: 'success',
    wechat: 'warning',
    feishu: 'info'
  }
  return map[type] || 'info'
}

const getChannelTypeStyle = (type: string) => {
  const styleMap: Record<string, Record<string, string>> = {
    email: {
      backgroundColor: '#409EFF',
      borderColor: '#409EFF',
      color: '#fff'
    },
    dingtalk: {
      backgroundColor: '#67C23A',
      borderColor: '#67C23A',
      color: '#fff'
    },
    wechat: {
      backgroundColor: '#E6A23C',
      borderColor: '#E6A23C',
      color: '#fff'
    },
    feishu: {
      backgroundColor: '#909399',
      borderColor: '#909399',
      color: '#fff'
    }
  }
  return styleMap[type] || {
    backgroundColor: '#909399',
    borderColor: '#909399',
    color: '#fff'
  }
}

const getMetricTypeName = (type: string) => {
  const map: Record<string, string> = {
    cpu: 'CPU使用率',
    memory: '内存使用率',
    disk: '磁盘使用率',
    network: '网络',
    host_down: '主机宕机'
  }
  return map[type] || type
}

const getConditionName = (condition: string) => {
  const map: Record<string, string> = {
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    eq: '=',
    neq: '!='
  }
  return map[condition] || condition
}

const getStatusName = (status: string) => {
  // 正确映射状态值
  if (!status) {
    return '未知'
  }
  // 只接受有效的状态值
  if (status === 'firing') {
    return '告警中'
  } else if (status === 'resolved') {
    return '已恢复'
  } else {
    // 如果status字段的值不是预期的值（可能是之前的bug导致的），尝试修复显示
    // 如果status是'pending'、'success'、'failed'等，这些应该是notify_status的值，不是status的值
    // 在这种情况下，我们无法确定实际状态，显示未知
    return '未知'
  }
}

const getStatusTag = (status: string) => {
  if (!status) {
    return 'info'
  }
  if (status === 'firing') {
    return 'danger'
  } else if (status === 'resolved') {
    return 'success'
  } else {
    // 未知状态显示为灰色
    return 'info'
  }
}

const getSeverityName = (severity: string) => {
  const map: Record<string, string> = {
    critical: '严重',
    warning: '警告',
    info: '信息'
  }
  return map[severity] || severity
}

const getSeverityTag = (severity: string) => {
  const map: Record<string, string> = {
    critical: 'danger',
    warning: 'warning',
    info: 'info'
  }
  return map[severity] || 'info'
}

// 监听路由变化，处理 tab 参数
watch(() => route.query.tab, (newTab, oldTab) => {
  // 忽略时间戳参数
  const tab = typeof newTab === 'string' ? newTab.split('&')[0] : newTab
  const oldTabValue = typeof oldTab === 'string' ? oldTab.split('&')[0] : oldTab
  
  if (tab && typeof tab === 'string' && tab !== oldTabValue) {
    if (tab === 'history' && activeTab.value !== 'history') {
      activeTab.value = 'history'
      handleTabChange('history')
    } else if (tab === 'rules' && activeTab.value !== 'rules') {
      activeTab.value = 'rules'
      handleTabChange('rules')
    } else if (tab === 'channels' && activeTab.value !== 'channels') {
      activeTab.value = 'channels'
      handleTabChange('channels')
    } else if (tab === 'silences' && activeTab.value !== 'silences') {
      activeTab.value = 'silences'
      handleTabChange('silences')
    }
  }
}, { immediate: true })

// 同时监听整个 route.fullPath，确保能捕获到所有变化（包括相同路径但不同query的情况）
watch(() => route.fullPath, (newPath, oldPath) => {
  if (newPath !== oldPath) {
    const tabMatch = newPath.match(/[?&]tab=([^&]+)/)
    if (tabMatch && tabMatch[1]) {
      const tab = tabMatch[1]
      if (tab === 'history' && activeTab.value !== 'history') {
        activeTab.value = 'history'
        handleTabChange('history')
      } else if (tab === 'rules' && activeTab.value !== 'rules') {
        activeTab.value = 'rules'
        handleTabChange('rules')
      } else if (tab === 'channels' && activeTab.value !== 'channels') {
        activeTab.value = 'channels'
        handleTabChange('channels')
      } else if (tab === 'silences' && activeTab.value !== 'silences') {
        activeTab.value = 'silences'
        handleTabChange('silences')
      }
    }
  }
})

onMounted(() => {
  loadChannels()
  loadAgents()
  
  // 如果URL参数指定了tab，切换到对应tab
  if (route.query.tab === 'history') {
    activeTab.value = 'history'
    handleTabChange('history')
  }
})
</script>

<style scoped>
.alerts-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
}

.tab-header {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>

