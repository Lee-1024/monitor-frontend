import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { UserInfo } from './auth'

// 创建用户请求
export interface CreateUserRequest {
  username: string
  email: string
  password: string
  role?: 'admin' | 'user'
}

// 更新用户请求
export interface UpdateUserRequest {
  email?: string
  role?: 'admin' | 'user'
  status?: 'active' | 'inactive'
}

// 重置密码请求
export interface ResetPasswordRequest {
  new_password: string
}

// 获取用户列表
export const getUserList = (params?: { page?: number; page_size?: number }) => {
  return request<ApiResponse<PaginatedResponse<UserInfo>>>({
    url: '/v1/users',
    method: 'get',
    params
  })
}

// 获取单个用户
export const getUser = (id: number) => {
  return request<ApiResponse<UserInfo>>({
    url: `/v1/users/${id}`,
    method: 'get'
  })
}

// 创建用户
export const createUser = (data: CreateUserRequest) => {
  return request<ApiResponse<UserInfo>>({
    url: '/v1/users',
    method: 'post',
    data
  })
}

// 更新用户
export const updateUser = (id: number, data: UpdateUserRequest) => {
  return request<ApiResponse<UserInfo>>({
    url: `/v1/users/${id}`,
    method: 'put',
    data
  })
}

// 删除用户
export const deleteUser = (id: number) => {
  return request<ApiResponse>({
    url: `/v1/users/${id}`,
    method: 'delete'
  })
}

// 重置用户密码
export const resetUserPassword = (id: number, data: ResetPasswordRequest) => {
  return request<ApiResponse>({
    url: `/v1/users/${id}/reset-password`,
    method: 'post',
    data
  })
}

