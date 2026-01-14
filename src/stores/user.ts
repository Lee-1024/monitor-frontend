import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, refreshToken, getCurrentUser, type UserInfo, type LoginRequest, type RegisterRequest } from '@/api/auth'
import { ElMessage } from 'element-plus'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshTokenValue = ref<string | null>(localStorage.getItem('refresh_token'))
  const savedExpireTime = localStorage.getItem('token_expire_time')
  const tokenExpireTime = ref<number | null>(savedExpireTime ? parseInt(savedExpireTime, 10) : null)
  const userInfo = ref<UserInfo | null>(null)
  const isAuthenticated = computed(() => {
    if (!token.value || !userInfo.value) {
      return false
    }
    // 检查 token 是否过期
    if (tokenExpireTime.value && Date.now() >= tokenExpireTime.value) {
      clearAuth()
      return false
    }
    return true
  })

  // 初始化：从localStorage恢复token
  const initAuth = async () => {
    const savedToken = localStorage.getItem('token')
    const savedRefreshToken = localStorage.getItem('refresh_token')
    const savedExpireTime = localStorage.getItem('token_expire_time')
    
    if (savedToken && savedExpireTime) {
      const expireTime = parseInt(savedExpireTime, 10)
      
      // 检查 token 是否已过期
      if (Date.now() >= expireTime) {
        // token 已过期，尝试刷新
        if (savedRefreshToken) {
          const refreshed = await refreshUserToken()
          if (!refreshed) {
            // 刷新失败，清除认证信息
            clearAuth()
            stopTokenCheck()
            return
          }
        } else {
          // 没有 refresh token，清除认证信息
          clearAuth()
          stopTokenCheck()
          return
        }
      } else {
        // token 未过期，恢复状态
        token.value = savedToken
        refreshTokenValue.value = savedRefreshToken
        tokenExpireTime.value = expireTime
      }
      
      // 尝试获取用户信息
      try {
        const res = await getCurrentUser()
        if (res.code === 200 && res.data) {
          userInfo.value = res.data
          // 启动 token 过期检查
          startTokenCheck()
        } else {
          // token可能已过期，清除
          clearAuth()
          stopTokenCheck()
        }
      } catch (error) {
        // token无效，清除
        clearAuth()
        stopTokenCheck()
      }
    } else if (savedToken) {
      // 有 token 但没有过期时间（旧数据），清除
      clearAuth()
      stopTokenCheck()
    }
  }

  // 登录
  const userLogin = async (loginData: LoginRequest) => {
    try {
      const res = await login(loginData)
      if (res.code === 200 && res.data) {
        token.value = res.data.token
        refreshTokenValue.value = res.data.refresh_token
        userInfo.value = res.data.user
        
        // 计算 token 过期时间（expires_in 是秒数）
        const expireTime = Date.now() + (res.data.expires_in * 1000)
        tokenExpireTime.value = expireTime
        
        // 保存到localStorage
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('refresh_token', res.data.refresh_token)
        localStorage.setItem('token_expire_time', expireTime.toString())
        
        // 启动 token 过期检查
        startTokenCheck()
        
        ElMessage.success('登录成功')
        return true
      } else {
        ElMessage.error(res.message || '登录失败')
        return false
      }
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '登录失败')
      return false
    }
  }

  // 注册
  const userRegister = async (registerData: RegisterRequest) => {
    try {
      const res = await register(registerData)
      if (res.code === 200 && res.data) {
        token.value = res.data.token
        refreshTokenValue.value = res.data.refresh_token
        userInfo.value = res.data.user
        
        // 计算 token 过期时间（expires_in 是秒数）
        const expireTime = Date.now() + (res.data.expires_in * 1000)
        tokenExpireTime.value = expireTime
        
        // 保存到localStorage
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('refresh_token', res.data.refresh_token)
        localStorage.setItem('token_expire_time', expireTime.toString())
        
        // 启动 token 过期检查
        startTokenCheck()
        
        ElMessage.success('注册成功')
        return true
      } else {
        ElMessage.error(res.message || '注册失败')
        return false
      }
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '注册失败')
      return false
    }
  }

  // 刷新Token
  const refreshUserToken = async () => {
    if (!refreshTokenValue.value) {
      return false
    }

    try {
      const res = await refreshToken({ refresh_token: refreshTokenValue.value })
      if (res.code === 200 && res.data) {
        token.value = res.data.token
        refreshTokenValue.value = res.data.refresh_token
        userInfo.value = res.data.user
        
        // 计算新的 token 过期时间
        const expireTime = Date.now() + (res.data.expires_in * 1000)
        tokenExpireTime.value = expireTime
        
        // 更新localStorage
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('refresh_token', res.data.refresh_token)
        localStorage.setItem('token_expire_time', expireTime.toString())
        
        return true
      } else {
        clearAuth()
        return false
      }
    } catch (error) {
      clearAuth()
      return false
    }
  }
  
  // 检查 token 是否过期
  const checkTokenExpired = (): boolean => {
    if (!tokenExpireTime.value) {
      return true // 没有过期时间，认为已过期
    }
    return Date.now() >= tokenExpireTime.value
  }
  
  // 检查 token 是否即将过期（提前5分钟）
  const checkTokenExpiringSoon = (): boolean => {
    if (!tokenExpireTime.value) {
      return true
    }
    const fiveMinutes = 5 * 60 * 1000 // 5分钟
    return Date.now() >= (tokenExpireTime.value - fiveMinutes)
  }
  
  // Token 过期检查定时器
  let tokenCheckInterval: number | null = null
  
  // 启动 token 过期检查
  const startTokenCheck = () => {
    // 清除旧的定时器
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval)
    }
    
    // 每1分钟检查一次 token 是否过期或即将过期
    tokenCheckInterval = window.setInterval(() => {
      if (!token.value) {
        return
      }
      
      // 检查是否已过期
      if (checkTokenExpired()) {
        // token 已过期，尝试刷新
        if (refreshTokenValue.value) {
          refreshUserToken().catch(() => {
            // 刷新失败，清除认证信息
            clearAuth()
            stopTokenCheck()
            if (router.currentRoute.value.path !== '/login') {
              ElMessage.error('登录已过期，请重新登录')
              router.push('/login')
            }
          })
        } else {
          // 没有 refresh token，清除并跳转
          clearAuth()
          stopTokenCheck()
          if (router.currentRoute.value.path !== '/login') {
            ElMessage.error('登录已过期，请重新登录')
            router.push('/login')
          }
        }
      } else if (checkTokenExpiringSoon()) {
        // token 即将过期，提前刷新
        if (refreshTokenValue.value) {
          refreshUserToken().catch(() => {
            // 刷新失败，静默处理（不跳转，等待下次检查）
            console.warn('Failed to refresh token before expiration')
          })
        }
      }
    }, 60 * 1000) // 每1分钟检查一次
  }
  
  // 停止 token 过期检查
  const stopTokenCheck = () => {
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval)
      tokenCheckInterval = null
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const res = await getCurrentUser()
      if (res.code === 200 && res.data) {
        userInfo.value = res.data
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  // 退出登录
  const logout = () => {
    stopTokenCheck()
    clearAuth()
    ElMessage.success('已退出登录')
    router.push('/login')
  }

  // 清除认证信息
  const clearAuth = () => {
    token.value = null
    refreshTokenValue.value = null
    tokenExpireTime.value = null
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_expire_time')
  }

  // 检查是否为管理员
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  return {
    token,
    refreshTokenValue,
    tokenExpireTime,
    userInfo,
    isAuthenticated,
    isAdmin,
    initAuth,
    userLogin,
    userRegister,
    refreshUserToken,
    fetchUserInfo,
    logout,
    clearAuth,
    checkTokenExpired,
    checkTokenExpiringSoon,
    startTokenCheck,
    stopTokenCheck
  }
})

