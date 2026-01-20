<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container">
      <TopNav v-if="showNavMenu" />
      <div class="app-body">
        <NavMenu v-if="showNavMenu" />
        <div class="app-content">
          <router-view />
        </div>
      </div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
// @ts-ignore
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import NavMenu from './components/NavMenu.vue'
import TopNav from './components/TopNav.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
// 大屏页面在非全屏时也显示导航菜单
const showNavMenu = computed(() => route.path !== '/login')
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.app-body {
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow: auto;
  background: #f5f7fa;
  min-width: 0; /* 防止内容溢出 */
}
</style>