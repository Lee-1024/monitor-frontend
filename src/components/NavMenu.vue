<template>
  <div class="nav-container">
    <el-menu
      :default-active="activeMenu"
      mode="horizontal"
      router
      class="nav-menu"
    >
      <el-menu-item index="/dashboard">
        <el-icon><Monitor /></el-icon>
        <span>监控面板</span>
      </el-menu-item>
      <el-menu-item index="/agents">
        <el-icon><Grid /></el-icon>
        <span>主机管理</span>
      </el-menu-item>
      <el-menu-item index="/crash-analysis">
        <el-icon><Warning /></el-icon>
        <span>宕机分析</span>
      </el-menu-item>
      <el-menu-item index="/processes">
        <el-icon><Monitor /></el-icon>
        <span>进程监控</span>
      </el-menu-item>
      <el-menu-item index="/logs">
        <el-icon><Document /></el-icon>
        <span>日志查看</span>
      </el-menu-item>
      <el-menu-item index="/scripts">
        <el-icon><Tools /></el-icon>
        <span>脚本执行</span>
      </el-menu-item>
      <el-menu-item index="/services">
        <el-icon><Connection /></el-icon>
        <span>服务状态</span>
      </el-menu-item>
      <el-menu-item v-if="userStore.isAdmin" index="/users">
        <el-icon><User /></el-icon>
        <span>用户管理</span>
      </el-menu-item>
    </el-menu>
    
    <div class="nav-user">
      <el-dropdown @command="handleCommand">
        <span class="user-info">
          <el-icon><User /></el-icon>
          <span>{{ userStore.userInfo?.username || '未登录' }}</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>
              <span style="color: #999;">{{ userStore.userInfo?.email }}</span>
            </el-dropdown-item>
            <el-dropdown-item disabled>
              <span style="color: #999;">角色: {{ userStore.userInfo?.role === 'admin' ? '管理员' : '用户' }}</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Monitor, Grid, Warning, User, ArrowDown, SwitchButton, Document, Tools, Connection } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout()
  }
}

onMounted(() => {
  // 初始化用户信息
  if (localStorage.getItem('token') && !userStore.userInfo) {
    userStore.initAuth()
  }
})
</script>

<style scoped>
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.nav-menu {
  flex: 1;
  border-bottom: none;
}

.nav-user {
  padding: 0 20px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
}

.user-info:hover {
  color: #409eff;
}

.user-info .el-icon {
  margin-right: 5px;
}

.user-info .el-icon--right {
  margin-left: 5px;
  margin-right: 0;
}
</style>

