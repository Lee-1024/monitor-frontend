<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <!-- 像素风格图标 -->
        <div class="pixel-icon">
          <div class="pixel-monitor">
            <div class="pixel-screen">
              <div class="pixel-line"></div>
              <div class="pixel-line"></div>
              <div class="pixel-line"></div>
              <div class="pixel-dot"></div>
            </div>
            <div class="pixel-stand"></div>
            <div class="pixel-base"></div>
          </div>
        </div>
        <h2>监控系统</h2>
        <p>Monitor System</p>
      </div>
      
      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="登录" name="login">
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-width="0"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="用户名"
                size="large"
                prefix-icon="User"
                clearable
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="密码"
                size="large"
                prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="login-button"
                @click="handleLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="注册" name="register">
          <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            label-width="0"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="registerForm.username"
                placeholder="用户名（至少3个字符）"
                size="large"
                prefix-icon="User"
                clearable
              />
            </el-form-item>
            <el-form-item prop="email">
              <el-input
                v-model="registerForm.email"
                placeholder="邮箱"
                size="large"
                prefix-icon="Message"
                clearable
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="密码（至少6个字符）"
                size="large"
                prefix-icon="Lock"
                show-password
                @keyup.enter="handleRegister"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="login-button"
                @click="handleRegister"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const loading = ref(false)
const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  email: '',
  password: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 64, message: '用户名长度在3到64个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const success = await userStore.userLogin({
          username: loginForm.username,
          password: loginForm.password
        })
        
        if (success) {
          router.push('/dashboard')
        }
      } finally {
        loading.value = false
      }
    }
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const success = await userStore.userRegister({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })
        
        if (success) {
          router.push('/dashboard')
        }
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* 像素网格背景 */
.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  animation: gridMove 20s linear infinite;
  pointer-events: none;
}

@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(20px, 20px);
  }
}

.login-box {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.1),
    0 0 0 4px #fff,
    0 0 0 6px #667eea,
    inset 0 0 20px rgba(102, 126, 234, 0.1);
  position: relative;
  z-index: 1;
  border: 2px solid rgba(102, 126, 234, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

/* 像素风格图标 */
.pixel-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.pixel-monitor {
  position: relative;
  width: 80px;
  height: 80px;
}

/* 显示器屏幕 */
.pixel-screen {
  position: absolute;
  top: 0;
  left: 10px;
  width: 60px;
  height: 45px;
  background: #1a1a2e;
  border: 3px solid #0f3460;
  box-shadow: 
    inset 2px 2px 0 #0a0a1a,
    inset -2px -2px 0 #2a2a4e,
    0 0 10px rgba(0, 255, 136, 0.3);
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* 屏幕内容 - 像素线条 */
.pixel-line {
  position: absolute;
  left: 5px;
  width: 50px;
  height: 2px;
  background: #00ff88;
  box-shadow: 0 0 4px #00ff88;
}

.pixel-line:nth-child(1) {
  top: 8px;
  animation: scan 2s ease-in-out infinite;
}

.pixel-line:nth-child(2) {
  top: 18px;
  width: 35px;
  animation: scan 2s ease-in-out infinite 0.3s;
}

.pixel-line:nth-child(3) {
  top: 28px;
  width: 40px;
  animation: scan 2s ease-in-out infinite 0.6s;
}

@keyframes scan {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

/* 像素点 */
.pixel-dot {
  position: absolute;
  top: 35px;
  right: 8px;
  width: 4px;
  height: 4px;
  background: #00ff88;
  box-shadow: 
    0 0 4px #00ff88,
    4px 0 0 #00ff88,
    8px 0 0 #00ff88;
  animation: blink 1s ease-in-out infinite;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* 显示器支架 */
.pixel-stand {
  position: absolute;
  top: 45px;
  left: 35px;
  width: 10px;
  height: 8px;
  background: #0f3460;
  border: 2px solid #16213e;
}

/* 显示器底座 */
.pixel-base {
  position: absolute;
  top: 53px;
  left: 25px;
  width: 30px;
  height: 4px;
  background: #0f3460;
  border: 2px solid #16213e;
  box-shadow: 0 2px 0 #0a1a2e;
}

.login-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
  text-shadow: 2px 2px 0 #ddd;
}

.login-header p {
  font-size: 14px;
  color: #999;
  font-family: 'Courier New', monospace;
}

.login-tabs {
  margin-top: 20px;
}

.login-form {
  margin-top: 20px;
}

.login-button {
  width: 100%;
  margin-top: 10px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>

