import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import type { ApiResponse } from '@/types'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 是否正在刷新token
let isRefreshing = false
// 等待刷新token的请求队列
let requests: Array<(token: string) => void> = []

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加token到请求头
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    
    // 根据后端返回的code判断
    if (res.code !== 200) {
      ElMessage.error(res.message || 'Error')
      return Promise.reject(new Error(res.message || 'Error'))
    }
    
    return res
  },
  async (error) => {
    console.error('Response error:', error)
    
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    // 处理401未授权错误
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 如果正在刷新token，将请求加入队列
      if (isRefreshing) {
        return new Promise((resolve) => {
          requests.push((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(service(originalRequest))
          })
        })
      }
      
      originalRequest._retry = true
      isRefreshing = true
      
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (refreshToken) {
        try {
          // 尝试刷新token
          const refreshResponse = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || '/api'}/v1/auth/refresh`,
            { refresh_token: refreshToken }
          )
          
          if (refreshResponse.data.code === 200 && refreshResponse.data.data) {
            const newToken = refreshResponse.data.data.token
            const newRefreshToken = refreshResponse.data.data.refresh_token
            
            localStorage.setItem('token', newToken)
            localStorage.setItem('refresh_token', newRefreshToken)
            
            // 处理队列中的请求
            requests.forEach((cb) => cb(newToken))
            requests = []
            
            // 重试原始请求
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
            }
            isRefreshing = false
            return service(originalRequest)
          }
        } catch (refreshError) {
          // 刷新失败，清除token并跳转到登录页
          localStorage.removeItem('token')
          localStorage.removeItem('refresh_token')
          isRefreshing = false
          requests = []
          
          if (router.currentRoute.value.path !== '/login') {
            ElMessage.error('登录已过期，请重新登录')
            router.push('/login')
          }
          return Promise.reject(refreshError)
        }
      } else {
        // 没有refresh_token，直接跳转到登录页
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        isRefreshing = false
        requests = []
        
        if (router.currentRoute.value.path !== '/login') {
          ElMessage.error('登录已过期，请重新登录')
          router.push('/login')
        }
      }
    } else if (error.response?.status === 401) {
      // 刷新token也失败了，跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      if (router.currentRoute.value.path !== '/login') {
        ElMessage.error('登录已过期，请重新登录')
        router.push('/login')
      }
    } else {
      ElMessage.error(error.response?.data?.message || error.message || '网络错误')
    }
    
    return Promise.reject(error)
  }
)

// 类型安全的请求函数包装
function request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service(config) as Promise<ApiResponse<T>>
}

// 导出 request 函数和 service 实例
export default request
export { service as axios }