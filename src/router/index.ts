import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '监控面板' }
  },
  {
    path: '/agents',
    name: 'Agents',
    component: () => import('@/views/Agents.vue'),
    meta: { title: 'Agent管理' }
  },
  {
    path: '/agents/:id',
    name: 'AgentDetail',
    component: () => import('@/views/AgentDetail.vue'),
    meta: { title: 'Agent详情' }
  },
  {
    path: '/crash-analysis',
    name: 'CrashAnalysis',
    component: () => import('@/views/CrashAnalysis.vue'),
    meta: { title: '宕机分析' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router