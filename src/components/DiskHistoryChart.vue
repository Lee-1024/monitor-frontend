<!-- ============================================ -->
<!-- 文件: src/components/DiskHistoryChart.vue   -->
<!-- ============================================ -->
<template>
  <div v-loading="loading">
    <div ref="chartRef" style="width: 100%; height: 100%; min-height: 350px;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const props = defineProps<{
  data: Array<{ timestamp: string; values: Record<string, number> }>
  loading?: boolean
  mountpoint?: string
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
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#E6A23C',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: 12
      },
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#E6A23C'
        },
        label: {
          backgroundColor: '#E6A23C',
          color: '#fff',
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
              
              if (params.axisDimension === 'y' && params.axisIndex === 0) {
                if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0 && numValue <= 100) {
                  return numValue.toFixed(1) + '%'
                }
              }
              
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
        let result = `<div style="font-weight: 600; margin-bottom: 4px;">${params[0].axisValue}</div>`
        if (props.mountpoint) {
          result += `<div style="color: #E6A23C; margin-bottom: 8px; font-size: 11px;">挂载点: ${props.mountpoint}</div>`
        }
        params.forEach((item: any) => {
          const value = item.value
          if (item.seriesName === '已用' || item.seriesName === '总计') {
            const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
            result += `<div style="margin: 2px 0;">${item.marker}<span style="margin-left: 4px;">${item.seriesName}: <strong>${formatBytes(numValue)}</strong></span></div>`
          } else {
            const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
            result += `<div style="margin: 2px 0;">${item.marker}<span style="margin-left: 4px;">${item.seriesName}: <strong>${numValue.toFixed(1)}%</strong></span></div>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['使用率', '已用', '总计'],
      top: 10,
      left: 'center',
      textStyle: {
        color: '#606266',
        fontSize: 12
      },
      itemGap: 20
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLine: {
        lineStyle: {
          color: '#E4E7ED'
        }
      },
      axisLabel: {
        color: '#909399',
        fontSize: 11
      },
      splitLine: {
        show: false
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '使用率 (%)',
        position: 'left',
        max: 100,
        nameTextStyle: {
          color: '#E6A23C',
          fontSize: 12,
          fontWeight: 600
        },
        axisLine: {
          lineStyle: {
            color: '#E6A23C'
          }
        },
        axisLabel: {
          color: '#E6A23C',
          fontSize: 12,
          formatter: (value: any) => {
            const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '')) || 0
            if (isNaN(numValue) || !isFinite(numValue)) {
              return '0%'
            }
            return numValue.toFixed(1) + '%'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#F0F0F0',
            type: 'dashed'
          }
        }
      },
      {
        type: 'value',
        name: '磁盘 (GB)',
        position: 'right',
        nameTextStyle: {
          color: '#909399',
          fontSize: 12,
          fontWeight: 600
        },
        axisLine: {
          lineStyle: {
            color: '#909399'
          }
        },
        axisLabel: {
          color: '#909399',
          fontSize: 12,
          rotate: 0,
          formatter: (value: any) => {
            let numValue = 0
            if (typeof value === 'number') {
              numValue = value
            } else if (typeof value === 'string') {
              const cleanValue = value.replace(/,/g, '')
              numValue = parseFloat(cleanValue) || 0
            } else {
              numValue = parseFloat(value) || 0
            }
            
            if (!numValue || numValue === 0 || isNaN(numValue) || !isFinite(numValue)) {
              return '0 GB'
            }
            const gbValue = numValue / 1024 / 1024 / 1024
            
            if (gbValue < 0.1) {
              const mbValue = numValue / 1024 / 1024
              return mbValue.toFixed(1) + 'MB'
            }
            return gbValue.toFixed(1) + 'GB'
          },
          show: true
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '使用率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: usedPercent,
        yAxisIndex: 0,
        itemStyle: {
          color: '#E6A23C',
          borderWidth: 2,
          borderColor: '#fff'
        },
        lineStyle: {
          width: 3,
          color: '#E6A23C'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 162, 60, 0.4)' },
            { offset: 0.5, color: 'rgba(230, 162, 60, 0.2)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
          ])
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: 'rgba(230, 162, 60, 0.5)'
          }
        }
      },
      {
        name: '已用',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: used,
        yAxisIndex: 1,
        itemStyle: {
          color: '#F56C6C',
          borderWidth: 2,
          borderColor: '#fff'
        },
        lineStyle: {
          width: 2.5,
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
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: 'rgba(245, 108, 108, 0.5)'
          }
        }
      },
      {
        name: '总计',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: total,
        yAxisIndex: 1,
        itemStyle: {
          color: '#909399'
        },
        lineStyle: {
          type: 'dashed',
          width: 2,
          color: '#909399'
        },
        label: {
          show: false
        },
        tooltip: {
          valueFormatter: (value: any) => {
            const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
            return formatBytes(numValue)
          }
        },
        emphasis: {
          focus: 'series'
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


