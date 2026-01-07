<template>
  <div class="users-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名或邮箱"
          clearable
          style="width: 300px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="filterRole"
          placeholder="筛选角色"
          clearable
          style="width: 150px; margin-left: 10px"
          @change="handleFilter"
        >
          <el-option label="全部" value="" />
          <el-option label="管理员" value="admin" />
          <el-option label="用户" value="user" />
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="筛选状态"
          clearable
          style="width: 150px; margin-left: 10px"
          @change="handleFilter"
        >
          <el-option label="全部" value="" />
          <el-option label="激活" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
        <el-button
          type="default"
          style="margin-left: 10px"
          @click="handleRefresh"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredUsers"
        stripe
        style="width: 100%"
        empty-text="暂无数据"
      >
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="username" label="用户名" sortable>
          <template #default="{ row }">
            <span style="font-weight: 500">{{ row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : ''">
              {{ row.role === 'admin' ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '激活' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleEdit(row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              type="warning"
              size="small"
              link
              @click="handleResetPassword(row)"
            >
              <el-icon><Key /></el-icon>
              重置密码
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              :disabled="row.id === currentUserId"
              @click="handleDelete(row)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchUsers"
          @current-change="fetchUsers"
        />
      </div>
    </el-card>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            :disabled="isEdit"
            placeholder="请输入用户名"
          />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（至少6个字符）"
            show-password
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱"
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色">
            <el-option label="用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="激活" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="重置密码"
      width="400px"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="new_password">
          <el-input
            v-model="passwordForm.new_password"
            type="password"
            placeholder="请输入新密码（至少6个字符）"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handlePasswordSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh, Edit, Key, Delete } from '@element-plus/icons-vue'
import { getUserList, createUser, updateUser, deleteUser, resetUserPassword } from '@/api/user'
import { useUserStore } from '@/stores/user'
import type { UserInfo } from '@/api/auth'

const userStore = useUserStore()

const loading = ref(false)
const users = ref<UserInfo[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索和筛选
const searchKeyword = ref('')
const filterRole = ref('')
const filterStatus = ref('')

// 过滤后的用户列表
const filteredUsers = computed(() => {
  let result = users.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      (user) =>
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
    )
  }

  // 角色过滤
  if (filterRole.value) {
    result = result.filter((user) => user.role === filterRole.value)
  }

  // 状态过滤
  if (filterStatus.value) {
    result = result.filter((user) => user.status === filterStatus.value)
  }

  return result
})

const dialogVisible = ref(false)
const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户')
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  username: '',
  email: '',
  password: '',
  role: 'user' as 'admin' | 'user',
  status: 'active' as 'active' | 'inactive'
})

const passwordDialogVisible = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  new_password: ''
})
const currentEditUserId = ref<number | null>(null)

const currentUserId = computed(() => userStore.userInfo?.id)

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 64, message: '用户名长度在3到64个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

const passwordRules: FormRules = {
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
  ]
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUserList({ page: page.value, page_size: pageSize.value })
    if (res.code === 200 && res.data) {
      users.value = res.data.users || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: UserInfo) => {
  isEdit.value = true
  currentEditUserId.value = row.id
  form.username = row.username
  form.email = row.email
  form.role = row.role
  form.status = row.status
  form.password = ''
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value && currentEditUserId.value) {
          // 编辑用户
          const res = await updateUser(currentEditUserId.value, {
            email: form.email,
            role: form.role,
            status: form.status
          })
          if (res.code === 200) {
            ElMessage.success('更新成功')
            dialogVisible.value = false
            fetchUsers()
          }
        } else {
          // 创建用户
          const res = await createUser({
            username: form.username,
            email: form.email,
            password: form.password,
            role: form.role
          })
          if (res.code === 200) {
            ElMessage.success('创建成功')
            dialogVisible.value = false
            fetchUsers()
          }
        }
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleResetPassword = (row: UserInfo) => {
  currentEditUserId.value = row.id
  passwordForm.new_password = ''
  passwordDialogVisible.value = true
}

const handlePasswordSubmit = async () => {
  if (!passwordFormRef.value || !currentEditUserId.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      passwordLoading.value = true
      try {
        const res = await resetUserPassword(currentEditUserId.value, {
          new_password: passwordForm.new_password
        })
        if (res.code === 200) {
          ElMessage.success('密码重置成功')
          passwordDialogVisible.value = false
        }
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || '重置密码失败')
      } finally {
        passwordLoading.value = false
      }
    }
  })
}

const handleDelete = async (row: UserInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await deleteUser(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchUsers()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

const resetForm = () => {
  form.username = ''
  form.email = ''
  form.password = ''
  form.role = 'user'
  form.status = 'active'
  currentEditUserId.value = null
  formRef.value?.clearValidate()
}

const handleSearch = () => {
  // 搜索是实时过滤，不需要重新请求
}

const handleFilter = () => {
  // 筛选是实时过滤，不需要重新请求
}

const handleRefresh = () => {
  searchKeyword.value = ''
  filterRole.value = ''
  filterStatus.value = ''
  fetchUsers()
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-button.is-link) {
  padding: 0 8px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  font-weight: 500;
}
</style>

