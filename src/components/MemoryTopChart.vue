<!-- ============================================ -->
<!-- 文件: src/components/MemoryTopChart.vue -->
<!-- ============================================ -->
<template>
  <div ref="chartRef" style="width: 100%; height: 400px;"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  data: Array<{ host_id: string; hostname: string; value: number }>
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
  
  const names = props.data.map(item => item.hostname || item.host_id)
  const values = props.data.map(item => item.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        if (!params || !Array.isArray(params) || params.length === 0) {
          return ''
        }
        const param = params[0]
        const value = param.value || 0
        const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
        const formattedValue = isNaN(numValue) || !isFinite(numValue) ? '0.0' : numValue.toFixed(1)
        return `${param.seriesName}<br/>${param.name}: ${formattedValue}%`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: (value: any) => {
          const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
          if (isNaN(numValue) || !isFinite(numValue)) {
            return '0%'
          }
          return numValue.toFixed(1) + '%'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        interval: 0,
        formatter: (value: string) => {
          return value.length > 12 ? value.slice(0, 12) + '...' : value
        }
      }
    },
    series: [
      {
        name: '内存使用率',
        type: 'bar',
        data: values,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#F56C6C' },
            { offset: 1, color: '#f78989' }
          ])
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            const value = params.value || 0
            const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
            if (isNaN(numValue) || !isFinite(numValue)) {
              return '0.0%'
            }
            return numValue.toFixed(1) + '%'
          }
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
