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
      <el-menu-item index="/bigscreen">
        <el-icon><Monitor /></el-icon>
        <span>监控大屏</span>
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
      <el-menu-item v-if="userStore.isAdmin" index="/alerts">
        <el-icon><Bell /></el-icon>
        <span>告警管理</span>
      </el-menu-item>
    </el-menu>
    
    <div class="nav-user">
      <!-- 站内信提示 -->
      <el-badge 
        v-if="userStore.isAdmin && alertStore.hasUnread" 
        :value="alertStore.unreadCount" 
        :max="99"
        class="notification-badge"
      >
        <el-button 
          type="text" 
          class="notification-btn"
          @click="handleNotificationClick"
        >
          <el-icon :size="20"><Bell /></el-icon>
        </el-button>
      </el-badge>
      <el-button 
        v-else-if="userStore.isAdmin"
        type="text" 
        class="notification-btn"
        @click="handleNotificationClick"
      >
        <el-icon :size="20"><Bell /></el-icon>
      </el-button>
      
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
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Monitor, Grid, Warning, User, ArrowDown, SwitchButton, Document, Tools, Connection, Bell } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAlertStore } from '@/stores/alert'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const alertStore = useAlertStore()

const activeMenu = computed(() => route.path)

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout()
    alertStore.stopPolling()
  }
}

// 处理站内信点击
const handleNotificationClick = () => {
  // 清除未读提示
  alertStore.clearUnread()
  // 跳转到告警历史页面
  // 如果当前已经在 /alerts 页面，使用 nextTick 确保路由更新
  if (route.path === '/alerts') {
    // 使用 replace 更新 query 参数，保留其他参数
    const newQuery: Record<string, any> = { ...route.query }
    newQuery.tab = 'history'
    router.replace({
      path: '/alerts',
      query: newQuery
    }).catch(() => {
      // 如果 replace 失败，尝试 push
      router.push('/alerts?tab=history')
    })
  } else {
    router.push('/alerts?tab=history')
  }
}

onMounted(() => {
  // 初始化用户信息
  if (localStorage.getItem('token') && !userStore.userInfo) {
    userStore.initAuth()
  }
  
  // 如果是管理员，开始轮询未读告警数量
  if (userStore.isAdmin) {
    alertStore.startPolling()
  }
})

onUnmounted(() => {
  // 组件卸载时停止轮询
  alertStore.stopPolling()
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
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 0 20px;
}

.notification-badge {
  cursor: pointer;
}

.notification-btn {
  padding: 8px;
  color: #606266;
}

.notification-btn:hover {
  color: #409eff;
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

