import request from '@/utils/request'
import type { ApiResponse } from '@/types'

// 用户信息
export interface UserInfo {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
}

// 登录请求
export interface LoginRequest {
  username: string
  password: string
}

// 注册请求
export interface RegisterRequest {
  username: string
  email: string
  password: string
}

// 认证响应
export interface AuthResponse {
  token: string
  refresh_token: string
  expires_in: number
  user: UserInfo
}

// 刷新Token请求
export interface RefreshTokenRequest {
  refresh_token: string
}

// 修改密码请求
export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

// 用户注册
export const register = (data: RegisterRequest) => {
  return request<AuthResponse>({
    url: '/v1/auth/register',
    method: 'post',
    data
  })
}

// 用户登录
export const login = (data: LoginRequest) => {
  return request<AuthResponse>({
    url: '/v1/auth/login',
    method: 'post',
    data
  })
}

// 刷新Token
export const refreshToken = (data: RefreshTokenRequest) => {
  return request<AuthResponse>({
    url: '/v1/auth/refresh',
    method: 'post',
    data
  })
}

// 获取当前用户信息
export const getCurrentUser = () => {
  return request<UserInfo>({
    url: '/v1/user/me',
    method: 'get'
  })
}

// 修改密码
export const changePassword = (data: ChangePasswordRequest) => {
  return request<ApiResponse>({
    url: '/v1/user/password',
    method: 'put',
    data
  })
}

