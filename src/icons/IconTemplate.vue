<!-- 
  图标组件模板
  使用步骤：
  1. 在 iconfont.cn 下载 SVG 文件
  2. 打开 SVG 文件，复制 <path> 或其他元素内容
  3. 将内容粘贴到下面的 <svg> 标签内
  4. 复制 viewBox 属性值（如果有）
  5. 重命名文件为对应的图标名称，如 CpuIcon.vue
-->

<template>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    :width="size" 
    :height="size" 
    viewBox="0 0 1024 1024"
    :fill="color"
  >
    <!-- 
      在这里粘贴从 iconfont 下载的 SVG 内容
      例如：
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z"/>
    -->
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number | string
  color?: string
}>(), {
  size: 24,
  color: 'currentColor'
})
</script>

