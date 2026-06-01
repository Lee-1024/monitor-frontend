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
  const processMap = new Map<string, Array<{
    value: [number, number]
    raw: {
      timestamp: string
      process_name: string
      cpu_percent: number
      memory_percent: number
    }
  }>>()
  
  props.data.forEach(item => {
    const processName = item.process_name
    const value = props.metricType === 'cpu' ? getCPUCapacityPercent(item.cpu_percent) : item.memory_percent
    
    if (!processMap.has(processName)) {
      processMap.set(processName, [])
    }
    processMap.get(processName)!.push({
      value: [new Date(item.timestamp).getTime(), value],
      raw: item
    })
  })
  
  // 构建系列数据
  const series: any[] = []
  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
    '#9C27B0', '#00BCD4', '#FF9800', '#4CAF50', '#2196F3'
  ]
  
  let colorIndex = 0
  const topProcesses = Array.from(processMap.entries())
    .map(([processName, data]) => ({
      processName,
      data,
      maxValue: Math.max(...data.map(item => item.value[1]))
    }))
    .filter(item => item.maxValue > 0)
    .sort((a, b) => b.maxValue - a.maxValue)
    .slice(0, 10)

  topProcesses.forEach(({ data, processName }) => {
    series.push({
      name: processName,
      type: 'line',
      smooth: true,
      data: data.sort((a, b) => a.value[0] - b.value[0]),
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
      confine: false,
      appendToBody: true,
      className: 'process-chart-tooltip',
      extraCssText: 'z-index: 3000; max-height: 320px; overflow-y: auto;',
      axisPointer: {
        type: 'cross'
      },
      formatter: (params: any) => {
        if (!params || !Array.isArray(params) || params.length === 0) {
          return ''
        }
        const timestampValue = getTooltipTimestamp(params[0])
        let result = `${formatMetricAxisTimestamp(new Date(timestampValue).toISOString(), timestamps)}<br/>`
        params.forEach((item: any) => {
          if (item.value !== null && item.value !== undefined) {
            const pointTime = getTooltipTimestamp(item)
            const value = getTooltipValue(item)
            const rawPoint = getTooltipRawPoint(item) || getRawPoint(String(item.seriesName || ''), timestampValue)
            const detail = props.metricType === 'cpu' && rawPoint
              ? `${formatCPUCapacity(rawPoint.cpu_percent)} / ${formatCPUCores(rawPoint.cpu_percent)}`
              : `${value.toFixed(2)}%`
            const matchedPoint = rawPoint || getRawPoint(String(item.seriesName || ''), pointTime)
            const matchedDetail = props.metricType === 'cpu' && matchedPoint
              ? `${formatCPUCapacity(matchedPoint.cpu_percent)} / ${formatCPUCores(matchedPoint.cpu_percent)}`
              : detail
            result += `${item.marker || '●'} ${item.seriesName}: <strong>${matchedDetail}</strong><br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: topProcesses.map(item => item.processName),
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
      top: '24%',
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

function getRawPoint(processName: string, axisTime: number) {
  return props.data.find((item) => {
    return item.process_name === processName && new Date(item.timestamp).getTime() === axisTime
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

<style scoped>
:global(.process-chart-tooltip) {
  max-width: 420px;
  white-space: normal;
  overflow-wrap: anywhere;
}
</style>

