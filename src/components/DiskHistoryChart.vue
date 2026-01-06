<!-- ============================================ -->
<!-- 文件: src/components/DiskHistoryChart.vue   -->
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
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
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
  const usedPercent = props.data.map(item => item.values.used_percent || 0)
  const used = props.data.map(item => item.values.used || 0)
  const total = props.data.map(item => item.values.total || 0)

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
              
              // 如果是左侧Y轴（百分比），格式化显示
              if (params.axisDimension === 'y' && params.axisIndex === 0) {
                if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0 && numValue <= 100) {
                  return numValue.toFixed(1) + '%'
                }
              }
              
              // 如果是右侧Y轴（磁盘大小），格式化显示
              if (params.axisDimension === 'y' && params.axisIndex === 1) {
                if (numValue > 1000000000) {
                  const gbValue = numValue / 1024 / 1024 / 1024
                  return gbValue.toFixed(1) + 'GB'
                } else if (numValue > 0) {
                  const mbValue = numValue / 1024 / 1024
                  return mbValue.toFixed(1) + 'MB'
                }
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
          if (item.seriesName === '已用' || item.seriesName === '总计') {
            // 确保值是数字且格式化
            const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
            result += `${item.marker}${item.seriesName}: ${formatBytes(numValue)}<br/>`
          } else {
            // 使用率百分比
            const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
            result += `${item.marker}${item.seriesName}: ${numValue.toFixed(1)}%<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['使用率', '已用', '总计'],
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
        name: '使用率 (%)',
        position: 'left',
        max: 100,
        axisLabel: {
          formatter: (value: any) => {
            const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '')) || 0
            if (isNaN(numValue) || !isFinite(numValue)) {
              return '0%'
            }
            return numValue.toFixed(1) + '%'
          }
        }
      },
      {
        type: 'value',
        name: '磁盘 (GB)',
        position: 'right',
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
            
            if (!numValue || numValue === 0 || isNaN(numValue) || !isFinite(numValue)) {
              return '0 GB'
            }
            // 值已经是字节，转换为GB
            const gbValue = numValue / 1024 / 1024 / 1024
            
            if (gbValue < 0.1) {
              // 如果小于0.1GB，显示MB
              const mbValue = numValue / 1024 / 1024
              return mbValue.toFixed(1) + 'MB'
            }
            return gbValue.toFixed(1) + 'GB'
          },
          show: true
        }
      }
    ],
    series: [
      {
        name: '使用率',
        type: 'line',
        smooth: true,
        data: usedPercent,
        yAxisIndex: 0,
        itemStyle: {
          color: '#E6A23C'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 162, 60, 0.5)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.1)' }
          ])
        }
      },
      {
        name: '已用',
        type: 'line',
        smooth: true,
        data: used,
        yAxisIndex: 1,
        itemStyle: {
          color: '#F56C6C'
        },
        label: {
          show: false
        },
        tooltip: {
          valueFormatter: (value: any) => {
            const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
            return formatBytes(numValue)
          }
        }
      },
      {
        name: '总计',
        type: 'line',
        smooth: true,
        data: total,
        yAxisIndex: 1,
        itemStyle: {
          color: '#909399'
        },
        lineStyle: {
          type: 'dashed'
        },
        label: {
          show: false
        },
        tooltip: {
          valueFormatter: (value: any) => {
            const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
            return formatBytes(numValue)
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


