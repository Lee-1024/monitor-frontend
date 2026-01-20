import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '监控面板', requiresAuth: true }
  },
  {
    path: '/agents',
    name: 'Agents',
    component: () => import('@/views/Agents.vue'),
    meta: { title: 'Agent管理', requiresAuth: true }
  },
  {
    path: '/agents/:id',
    name: 'AgentDetail',
    component: () => import('@/views/AgentDetail.vue'),
    meta: { title: 'Agent详情', requiresAuth: true }
  },
  {
    path: '/crash-analysis',
    name: 'CrashAnalysis',
    component: () => import('@/views/CrashAnalysis.vue'),
    meta: { title: '宕机分析', requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/Users.vue'),
    meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/processes',
    name: 'Processes',
    component: () => import('@/views/Processes.vue'),
    meta: { title: '进程监控', requiresAuth: true }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('@/views/Logs.vue'),
    meta: { title: '日志查看', requiresAuth: true }
  },
  {
    path: '/scripts',
    name: 'Scripts',
    component: () => import('@/views/Scripts.vue'),
    meta: { title: '脚本执行', requiresAuth: true }
  },
  {
    path: '/services',
    name: 'Services',
    component: () => import('@/views/Services.vue'),
    meta: { title: '服务状态', requiresAuth: true }
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('@/views/Alerts.vue'),
    meta: { title: '告警管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/bigscreen',
    name: 'BigScreen',
    component: () => import('@/views/BigScreen.vue'),
    meta: { title: '监控大屏', requiresAuth: true }
  },
  {
    path: '/llm-config',
    name: 'LLMConfig',
    component: () => import('@/views/LLMConfig.vue'),
    meta: { title: 'LLM模型配置', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/ai-analysis',
    name: 'AIAnalysis',
    component: () => import('@/views/AIAnalysis.vue'),
    meta: { title: 'AI分析', requiresAuth: true }
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: () => import('@/views/Knowledge.vue'),
    meta: { title: '知识库', requiresAuth: true }
  },
  {
    path: '/inspection',
    name: 'Inspection',
    component: () => import('@/views/Inspection.vue'),
    meta: { title: '智能巡检', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 初始化认证状态
  if (!userStore.isAuthenticated && localStorage.getItem('token')) {
    await userStore.initAuth()
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!userStore.isAuthenticated) {
      // 未登录，跳转到登录页
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
    
    // 检查是否需要管理员权限
    if (to.meta.requiresAdmin && !userStore.isAdmin) {
      // 非管理员，跳转到首页
      next({ path: '/dashboard' })
      return
    }
  } else if (to.path === '/login' && userStore.isAuthenticated) {
    // 已登录用户访问登录页，跳转到首页
    next({ path: '/dashboard' })
    return
  }
  
  next()
})

export default router