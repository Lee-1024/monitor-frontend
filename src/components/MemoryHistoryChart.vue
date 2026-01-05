<!-- ============================================ -->
<!-- 文件: src/components/MemoryHistoryChart.vue -->
<!-- ============================================ -->
<template>
  <div v-loading="loading">
    <div ref="chartRef" style="width: 100%; height: 400px;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const props = defineProps<{
  data: Array<{ timestamp: string; values: Record<string, number> }>
  loading?: boolean
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const initChart = () => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chart) return
  
  const times = props.data.map(item => dayjs(item.timestamp).format('HH:mm'))
  const memUsedPercent = props.data.map(item => item.values.used_percent || 0)
  const memUsed = props.data.map(item => item.values.used || 0)
  const memTotal = props.data.map(item => item.values.total || 0)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((item: any) => {
          if (item.seriesName === '已用') {
            result += `${item.marker}${item.seriesName}: ${formatBytes(item.value)}<br/>`
          } else if (item.seriesName === '总计') {
            result += `${item.marker}${item.seriesName}: ${formatBytes(item.value)}<br/>`
          } else {
            result += `${item.marker}${item.seriesName}: ${item.value.toFixed(1)}%<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['使用率', '已用', '总计']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times
    },
    yAxis: [
      {
        type: 'value',
        name: '使用率 (%)',
        position: 'left',
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      {
        type: 'value',
        name: '内存 (GB)',
        position: 'right',
        axisLabel: {
          formatter: (value: number) => {
            return (value / 1024 / 1024 / 1024).toFixed(1) + 'GB'
          }
        }
      }
    ],
    series: [
      {
        name: '使用率',
        type: 'line',
        smooth: true,
        data: memUsedPercent,
        yAxisIndex: 0,
        itemStyle: {
          color: '#F56C6C'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 108, 108, 0.5)' },
            { offset: 1, color: 'rgba(245, 108, 108, 0.1)' }
          ])
        }
      },
      {
        name: '已用',
        type: 'line',
        smooth: true,
        data: memUsed,
        yAxisIndex: 1,
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: '总计',
        type: 'line',
        smooth: true,
        data: memTotal,
        yAxisIndex: 1,
        itemStyle: {
          color: '#909399'
        },
        lineStyle: {
          type: 'dashed'
        }
      }
    ]
  }
  
  chart.setOption(option)
}

watch(() => props.data, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    chart?.resize()
  })
})
</script>