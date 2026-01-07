<!-- ============================================ -->
<!-- 文件: src/components/CPUHistoryChart.vue -->
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

const initChart = () => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chart) return
  
  const times = props.data.map(item => dayjs(item.timestamp).format('HH:mm'))
  const cpuUsage = props.data.map(item => item.values.usage_percent || 0)
  const loadAvg = props.data.map(item => item.values.load_avg_1 || 0)
  
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
          const value = item.value || 0
          const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
          const seriesName = item.seriesName || ''
          
          if (seriesName === 'CPU使用率') {
            // CPU使用率显示为百分比，保留两位小数
            result += `${item.marker || '●'} ${seriesName}: <strong>${numValue.toFixed(2)}%</strong><br/>`
          } else if (seriesName === '负载平均值') {
            // 负载平均值显示为数字，保留两位小数
            result += `${item.marker || '●'} ${seriesName}: <strong>${numValue.toFixed(2)}</strong><br/>`
          } else {
            result += `${item.marker || '●'} ${seriesName}: <strong>${numValue.toFixed(2)}</strong><br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['CPU使用率', '负载平均值'],
      top: 10,
      left: 'center'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '15%',
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
        name: 'CPU (%)',
        position: 'left',
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      {
        type: 'value',
        name: '负载',
        position: 'right',
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: [
      {
        name: 'CPU使用率',
        type: 'line',
        smooth: true,
        data: cpuUsage,
        yAxisIndex: 0,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      },
      {
        name: '负载平均值',
        type: 'line',
        smooth: true,
        data: loadAvg,
        yAxisIndex: 1,
        itemStyle: {
          color: '#67C23A'
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

