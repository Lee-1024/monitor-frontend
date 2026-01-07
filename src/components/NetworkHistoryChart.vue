<!-- ============================================ -->
<!-- 文件: src/components/NetworkHistoryChart.vue -->
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

const formatBytesPerSec = (bytes: number) => {
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B/s'
  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const sizeIndex = Math.min(i, sizes.length - 1)
  const value = bytes / Math.pow(k, sizeIndex)
  return Math.round(value * 100) / 100 + ' ' + sizes[sizeIndex]
}

const initChart = () => {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chart) return

  const times = props.data.map(item => dayjs(item.timestamp).format('HH:mm'))

  // 这里使用 bytes_sent / bytes_recv 的变化量近似代表吞吐速率
  const sent: number[] = []
  const recv: number[] = []

  for (let i = 0; i < props.data.length; i++) {
    if (i === 0) {
      sent.push(0)
      recv.push(0)
      continue
    }
    const prevItem = props.data[i - 1]
    const currItem = props.data[i]
    if (!prevItem || !currItem) {
      sent.push(0)
      recv.push(0)
      continue
    }
    const prev = prevItem.values || {}
    const curr = currItem.values || {}
    const deltaSent = (curr.bytes_sent || 0) - (prev.bytes_sent || 0)
    const deltaRecv = (curr.bytes_recv || 0) - (prev.bytes_recv || 0)
    sent.push(Math.max(deltaSent, 0))
    recv.push(Math.max(deltaRecv, 0))
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          // 格式化axisPointer显示的标签（鼠标悬停时Y轴上显示的值）
          formatter: (params: any) => {
            if (params && params.value !== undefined) {
              let numValue = 0
              if (typeof params.value === 'number') {
                numValue = params.value
              } else if (typeof params.value === 'string') {
                const cleanValue = params.value.replace(/,/g, '')
                numValue = parseFloat(cleanValue) || 0
              } else {
                numValue = parseFloat(params.value) || 0
              }
              
              // 格式化网络流量值
              if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
                return formatBytesPerSec(numValue)
              }
              
              return params.value
            }
            return ''
          }
        }
      },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((item: any) => {
          const value = item.value
          // 确保值是数字且格式化
          const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
          result += `${item.marker}${item.seriesName}: ${formatBytesPerSec(numValue)}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['发送', '接收'],
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
    yAxis: {
      type: 'value',
      name: '吞吐量',
      axisLabel: {
        formatter: (value: any) => {
          // 确保值是数字，处理带逗号的字符串
          let numValue = 0
          if (typeof value === 'number') {
            numValue = value
          } else if (typeof value === 'string') {
            // 移除逗号，如 "31,759,359,529.70" -> "31759359529.70"
            const cleanValue = value.replace(/,/g, '')
            numValue = parseFloat(cleanValue) || 0
          } else {
            numValue = parseFloat(value) || 0
          }
          
          if (isNaN(numValue) || !isFinite(numValue) || numValue < 0) {
            return '0 B/s'
          }
          
          return formatBytesPerSec(numValue)
        }
      }
    },
    series: [
      {
        name: '发送',
        type: 'line',
        smooth: true,
        data: sent,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        },
        label: {
          show: false
        },
        tooltip: {
          valueFormatter: (value: any) => {
            const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
            return formatBytesPerSec(numValue)
          }
        }
      },
      {
        name: '接收',
        type: 'line',
        smooth: true,
        data: recv,
        itemStyle: {
          color: '#67C23A'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.5)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
          ])
        },
        label: {
          show: false
        },
        tooltip: {
          valueFormatter: (value: any) => {
            const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
            return formatBytesPerSec(numValue)
          }
        }
      }
    ]
  }

  chart.setOption(option)
}

watch(
  () => props.data,
  () => {
    updateChart()
  },
  { deep: true }
)

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    chart?.resize()
  })
})
</script>


