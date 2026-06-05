import type { Agent } from '@/types'

type AgentLike = Pick<Agent, 'host_id' | 'hostname' | 'status'>

const statusRank = (status?: string) => status === 'online' ? 0 : 1

const displayName = (agent: AgentLike) => (agent.hostname || agent.host_id || '').toLocaleLowerCase()

export const compareAgents = (a: AgentLike, b: AgentLike) => {
  const statusDiff = statusRank(a.status) - statusRank(b.status)
  if (statusDiff !== 0) return statusDiff

  const nameDiff = displayName(a).localeCompare(displayName(b), 'zh-CN', {
    numeric: true,
    sensitivity: 'base'
  })
  if (nameDiff !== 0) return nameDiff

  return (a.host_id || '').localeCompare(b.host_id || '', 'zh-CN', {
    numeric: true,
    sensitivity: 'base'
  })
}

export const sortAgents = <T extends AgentLike>(agents: T[]) => {
  return [...agents].sort(compareAgents)
}
