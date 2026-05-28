<template>
  <div v-loading="loading">
    <div ref="chartRef" class="docker-chart"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import type { DockerHistoryPoint } from '@/api/docker'

const props = defineProps<{
  data: DockerHistoryPoint[]
  loading?: boolean
  metricType: 'cpu' | 'memory'
  hostCoreCount?: number
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const resize = () => chart?.resize()

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chart) return

  const containerMap = new Map<string, Array<{ time: string; value: number }>>()
  props.data.forEach((item) => {
    const name = item.container_name || 'unknown'
    const time = dayjs(item.timestamp).format('HH:mm:ss')
    const value = props.metricType === 'cpu' ? getCPUCapacityPercent(item.cpu_percent) : item.memory_percent
    if (!containerMap.has(name)) {
      containerMap.set(name, [])
    }
    containerMap.get(name)!.push({ time, value })
  })

  const allTimes = new Set<string>()
  containerMap.forEach((items) => items.forEach((item) => allTimes.add(item.time)))
  const times = Array.from(allTimes).sort()
  const series = Array.from(containerMap.entries()).map(([name, items]) => ({
    name,
    type: 'line',
    smooth: true,
    symbolSize: 4,
    data: times.map((time) => items.find((item) => item.time === time)?.value ?? null),
    connectNulls: false
  }))
  const yAxisMax = getYAxisMax()

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      confine: true,
      appendToBody: false,
      className: 'docker-chart-tooltip',
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return ''
        let html = `${params[0].axisValue}<br/>`
        params.forEach((item: any) => {
          if (item.value !== null && item.value !== undefined) {
            const name = escapeHtml(String(item.seriesName || 'unknown'))
            const shortName = escapeHtml(truncateContainerName(String(item.seriesName || 'unknown')))
            const rawPoint = getRawPoint(String(item.seriesName || 'unknown'), String(item.axisValue || ''))
            const detail = props.metricType === 'cpu' && rawPoint
              ? `${formatCPUCapacity(rawPoint.cpu_percent)} / ${formatCPUCores(rawPoint.cpu_percent)} / 原始${rawPoint.cpu_percent.toFixed(2)}%`
              : `${Number(item.value).toFixed(2)}%`
            html += `<div class="docker-tooltip-row">${item.marker}<span class="docker-tooltip-name" title="${name}">${shortName}</span><strong>${detail}</strong></div>`
          }
        })
        return html
      }
    },
    legend: {
      data: Array.from(containerMap.keys()),
      top: 10,
      type: 'scroll'
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '20%',
      bottom: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times
    },
    yAxis: {
      type: 'value',
      name: props.metricType === 'cpu' ? 'CPU容量占比(%)' : '内存使用率(%)',
      max: yAxisMax,
      axisLabel: { formatter: '{value}%' }
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', start: 0, end: 100, height: 20 }
    ],
    series
  }, true)
}

function getYAxisMax() {
  return 100
}

function getCPUCapacityPercent(cpuPercent: number) {
  const coreCount = props.hostCoreCount || 0
  if (coreCount <= 0) return cpuPercent || 0
  return (cpuPercent || 0) / coreCount
}

function formatCPUCapacity(cpuPercent: number) {
  return `${getCPUCapacityPercent(cpuPercent).toFixed(2)}%`
}

function formatCPUCores(cpuPercent: number) {
  return `${((cpuPercent || 0) / 100).toFixed(2)}核`
}

function getRawPoint(containerName: string, axisTime: string) {
  return props.data.find((item) => {
    const name = item.container_name || 'unknown'
    const time = dayjs(item.timestamp).format('HH:mm:ss')
    return name === containerName && time === axisTime
  })
}

function truncateContainerName(name: string) {
  if (name.length <= 36) return name
  return `${name.slice(0, 18)}...${name.slice(-12)}`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

watch(() => [props.data, props.metricType, props.hostCoreCount], updateChart, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
})
</script>

<style scoped>
.docker-chart {
  width: 100%;
  height: 400px;
}

:global(.docker-chart-tooltip) {
  max-width: 360px;
  white-space: normal;
  overflow-wrap: anywhere;
}

:global(.docker-tooltip-row) {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  max-width: 340px;
  line-height: 20px;
}

:global(.docker-tooltip-name) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
