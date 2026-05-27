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
    const value = props.metricType === 'cpu' ? item.cpu_percent : item.memory_percent
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

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return ''
        let html = `${params[0].axisValue}<br/>`
        params.forEach((item: any) => {
          if (item.value !== null && item.value !== undefined) {
            html += `${item.marker} ${item.seriesName}: <strong>${Number(item.value).toFixed(2)}%</strong><br/>`
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
      name: props.metricType === 'cpu' ? 'CPU使用率(%)' : '内存使用率(%)',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', start: 0, end: 100, height: 20 }
    ],
    series
  }, true)
}

watch(() => [props.data, props.metricType], updateChart, { deep: true })

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
</style>
