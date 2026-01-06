<!-- ============================================ -->
<!-- 文件: src/components/MemoryHistoryChart.vue -->
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
  data: Array<{ timestamp: string; values: Record<string, number> }>
  loading?: boolean
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
let observer: MutationObserver | null = null
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null

const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0 || isNaN(bytes) || !isFinite(bytes)) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  // 确保bytes是正数
  const absBytes = Math.abs(bytes)
  if (absBytes === 0) return '0 B'
  const i = Math.floor(Math.log(absBytes) / Math.log(k))
  const sizeIndex = Math.min(Math.max(i, 0), sizes.length - 1)
  const value = absBytes / Math.pow(k, sizeIndex)
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
  const memUsedPercent = props.data.map(item => item.values.used_percent || 0)
  const memUsed = props.data.map(item => item.values.used || 0)
  const memTotal = props.data.map(item => item.values.total || 0)
  
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
              
              // 如果是右侧Y轴（内存），格式化显示
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
      // 使用formatter确保所有值都格式化，返回HTML
      formatter: function(params: any) {
        if (!params || !Array.isArray(params) || params.length === 0) {
          return ''
        }
        const time = params[0].axisValue
        let result = '<div style="padding: 8px; font-size: 12px;">'
        result += '<div style="font-weight: bold; margin-bottom: 6px; color: #333;">' + time + '</div>'
        
        params.forEach((item: any) => {
          if (!item) return
          
          const rawValue = item.value
          const seriesName = item.seriesName || ''
          const color = item.color || '#666'
          
          // 确保值是数字
          let numValue = 0
          if (typeof rawValue === 'number' && !isNaN(rawValue) && isFinite(rawValue)) {
            numValue = rawValue
          } else if (typeof rawValue === 'string') {
            numValue = parseFloat(rawValue) || 0
          }
          
          // 根据系列名称格式化 - 强制格式化，不显示原始值
          if (seriesName === '已用' || seriesName === '总计') {
            // 字节值必须格式化，绝不显示原始值
            const formatted = formatBytes(numValue)
            result += '<div style="margin: 4px 0; display: flex; align-items: center;">'
            result += '<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ' + color + '; margin-right: 8px; flex-shrink: 0;"></span>'
            result += '<span style="flex: 1;">' + seriesName + ': <strong style="color: #333;">' + formatted + '</strong></span>'
            result += '</div>'
          } else if (seriesName === '使用率') {
            // 百分比
            result += '<div style="margin: 4px 0; display: flex; align-items: center;">'
            result += '<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ' + color + '; margin-right: 8px; flex-shrink: 0;"></span>'
            result += '<span style="flex: 1;">' + seriesName + ': <strong style="color: #333;">' + numValue.toFixed(1) + '%</strong></span>'
            result += '</div>'
          } else {
            // 其他情况：如果值很大（超过1MB），格式化它
            if (numValue > 1000) {
              const formatted = formatBytes(numValue)
              result += '<div style="margin: 4px 0; display: flex; align-items: center;">'
              result += '<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ' + color + '; margin-right: 8px; flex-shrink: 0;"></span>'
              result += '<span style="flex: 1;">' + seriesName + ': <strong style="color: #333;">' + formatted + '</strong></span>'
              result += '</div>'
            } else {
              result += '<div style="margin: 4px 0; display: flex; align-items: center;">'
              result += '<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ' + color + '; margin-right: 8px; flex-shrink: 0;"></span>'
              result += '<span style="flex: 1;">' + seriesName + ': <strong style="color: #333;">' + numValue.toFixed(2) + '</strong></span>'
              result += '</div>'
            }
          }
        })
        
        result += '</div>'
        return result
      },
      // 使用HTML渲染模式
      renderMode: 'html',
      confine: true
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
        name: '内存 (GB)',
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
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: false
          }
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
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: false
          }
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
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: false
          }
        }
      }
    ]
  }
  
  chart.setOption(option)
  
  // 如果还没有创建observer，创建一个用于格式化Y轴标签
  if (!observer) {
    let formatInterval: number | null = null
    const processedElements = new WeakSet()
    
    const formatYAxisLabels = () => {
      // 查找图表容器内的所有SVG文本元素（Y轴标签通常是SVG的text或tspan元素）
      const chartContainer = chartRef.value
      if (!chartContainer) return
      
      // 查找所有SVG文本元素
      const allTexts = chartContainer.querySelectorAll('text')
      
      for (const el of allTexts) {
        const text = el.textContent || ''
        const cleanText = text.trim()
        
        // 跳过空文本
        if (!cleanText) continue
        
        // 先尝试解析数字（移除%符号和逗号）
        const numValue = parseFloat(cleanText.replace(/[%,]/g, ''))
        
        // 判断是否是百分比：
        // 1) 包含%符号
        // 2) 纯数字在0-100范围内（可能是小数位数过多的数字，如 90.16218028052805）
        // 3) 不是大数值（大于1000000000）
        // 4) 匹配数字模式（整数或小数，包括多位小数）
        const isPercentage = cleanText.includes('%') || 
          (!isNaN(numValue) && numValue >= 0 && numValue <= 100 && numValue < 1000000000 &&
           cleanText.match(/^\d+\.?\d*$/))
        
        if (isPercentage) {
          // 格式化百分比，确保最多1位小数
          const value = parseFloat(cleanText.replace(/[%,]/g, '').trim())
          if (!isNaN(value) && value >= 0 && value <= 100) {
            const formatted = value.toFixed(1) + '%'
            // 只有当格式化后的值不同时才更新
            if (formatted !== cleanText && formatted !== text) {
              el.textContent = formatted
            }
          }
          continue
        }
        
        // 只处理大数值（10位以上数字或带逗号的大数值，如 31,759,359,529.70）
        // 匹配模式：10位以上数字，或带逗号的大数值（至少3组逗号，如 31,759,359,529.70）
        const hasLargeNumber = text.match(/\d{10,}/) || text.match(/\d{1,3}(?:,\d{3}){2,}(?:\.\d+)?/)
        
        if (hasLargeNumber) {
          // 查找并替换原始数值
          const regex = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d{10,}(?:\.\d+)?)/g
          const formatted = text.replace(regex, (match) => {
            // 移除逗号
            const cleanMatch = match.replace(/,/g, '')
            const numValue = parseFloat(cleanMatch)
            if (!isNaN(numValue) && numValue > 1000000000) {
              const gbValue = numValue / 1024 / 1024 / 1024
              return gbValue.toFixed(1) + 'GB'
            }
            return match
          })
          
          if (formatted !== text) {
            // 直接修改textContent，这会立即更新显示
            el.textContent = formatted
          }
        }
      }
      
      // 也检查tspan元素（SVG中文本可能被分割成多个tspan）
      const allTspans = chartContainer.querySelectorAll('tspan')
      for (const el of allTspans) {
        const text = el.textContent || ''
        const cleanText = text.trim()
        
        // 跳过空文本
        if (!cleanText) continue
        
        // 先尝试解析数字（移除%符号和逗号）
        const numValue = parseFloat(cleanText.replace(/[%,]/g, ''))
        
        // 判断是否是百分比：
        // 1) 包含%符号
        // 2) 纯数字在0-100范围内（可能是小数位数过多的数字，如 90.16218028052805）
        // 3) 不是大数值（大于1000000000）
        // 4) 匹配数字模式（整数或小数，包括多位小数）
        const isPercentage = cleanText.includes('%') || 
          (!isNaN(numValue) && numValue >= 0 && numValue <= 100 && numValue < 1000000000 &&
           cleanText.match(/^\d+\.?\d*$/))
        
        if (isPercentage) {
          // 格式化百分比，确保最多1位小数
          const value = parseFloat(cleanText.replace(/[%,]/g, '').trim())
          if (!isNaN(value) && value >= 0 && value <= 100) {
            const formatted = value.toFixed(1) + '%'
            // 只有当格式化后的值不同时才更新
            if (formatted !== cleanText && formatted !== text) {
              el.textContent = formatted
            }
          }
          continue
        }
        
        if (text.match(/\d{10,}/) || text.match(/\d{1,3}(?:,\d{3}){2,}(?:\.\d+)?/)) {
          const regex = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d{10,}(?:\.\d+)?)/g
          const formatted = text.replace(regex, (match) => {
            const cleanMatch = match.replace(/,/g, '')
            const numValue = parseFloat(cleanMatch)
            if (!isNaN(numValue) && numValue > 1000000000) {
              const gbValue = numValue / 1024 / 1024 / 1024
              return gbValue.toFixed(1) + 'GB'
            }
            return match
          })
          
          if (formatted !== text) {
            el.textContent = formatted
          }
        }
      }
    }
    
    observer = new MutationObserver((mutations) => {
      // 当检测到文本内容变化时，立即格式化
      let shouldFormat = false
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          shouldFormat = true
        }
      })
      if (shouldFormat) {
        // 使用requestAnimationFrame确保在DOM更新后执行
        requestAnimationFrame(() => {
          formatYAxisLabels()
        })
      }
    })
    
    // 观察图表容器和body的变化
    const chartContainer = chartRef.value
    if (chartContainer) {
      observer.observe(chartContainer, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: false
      })
    }
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: false
    })
    
    // 使用定时器持续检查Y轴标签（更频繁的检查，因为值是动态的）
    if (!formatInterval) {
      formatInterval = window.setInterval(() => {
        formatYAxisLabels()
      }, 30) // 每30ms检查一次，确保能捕获动态变化
    }
    
    // 监听鼠标移动事件，实时格式化Y轴标签
    if (!mouseMoveHandler) {
      mouseMoveHandler = () => {
        // 使用双重requestAnimationFrame确保在ECharts更新后执行
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            formatYAxisLabels()
          })
        })
      }
      // 在图表容器和document上都监听
      if (chartContainer) {
        chartContainer.addEventListener('mousemove', mouseMoveHandler, { passive: true })
      }
      document.addEventListener('mousemove', mouseMoveHandler, { passive: true })
    }
    
    // 监听ECharts的updateAxisPointer事件（鼠标悬停时触发）
    chart.on('updateAxisPointer', () => {
      // 使用多个延迟确保在ECharts完全更新后执行
      setTimeout(() => {
        requestAnimationFrame(() => {
          formatYAxisLabels()
        })
      }, 0)
      setTimeout(() => {
        formatYAxisLabels()
      }, 20)
    })
    
    // 存储interval以便清理
    ;(chart as any)._formatInterval = formatInterval
  }
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

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (mouseMoveHandler) {
    document.removeEventListener('mousemove', mouseMoveHandler)
    mouseMoveHandler = null
  }
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>