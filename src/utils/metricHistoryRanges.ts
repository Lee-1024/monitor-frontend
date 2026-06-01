export type MetricHistoryRangeValue = '-1h' | '-6h' | '-24h' | '-7d' | '-30d'

export interface MetricHistoryRangeOption {
  label: string
  value: MetricHistoryRangeValue
  interval: string
}

export const realtimeMetricHistoryRange: MetricHistoryRangeOption = {
  label: '1小时',
  value: '-1h',
  interval: '1m'
}

export const metricHistoryRangeOptions: MetricHistoryRangeOption[] = [
  { label: '近6小时', value: '-6h', interval: '1m' },
  { label: '1天', value: '-24h', interval: '5m' },
  { label: '1周', value: '-7d', interval: '30m' },
  { label: '1个月', value: '-30d', interval: '2h' }
]

export const defaultMetricHistoryRange: MetricHistoryRangeOption = metricHistoryRangeOptions[0]!

export const getMetricHistoryInterval = (range: MetricHistoryRangeValue) => {
  const option = metricHistoryRangeOptions.find(item => item.value === range)
  return option?.interval || realtimeMetricHistoryRange.interval
}
