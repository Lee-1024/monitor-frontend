<template>
  <div class="knowledge-list">
    <!-- 搜索和筛选 -->
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索标题或内容"
        clearable
        style="width: 300px"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <template v-for="filter in filters" :key="filter.key">
        <el-select
          v-model="filterValues[filter.key]"
          :placeholder="filter.label"
          clearable
          style="width: 150px; margin-left: 10px"
          @change="handleFilter"
        >
          <el-option
            v-for="option in filter.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </template>

      <el-button type="primary" style="margin-left: 10px" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增
      </el-button>
      <el-button style="margin-left: 10px" @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <!-- 列表 -->
    <el-table
      v-loading="loading"
      :data="items"
      stripe
      style="width: 100%; margin-top: 20px"
      empty-text="暂无数据"
    >
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :sortable="col.sortable"
      >
        <template #default="{ row }">
          <template v-if="col.prop === 'severity'">
            <el-tag :type="getSeverityType(row.severity)">
              {{ getSeverityName(row.severity) }}
            </el-tag>
          </template>
          <template v-else-if="col.prop === 'created_at' || col.prop === 'incident_date'">
            {{ formatDate(row[col.prop]) }}
          </template>
          <template v-else>
            {{ row[col.prop] }}
          </template>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="handleView(row)">
            <el-icon><View /></el-icon>
            查看
          </el-button>
          <el-button type="warning" size="small" link @click="handleEdit(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" size="small" link @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
            删除
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { Search, Plus, Refresh, View, Edit, Delete } from '@element-plus/icons-vue'

interface Column {
  prop: string
  label: string
  width?: number
  sortable?: boolean
}

interface Filter {
  key: string
  label: string
  options: Array<{ label: string; value: string }>
}

interface APIFunctions {
  list: (params?: any) => Promise<any>
  get: (id: number) => Promise<any>
  create: (data: any) => Promise<any>
  update: (id: number, data: any) => Promise<any>
  delete: (id: number) => Promise<any>
}

const props = defineProps<{
  category: string
  columns: Column[]
  filters: Filter[]
  apiFunctions: APIFunctions
}>()

const emit = defineEmits<{
  create: []
  edit: [item: any]
  delete: [item: any]
  view: [item: any]
}>()

const loading = ref(false)
const keyword = ref('')
const filterValues = reactive<Record<string, string>>({})
const items = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      page_size: pageSize.value
    }

    if (keyword.value) {
      params.keyword = keyword.value
    }

    // 添加筛选条件
    for (const [key, value] of Object.entries(filterValues)) {
      if (value) {
        params[key] = value
      }
    }

    const res = await props.apiFunctions.list(params)
    const data = res.data || res
    items.value = data.items || []
    total.value = data.total || 0
  } catch (error: any) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 筛选
const handleFilter = () => {
  currentPage.value = 1
  loadData()
}

// 分页
const handleSizeChange = () => {
  currentPage.value = 1
  loadData()
}

const handlePageChange = () => {
  loadData()
}

// 操作
const handleCreate = () => {
  emit('create')
}

const handleEdit = (item: any) => {
  emit('edit', item)
}

const handleDelete = (item: any) => {
  emit('delete', item)
}

const handleView = (item: any) => {
  emit('view', item)
}

// 辅助函数
const getSeverityType = (severity: string) => {
  const map: Record<string, string> = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'success'
  }
  return map[severity] || 'info'
}

const getSeverityName = (severity: string) => {
  const map: Record<string, string> = {
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[severity] || severity
}

const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 初始化筛选值
props.filters.forEach(filter => {
  filterValues[filter.key] = ''
})

onMounted(() => {
  loadData()
})

// 监听category变化，重新加载数据
watch(() => props.category, () => {
  currentPage.value = 1
  keyword.value = ''
  props.filters.forEach(filter => {
    filterValues[filter.key] = ''
  })
  loadData()
}, { immediate: false })

// 暴露刷新方法给父组件
defineExpose({
  loadData
})
</script>

<style scoped lang="scss">
.knowledge-list {
  .search-bar {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
