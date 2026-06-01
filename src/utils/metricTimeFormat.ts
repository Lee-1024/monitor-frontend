import dayjs from 'dayjs'

export interface TimestampPoint {
  timestamp: string
}

const oneDayMs = 24 * 60 * 60 * 1000

export const getMetricTimeFormat = (data: TimestampPoint[]) => {
  if (data.length < 2) {
    return 'HH:mm'
  }

  const first = dayjs(data[0]!.timestamp)
  const last = dayjs(data[data.length - 1]!.timestamp)

  if (!first.isValid() || !last.isValid()) {
    return 'HH:mm'
  }

  return last.diff(first) >= oneDayMs ? 'MM-DD HH:mm' : 'HH:mm'
}

export const formatMetricTimestamp = (timestamp: string, data: TimestampPoint[]) => {
  return dayjs(timestamp).format(getMetricTimeFormat(data))
}
