<!-- ============================================ -->
<!-- 文件: src/views/Agents.vue -->
<!-- ============================================ -->
<template>
  <div class="agents-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>主机管理</span>
          <div class="header-actions">
            <el-input
              v-model="searchText"
              placeholder="搜索主机ID或主机名"
              style="width: 200px; margin-right: 10px"
              clearable
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="statusFilter" placeholder="状态" style="width: 120px; margin-right: 10px" @change="fetchAgents">
              <el-option label="全部" value="" />
              <el-option label="在线" value="online" />
              <el-option label="离线" value="offline" />
            </el-select>
            <el-button type="primary" :icon="Refresh" @click="fetchAgents">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredAgents" v-loading="loading" style="width: 100%">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <!-- 磁盘使用情况 -->
              <div v-if="row.diskPartitions && row.diskPartitions.length > 0" class="disk-section">
                <h4 style="margin-bottom: 16px; color: #303133; font-size: 16px; font-weight: 600">
                  <el-icon style="margin-right: 6px"><DiskIcon /></el-icon>
                  磁盘使用情况
                </h4>
                <el-table :data="row.diskPartitions" size="small" border style="margin-bottom: 20px">
                  <el-table-column prop="mountpoint" label="挂载点" width="150">
                    <template #default="{ row: part }">
                      <el-icon style="margin-right: 4px"><Folder /></el-icon>
                      <strong>{{ part.mountpoint || '未知' }}</strong>
                    </template>
                  </el-table-column>
                  <el-table-column prop="device" label="设备" width="120" />
                  <el-table-column label="使用率" width="200">
                    <template #default="{ row: part }">
                      <div style="display: flex; align-items: center; gap: 8px">
                        <el-progress 
                          :percentage="Math.min(part.used_percent || 0, 100)"
                          :color="getDiskColor(part.used_percent)"
                          :stroke-width="8"
                          style="flex: 1"
                        />
                        <span style="min-width: 45px; text-align: right; font-weight: 600">
                          {{ (part.used_percent || 0).toFixed(1) }}%
                        </span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="已用/总计" width="200">
                    <template #default="{ row: part }">
                      <span style="color: #E6A23C; font-weight: 500">{{ formatBytes(part.used) }}</span>
                      <span style="color: #909399; margin: 0 4px">/</span>
                      <span style="color: #606266">{{ formatBytes(part.total) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="可用" width="120">
                    <template #default="{ row: part }">
                      <span style="color: #67C23A">{{ formatBytes(part.free) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="fstype" label="文件系统" width="100" />
                </el-table>
              </div>
              
              <!-- 其他信息 -->
              <el-descriptions :column="2" border>
                <el-descriptions-item label="主机ID">{{ row.host_id }}</el-descriptions-item>
                <el-descriptions-item label="架构">{{ row.arch }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">
                  {{ dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss') }}
                </el-descriptions-item>
                <el-descriptions-item label="最后上报">
                  {{ dayjs(row.last_seen).format('YYYY-MM-DD HH:mm:ss') }}
                </el-descriptions-item>
                <el-descriptions-item label="标签" :span="2">
                  <el-tag v-for="(value, key) in row.tags" :key="key" style="margin-right: 8px">
                    {{ key }}: {{ value }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="hostname" label="主机名" width="200" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'danger'">
              <el-icon><component :is="row.status === 'online' ? CircleCheck : CircleClose" /></el-icon>
              {{ row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="os" label="操作系统" width="120">
          <template #default="{ row }">
            <el-icon v-if="row.os === 'linux'" color="#409EFF"><Monitor /></el-icon>
            <el-icon v-else-if="row.os === 'darwin'" color="#606266"><Monitor /></el-icon>
            <el-icon v-else color="#909399"><Monitor /></el-icon>
            {{ row.os }}
          </template>
        </el-table-column>
        <el-table-column label="最后上报" width="180">
          <template #default="{ row }">
            {{ dayjs(row.last_seen).fromNow() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row.host_id)">
              详情
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Monitor, CircleCheck, CircleClose, Folder } from '@element-plus/icons-vue'
import DiskIcon from '@/icons/DiskIcon.vue'
import { getAgents, deleteAgent } from '@/api/agent'
import { getLatestMetrics } from '@/api/metrics'
import type { Agent, ApiResponse, PaginatedResponse, LatestMetrics } from '@/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()
const loading = ref(false)
const agents = ref<Agent[]>([])
const searchText = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filteredAgents = computed(() => {
  if (!searchText.value) {
    return agents.value
  }
  return agents.value.filter((agent: any) => {
    return agent.host_id.toLowerCase().includes(searchText.value.toLowerCase()) ||
           agent.hostname.toLowerCase().includes(searchText.value.toLowerCase())
  })
})

const fetchAgents = async () => {
  try {
    loading.value = true
    const res = await getAgents({
      status: statusFilter.value,
      page: currentPage.value,
      page_size: pageSize.value
    }) as unknown as ApiResponse<PaginatedResponse<Agent>>
    agents.value = res.data.agents || []
    total.value = res.data.total || 0
    
    // 为在线主机获取磁盘信息
    await fetchAllDiskInfo()
  } catch (error) {
    ElMessage.error('获取主机列表失败')
  } finally {
    loading.value = false
  }
}

// 批量获取所有在线主机的磁盘信息
const fetchAllDiskInfo = async () => {
  const onlineAgents = agents.value.filter(a => a.status === 'online')
  const promises = onlineAgents.map(async (agent: any) => {
    try {
      const res = await getLatestMetrics(agent.host_id) as unknown as ApiResponse<LatestMetrics>
      if (res.data?.disk?.partitions && Array.isArray(res.data.disk.partitions)) {
        agent.diskPartitions = res.data.disk.partitions
      } else if (res.data?.disk) {
        // 兼容旧格式：单个分区对象
        agent.diskPartitions = [res.data.disk]
      }
    } catch (error) {
      console.error(`Failed to fetch disk info for ${agent.host_id}:`, error)
    }
  })
  await Promise.all(promises)
}

// 格式化字节数
const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 获取磁盘使用率颜色
const getDiskColor = (percent: number) => {
  if (!percent) return '#67c23a'
  if (percent >= 90) return '#f56c6c'  // 红色：危险
  if (percent >= 75) return '#e6a23c'  // 橙色：警告
  if (percent >= 50) return '#409EFF'  // 蓝色：注意
  return '#67c23a'  // 绿色：正常
}

const handleSearch = () => {
  currentPage.value = 1
  fetchAgents()
}

const handleSizeChange = () => {
  currentPage.value = 1
  fetchAgents()
}

const handleCurrentChange = () => {
  fetchAgents()
}

const viewDetail = (hostId: string) => {
  router.push(`/agents/${hostId}`)
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除主机 ${row.hostname} (${row.host_id}) 吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteAgent(row.host_id)
    ElMessage.success('删除成功')
    fetchAgents()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchAgents()
})
</script>

<style scoped>
.agents-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.expand-content {
  padding: 20px;
}

.disk-section {
  margin-bottom: 20px;
}

.disk-section h4 {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .agents-container {
    padding: 10px;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 10px;
  }
}
</style>

