<template>
  <div class="top-nav">
    <div class="top-nav-content">
      <!-- 左侧：系统名称 -->
      <div class="logo">
        <el-icon :size="24"><Monitor /></el-icon>
        <span class="logo-text">监控系统</span>
      </div>

      <!-- 右侧：站内信和用户信息 -->
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
        
        <el-dropdown @command="handleCommand" placement="bottom-end">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Monitor, User, ArrowDown, SwitchButton, Bell } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAlertStore } from '@/stores/alert'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const alertStore = useAlertStore()

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
  if (route.path === '/alerts') {
    const newQuery: Record<string, any> = { ...route.query }
    newQuery.tab = 'history'
    router.replace({
      path: '/alerts',
      query: newQuery
    }).catch(() => {
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
.top-nav {
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.top-nav-content {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.logo .el-icon {
  color: #fff;
}

.logo-text {
  color: #fff;
  letter-spacing: 1px;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  cursor: pointer;
}

.notification-btn {
  padding: 8px;
  color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  transition: all 0.3s;
}

.notification-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.3s;
}

.user-info:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
}

.user-info .el-icon {
  margin-right: 6px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
}

.user-info:hover .el-icon {
  color: #fff;
}

.user-info .el-icon--right {
  margin-left: 6px;
  margin-right: 0;
  font-size: 12px;
}
</style>
