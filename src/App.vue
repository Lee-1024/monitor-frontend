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

.markdown-content,
.summary-content {
  color: #303133;
  font-size: 14px;
  line-height: 1.75;
  word-break: break-word;
}

.markdown-content .markdown-h,
.markdown-content .markdown-h2,
.markdown-content .markdown-h3,
.markdown-content .markdown-h4,
.summary-content .markdown-h,
.summary-content .markdown-h2,
.summary-content .markdown-h3,
.summary-content .markdown-h4 {
  margin: 18px 0 10px;
  color: #303133;
  font-weight: 650;
  line-height: 1.45;
}

.markdown-content .markdown-h:first-child,
.summary-content .markdown-h:first-child {
  margin-top: 0;
}

.markdown-content .markdown-h1,
.summary-content .markdown-h1 {
  padding-bottom: 10px;
  border-bottom: 1px solid #dcdfe6;
  font-size: 22px;
}

.markdown-content .markdown-h2,
.summary-content .markdown-h2 {
  padding-left: 10px;
  border-left: 3px solid #409eff;
  font-size: 18px;
}

.markdown-content .markdown-h3,
.markdown-content .markdown-h4,
.summary-content .markdown-h3,
.summary-content .markdown-h4 {
  font-size: 15px;
}

.markdown-content .markdown-p,
.markdown-content .markdown-paragraph,
.summary-content .markdown-p,
.summary-content .markdown-paragraph {
  margin: 10px 0;
}

.markdown-content .markdown-list,
.summary-content .markdown-list {
  margin: 8px 0 14px 20px;
  padding-left: 20px;
}

.markdown-content .markdown-list li,
.markdown-content .markdown-list-item,
.summary-content .markdown-list li,
.summary-content .markdown-list-item {
  margin: 5px 0;
  padding-left: 2px;
}

.markdown-content strong,
.summary-content strong {
  color: #303133;
  font-weight: 650;
}

.markdown-content em,
.summary-content em {
  color: #606266;
}

.markdown-content code,
.summary-content code {
  padding: 2px 5px;
  border-radius: 4px;
  background: #f0f2f5;
  color: #c45656;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
}

.markdown-content .markdown-table-wrap,
.summary-content .markdown-table-wrap {
  width: 100%;
  margin: 12px 0 18px;
  overflow-x: auto;
  border: 1px solid #d8dfe8;
  border-radius: 6px;
  background: #fff;
}

.markdown-content .markdown-table,
.summary-content .markdown-table {
  width: 100%;
  min-width: 420px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  line-height: 1.55;
}

.markdown-content .markdown-table th,
.markdown-content .markdown-table td,
.summary-content .markdown-table th,
.summary-content .markdown-table td {
  padding: 8px 12px;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

.markdown-content .markdown-table th:last-child,
.markdown-content .markdown-table td:last-child,
.summary-content .markdown-table th:last-child,
.summary-content .markdown-table td:last-child {
  border-right: 0;
}

.markdown-content .markdown-table th,
.summary-content .markdown-table th {
  background: #f3f6fa;
  color: #303133;
  font-weight: 650;
}

.markdown-content .markdown-table tbody tr:nth-child(even),
.summary-content .markdown-table tbody tr:nth-child(even) {
  background: #fafcff;
}

.markdown-content .markdown-table tbody tr:hover,
.summary-content .markdown-table tbody tr:hover {
  background: #f0f7ff;
}

.markdown-content .markdown-table tbody tr:last-child td,
.summary-content .markdown-table tbody tr:last-child td {
  border-bottom: 0;
}
</style>
