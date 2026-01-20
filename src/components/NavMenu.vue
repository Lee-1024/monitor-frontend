<template>
  <div class="nav-container">
    <!-- 左侧菜单 -->
    <el-menu
      :default-active="activeMenu"
      mode="vertical"
      router
      class="nav-menu"
      :collapse="false"
    >
      <el-menu-item index="/dashboard">
        <el-icon><Monitor /></el-icon>
        <template #title>监控面板</template>
      </el-menu-item>
      <el-menu-item index="/bigscreen">
        <el-icon><Monitor /></el-icon>
        <template #title>监控大屏</template>
      </el-menu-item>
      <el-menu-item index="/agents">
        <el-icon><Grid /></el-icon>
        <template #title>主机管理</template>
      </el-menu-item>
      <el-menu-item index="/crash-analysis">
        <el-icon><Warning /></el-icon>
        <template #title>宕机分析</template>
      </el-menu-item>
      <el-menu-item index="/processes">
        <el-icon><Monitor /></el-icon>
        <template #title>进程监控</template>
      </el-menu-item>
      <el-menu-item index="/logs">
        <el-icon><Document /></el-icon>
        <template #title>日志查看</template>
      </el-menu-item>
      <el-menu-item index="/scripts">
        <el-icon><Tools /></el-icon>
        <template #title>脚本执行</template>
      </el-menu-item>
      <el-menu-item index="/services">
        <el-icon><Connection /></el-icon>
        <template #title>服务状态</template>
      </el-menu-item>
      <el-menu-item v-if="userStore.isAdmin" index="/users">
        <el-icon><User /></el-icon>
        <template #title>用户管理</template>
      </el-menu-item>
      <el-menu-item v-if="userStore.isAdmin" index="/alerts">
        <el-icon><Bell /></el-icon>
        <template #title>告警管理</template>
      </el-menu-item>
      <el-menu-item v-if="userStore.isAdmin" index="/llm-config">
        <el-icon><Setting /></el-icon>
        <template #title>LLM配置</template>
      </el-menu-item>
      <el-menu-item index="/ai-analysis">
        <el-icon><TrendCharts /></el-icon>
        <template #title>AI分析</template>
      </el-menu-item>
      <el-menu-item index="/knowledge">
        <el-icon><Document /></el-icon>
        <template #title>知识库</template>
      </el-menu-item>
      <el-menu-item index="/inspection">
        <el-icon><Search /></el-icon>
        <template #title>智能巡检</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Monitor, Grid, Warning, User, ArrowDown, SwitchButton, Document, Tools, Connection, Bell, Setting, TrendCharts, Search } from '@element-plus/icons-vue'
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
  width: 220px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.nav-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
  padding: 8px 0;
}

.nav-menu::-webkit-scrollbar {
  width: 6px;
}

.nav-menu::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.nav-menu::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.nav-menu::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}

/* 菜单项样式优化 */
:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s;
  padding-left: 20px !important;
}

:deep(.el-menu-item:hover) {
  background-color: #f5f7fa;
  color: #409eff;
}

:deep(.el-menu-item.is-active) {
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: 500;
  border-left: 3px solid #409eff;
  padding-left: 17px !important;
}

:deep(.el-menu-item .el-icon) {
  margin-right: 12px;
  font-size: 18px;
  width: 18px;
  text-align: center;
}

:deep(.el-menu-item.is-active .el-icon) {
  color: #409eff;
}

:deep(.el-menu-item span) {
  font-size: 14px;
}
</style>

