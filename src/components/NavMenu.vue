<template>
  <el-menu
    :default-active="activeMenu"
    mode="horizontal"
    router
    class="nav-menu"
  >
    <el-menu-item index="/dashboard">
      <el-icon><Monitor /></el-icon>
      <span>监控面板</span>
    </el-menu-item>
    <el-menu-item index="/agents">
      <el-icon><Grid /></el-icon>
      <span>主机管理</span>
    </el-menu-item>
    <el-menu-item index="/crash-analysis">
      <el-icon><Warning /></el-icon>
      <span>宕机分析</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Monitor, Grid, Warning } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.nav-menu {
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}
</style>

