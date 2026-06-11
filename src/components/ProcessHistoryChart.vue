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
    pid?: number
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

type ProcessHistoryRawPoint = {
  timestamp: string
  process_name: string
  pid?: number
  cpu_percent: number
  memory_percent: number
}

type ProcessSeriesPoint = {
  value: [number, number]
  raw: ProcessHistoryRawPoint
}

const initChart = () => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chart || !props.data || props.data.length === 0) return
  
  // 按进程名分组数据，PID 在 tooltip 中展示当前采样点命中的实例。
  const timestamps = getSortedMetricTimestamps(props.data)
  const sortedTimestamps = timestamps
    .map((timestamp) => new Date(timestamp).getTime())
    .filter((timestamp) => Number.isFinite(timestamp))
    .sort((a, b) => a - b)
  const tooltipToleranceMs = getTooltipToleranceMs(sortedTimestamps)
  const processMap = new Map<string, ProcessSeriesPoint[]>()
  
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
        topProcesses.forEach((processItem, index) => {
          const rawPoint = getNearestRawPoint(processItem.data, timestampValue, tooltipToleranceMs)
          if (!rawPoint) return

          if (!hasMetricValue(rawPoint)) return

          const detail = props.metricType === 'cpu'
            ? `${formatCPUCapacity(rawPoint.cpu_percent)} / ${formatCPUCores(rawPoint.cpu_percent)} / 原始${formatPercent(rawPoint.cpu_percent)}`
            : `${formatPercent(rawPoint.memory_percent)}`
          result += `
            <div class="process-tooltip-row">
              <div class="process-tooltip-name">
                <span style="color:${colors[index % colors.length]}">●</span>
                ${escapeHtml(formatTooltipProcessName(rawPoint))}
              </div>
              <strong class="process-tooltip-value">${detail}</strong>
            </div>
          `
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
    return `原始${formatPercent(cpuPercent)}`
  }
  return formatPercent(getCPUCapacityPercent(cpuPercent))
}

function formatCPUCores(cpuPercent: number) {
  return `${((cpuPercent || 0) / 100).toFixed(2)}核`
}

function hasMetricValue(item: { cpu_percent: number; memory_percent: number }) {
  return props.metricType === 'cpu' ? item.cpu_percent > 0 : item.memory_percent > 0
}

function formatPercent(value: number) {
  if (value > 0 && value < 0.01) return '<0.01%'
  return `${(value || 0).toFixed(2)}%`
}

function getTooltipTimestamp(item: any) {
  if (Array.isArray(item?.value)) {
    return Number(item.value[0] || 0)
  }
  return Number(item?.axisValue || 0)
}

function getNearestRawPoint(data: ProcessSeriesPoint[], axisTime: number, toleranceMs: number) {
  let nearestIndex = -1
  let nearestDistance = Number.POSITIVE_INFINITY

  data.forEach((item, index) => {
    const distance = Math.abs(item.value[0] - axisTime)
    if (distance < nearestDistance) {
      nearestIndex = index
      nearestDistance = distance
    }
  })

  if (nearestIndex < 0 || nearestDistance > toleranceMs) {
    return null
  }
  return data[nearestIndex]?.raw || null
}

function formatTooltipProcessName(item: ProcessHistoryRawPoint) {
  return item.pid ? `${item.process_name} (PID ${item.pid})` : item.process_name
}

function getTooltipToleranceMs(sortedTimestamps: number[]) {
  if (sortedTimestamps.length < 2) {
    return 60 * 1000
  }

  const gaps: number[] = []
  for (let i = 1; i < sortedTimestamps.length; i++) {
    const current = sortedTimestamps[i]
    const previous = sortedTimestamps[i - 1]
    if (current === undefined || previous === undefined) {
      continue
    }
    const gap = current - previous
    if (gap > 0) {
      gaps.push(gap)
    }
  }
  if (gaps.length === 0) {
    return 60 * 1000
  }
  gaps.sort((a, b) => a - b)
  const medianGap = gaps[Math.floor(gaps.length / 2)] || 60 * 1000
  return Math.max(medianGap * 1.5, 30 * 1000)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
  width: min(720px, calc(100vw - 48px));
  white-space: normal;
  overflow-wrap: anywhere;
}

:global(.process-chart-tooltip .process-tooltip-row) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  gap: 16px;
  align-items: start;
  line-height: 1.5;
}

:global(.process-chart-tooltip .process-tooltip-name) {
  min-width: 0;
  overflow-wrap: anywhere;
}

:global(.process-chart-tooltip .process-tooltip-value) {
  white-space: nowrap;
  text-align: right;
}
</style>

