<!-- ============================================ -->
<!-- 文件: src/components/ProcessHistoryChart.vue -->
<!-- ============================================ -->
<template>
  <div v-loading="loading">
    <div ref="chartRef" style="width: 100%; height: 400px;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { formatMetricAxisTimestamp, getSortedMetricTimestamps } from '@/utils/metricTimeFormat'

const props = defineProps<{
  data: Array<{
    timestamp: string
    process_name: string
    cpu_percent: number
    memory_percent: number
  }>
  loading?: boolean
  metricType?: 'cpu' | 'memory' // 显示CPU还是内存
  hostCoreCount?: number
  startTime?: string
  endTime?: string
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chart || !props.data || props.data.length === 0) return
  
  // 按进程名分组数据
  const timestamps = getSortedMetricTimestamps(props.data)
  const processMap = new Map<string, Array<[string, number]>>()
  
  props.data.forEach(item => {
    const processName = item.process_name
    const value = props.metricType === 'cpu' ? getCPUCapacityPercent(item.cpu_percent) : item.memory_percent
    
    if (!processMap.has(processName)) {
      processMap.set(processName, [])
    }
    processMap.get(processName)!.push([item.timestamp, value])
  })
  
  // 构建系列数据
  const series: any[] = []
  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
    '#9C27B0', '#00BCD4', '#FF9800', '#4CAF50', '#2196F3'
  ]
  
  let colorIndex = 0
  processMap.forEach((data, processName) => {
    series.push({
      name: processName,
      type: 'line',
      smooth: true,
      data: data.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()),
      itemStyle: {
        color: colors[colorIndex % colors.length]
      },
      lineStyle: {
        width: 2
      },
      symbol: 'circle',
      symbolSize: 4,
      connectNulls: false
    })
    colorIndex++
  })
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: (params: any) => {
        if (!params || !Array.isArray(params) || params.length === 0) {
          return ''
        }
        const timestamp = String(params[0].axisValue || '')
        let result = `${formatMetricAxisTimestamp(timestamp, timestamps)}<br/>`
        params.forEach((item: any) => {
          if (item.value !== null && item.value !== undefined) {
            const value = typeof item.value === 'number' ? item.value : parseFloat(item.value) || 0
            const rawPoint = getRawPoint(String(item.seriesName || ''), String(item.axisValue || ''))
            const detail = props.metricType === 'cpu' && rawPoint
              ? `${value.toFixed(2)}% / ${formatCPUCores(rawPoint.cpu_percent)} / 原始${rawPoint.cpu_percent.toFixed(2)}%`
              : `${value.toFixed(2)}%`
            result += `${item.marker || '●'} ${item.seriesName}: <strong>${detail}</strong><br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: Array.from(processMap.keys()),
      top: 10,
      left: 'center',
      type: 'scroll',
      pageButtonItemGap: 5,
      pageButtonGap: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      min: props.startTime,
      max: props.endTime,
      axisLabel: {
        rotate: 45,
        formatter: (value: string) => formatMetricAxisTimestamp(value, timestamps)
      }
    },
    yAxis: {
      type: 'value',
      name: props.metricType === 'cpu' ? 'CPU容量占比 (%)' : '内存使用率 (%)',
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 20
      }
    ],
    series
  }
  
  chart.setOption(option, true)
}

function getCPUCapacityPercent(cpuPercent: number) {
  const coreCount = props.hostCoreCount || 0
  if (coreCount <= 0) return cpuPercent || 0
  return (cpuPercent || 0) / coreCount
}

function formatCPUCores(cpuPercent: number) {
  return `${((cpuPercent || 0) / 100).toFixed(2)}核`
}

function getRawPoint(processName: string, axisTime: string) {
  return props.data.find((item) => {
    return item.process_name === processName && item.timestamp === axisTime
  })
}

watch(() => [props.data, props.metricType, props.hostCoreCount, props.startTime, props.endTime], () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    chart?.resize()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    chart?.resize()
  })
  chart?.dispose()
})
</script>

