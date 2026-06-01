<template>
  <div v-loading="loading">
    <div ref="chartRef" class="docker-chart"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { DockerHistoryPoint } from '@/api/docker'
import { formatMetricAxisTimestamp, getSortedMetricTimestamps } from '@/utils/metricTimeFormat'

const props = defineProps<{
  data: DockerHistoryPoint[]
  loading?: boolean
  metricType: 'cpu' | 'memory'
  hostCoreCount?: number
  startTime?: string
  endTime?: string
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

  const timestamps = getSortedMetricTimestamps(props.data)
  const containerMap = new Map<string, Array<{
    value: [number, number]
    raw: DockerHistoryPoint
  }>>()
  props.data.forEach((item) => {
    const name = item.container_name || 'unknown'
    const value = props.metricType === 'cpu' ? getCPUCapacityPercent(item.cpu_percent) : item.memory_percent
    if (!containerMap.has(name)) {
      containerMap.set(name, [])
    }
    containerMap.get(name)!.push({
      value: [new Date(item.timestamp).getTime(), value],
      raw: item
    })
  })

  const topContainers = Array.from(containerMap.entries())
    .map(([name, items]) => ({
      name,
      items,
      maxValue: Math.max(...items.map(item => item.value[1]))
    }))
    .filter(item => item.maxValue > 0)
    .sort((a, b) => b.maxValue - a.maxValue)
    .slice(0, 10)

  const series = topContainers.map(({ name, items }) => ({
    name,
    type: 'line',
    smooth: true,
    symbolSize: 4,
    data: items.sort((a, b) => a.value[0] - b.value[0]),
    connectNulls: false
  }))
  const yAxisMax = getYAxisMax()

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      confine: false,
      appendToBody: true,
      className: 'docker-chart-tooltip',
      extraCssText: 'z-index: 3000; max-height: 320px; overflow-y: auto;',
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return ''
        const timestampValue = getTooltipTimestamp(params[0])
        let html = `${formatMetricAxisTimestamp(new Date(timestampValue).toISOString(), timestamps)}<br/>`
        params.forEach((item: any) => {
          if (item.value !== null && item.value !== undefined) {
            const name = escapeHtml(String(item.seriesName || 'unknown'))
            const shortName = escapeHtml(truncateContainerName(String(item.seriesName || 'unknown')))
            const pointTime = getTooltipTimestamp(item)
            const value = getTooltipValue(item)
            const rawPoint = getTooltipRawPoint(item) || getRawPoint(String(item.seriesName || 'unknown'), pointTime)
            const detail = props.metricType === 'cpu' && rawPoint
              ? `${formatCPUCapacity(rawPoint.cpu_percent)} / ${formatCPUCores(rawPoint.cpu_percent)} / 原始${rawPoint.cpu_percent.toFixed(2)}%`
              : `${value.toFixed(2)}%`
            html += `<div class="docker-tooltip-row">${item.marker}<span class="docker-tooltip-name" title="${name}">${shortName}</span><strong>${detail}</strong></div>`
          }
        })
        return html
      }
    },
    legend: {
      data: topContainers.map(item => item.name),
      top: 10,
      type: 'scroll'
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '24%',
      bottom: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      min: props.startTime,
      max: props.endTime,
      axisLabel: {
        formatter: (value: string) => formatMetricAxisTimestamp(value, timestamps)
      }
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
  if ((props.hostCoreCount || 0) <= 0) {
    return `原始${(cpuPercent || 0).toFixed(2)}%`
  }
  return `${getCPUCapacityPercent(cpuPercent).toFixed(2)}%`
}

function formatCPUCores(cpuPercent: number) {
  return `${((cpuPercent || 0) / 100).toFixed(2)}核`
}

function getTooltipTimestamp(item: any) {
  if (Array.isArray(item?.value)) {
    return Number(item.value[0] || 0)
  }
  return Number(item?.axisValue || 0)
}

function getTooltipValue(item: any) {
  if (Array.isArray(item?.value)) {
    return Number(item.value[1] || 0)
  }
  return Number(item?.value || 0)
}

function getTooltipRawPoint(item: any) {
  return item?.data?.raw
}

function getRawPoint(containerName: string, axisTime: number) {
  return props.data.find((item) => {
    const name = item.container_name || 'unknown'
    return name === containerName && new Date(item.timestamp).getTime() === axisTime
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

watch(() => [props.data, props.metricType, props.hostCoreCount, props.startTime, props.endTime], updateChart, { deep: true })

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
