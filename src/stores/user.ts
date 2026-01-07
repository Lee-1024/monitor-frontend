import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, refreshToken, getCurrentUser, type UserInfo, type LoginRequest, type RegisterRequest } from '@/api/auth'
import { ElMessage } from 'element-plus'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshTokenValue = ref<string | null>(localStorage.getItem('refresh_token'))
  const userInfo = ref<UserInfo | null>(null)
  const isAuthenticated = computed(() => !!token.value && !!userInfo.value)

  // 初始化：从localStorage恢复token
  const initAuth = async () => {
    const savedToken = localStorage.getItem('token')
    const savedRefreshToken = localStorage.getItem('refresh_token')
    
    if (savedToken) {
      token.value = savedToken
      refreshTokenValue.value = savedRefreshToken
      
      // 尝试获取用户信息
      try {
        const res = await getCurrentUser()
        if (res.code === 200 && res.data) {
          userInfo.value = res.data
        } else {
          // token可能已过期，清除
          clearAuth()
        }
      } catch (error) {
        // token无效，清除
        clearAuth()
      }
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
        
        // 保存到localStorage
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('refresh_token', res.data.refresh_token)
        
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
        
        // 保存到localStorage
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('refresh_token', res.data.refresh_token)
        
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
        
        // 更新localStorage
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('refresh_token', res.data.refresh_token)
        
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
    clearAuth()
    ElMessage.success('已退出登录')
    router.push('/login')
  }

  // 清除认证信息
  const clearAuth = () => {
    token.value = null
    refreshTokenValue.value = null
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
  }

  // 检查是否为管理员
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  return {
    token,
    refreshTokenValue,
    userInfo,
    isAuthenticated,
    isAdmin,
    initAuth,
    userLogin,
    userRegister,
    refreshUserToken,
    fetchUserInfo,
    logout,
    clearAuth
  }
})

