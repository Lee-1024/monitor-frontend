import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUnreadAlertCount } from '@/api/alert'

export const useAlertStore = defineStore('alert', () => {
  // 未读告警数量
  const unreadCount = ref<number>(0)
  // 最后更新时间
  const lastUpdateTime = ref<number>(0)
  // 轮询间隔（秒）
  const pollInterval = 30000 // 30秒

  // 是否有未读告警
  const hasUnread = computed(() => unreadCount.value > 0)

  // 获取未读告警数量
  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadAlertCount()
      if (res.code === 200 && res.data !== undefined) {
        unreadCount.value = res.data
        lastUpdateTime.value = Date.now()
      }
    } catch (error) {
      console.error('Failed to fetch unread alert count:', error)
    }
  }

  // 清除未读提示
  const clearUnread = () => {
    unreadCount.value = 0
    lastUpdateTime.value = Date.now()
  }

  // 开始轮询
  let pollTimer: number | null = null
  let visibilityHandler: (() => void) | null = null
  
  const startPolling = () => {
    if (pollTimer) {
      return // 已经在轮询
    }
    fetchUnreadCount() // 立即获取一次
    
    // 设置轮询定时器
    pollTimer = window.setInterval(() => {
      // 只有在页面可见时才请求
      if (!document.hidden) {
        fetchUnreadCount()
      }
    }, pollInterval)
    
    // 监听页面可见性变化
    visibilityHandler = () => {
      if (!document.hidden) {
        // 页面重新可见时，立即请求一次
        fetchUnreadCount()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  }

  // 停止轮询
  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }
  }

  return {
    unreadCount,
    hasUnread,
    fetchUnreadCount,
    clearUnread,
    startPolling,
    stopPolling
  }
})

