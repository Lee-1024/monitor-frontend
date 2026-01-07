<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container">
      <NavMenu v-if="showNavMenu" />
      <div class="app-content">
        <router-view />
      </div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
// @ts-ignore
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import NavMenu from './components/NavMenu.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
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
}

.app-content {
  flex: 1;
  overflow: auto;
}
</style>