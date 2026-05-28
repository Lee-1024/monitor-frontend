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
import dayjs from 'dayjs'

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
  const processMap = new Map<string, Array<{ time: string; value: number }>>()
  
  props.data.forEach(item => {
    const processName = item.process_name
    const time = dayjs(item.timestamp).format('HH:mm:ss')
    const value = props.metricType === 'cpu' ? getCPUCapacityPercent(item.cpu_percent) : item.memory_percent
    
    if (!processMap.has(processName)) {
      processMap.set(processName, [])
    }
    processMap.get(processName)!.push({ time, value })
  })
  
  // 获取所有时间点（去重并排序）
  const allTimes = new Set<string>()
  processMap.forEach(data => {
    data.forEach(item => allTimes.add(item.time))
  })
  const times = Array.from(allTimes).sort()
  
  // 构建系列数据
  const series: any[] = []
  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
    '#9C27B0', '#00BCD4', '#FF9800', '#4CAF50', '#2196F3'
  ]
  
  let colorIndex = 0
  processMap.forEach((data, processName) => {
    // 为每个时间点创建数据点
    const values = times.map(time => {
      const point = data.find(d => d.time === time)
      return point ? point.value : null
    })
    
    series.push({
      name: processName,
      type: 'line',
      smooth: true,
      data: values,
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
        let result = `${params[0].axisValue}<br/>`
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
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLabel: {
        rotate: 45,
        interval: Math.floor(times.length / 10) // 显示部分标签，避免重叠
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
    const time = dayjs(item.timestamp).format('HH:mm:ss')
    return item.process_name === processName && time === axisTime
  })
}

watch(() => [props.data, props.metricType, props.hostCoreCount], () => {
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

