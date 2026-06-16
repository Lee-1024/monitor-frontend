import { formatMarkdown, stripThinkBlocks } from './markdown'

const assertIncludes = (actual: string, expected: string) => {
  if (!actual.includes(expected)) {
    throw new Error(`Expected output to include ${expected}, got ${actual}`)
  }
}

const report = [
  '<think>内部推理</think>',
  '# 系统巡检日报',
  '',
  '## 一、巡检概览',
  '本次巡检发现 **2 台主机** 存在风险，建议查看 `CPU` 指标。',
  '',
  '- web-01 CPU 使用率过高',
  '- db-01 磁盘空间不足',
  '',
  '1. 先处理严重告警',
  '2. 再复查业务入口',
  '',
  '<script>alert("xss")</script>'
].join('\n')

const html = formatMarkdown(report)

assertIncludes(stripThinkBlocks(report), '# 系统巡检日报')
if (stripThinkBlocks(report).includes('内部推理')) {
  throw new Error('Expected think block content to be removed')
}
assertIncludes(html, '<h1 class="markdown-h markdown-h1">系统巡检日报</h1>')
assertIncludes(html, '<h2 class="markdown-h markdown-h2">一、巡检概览</h2>')
assertIncludes(html, '<strong>2 台主机</strong>')
assertIncludes(html, '<code>CPU</code>')
assertIncludes(html, '<ul class="markdown-list">')
assertIncludes(html, '<ol class="markdown-list">')
assertIncludes(html, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')

const tableMarkdown = [
  '| 排名 | 主机名 | CPU使用率 |',
  '|------|--------|-----------|',
  '| 1 | cpu-host39 | 30.8% |',
  '| 2 | cpu-host113 | 14.2% |'
].join('\n')

const tableHtml = formatMarkdown(tableMarkdown)

assertIncludes(tableHtml, '<div class="markdown-table-wrap"><table class="markdown-table">')
assertIncludes(tableHtml, '<thead><tr><th>排名</th><th>主机名</th><th>CPU使用率</th></tr></thead>')
assertIncludes(tableHtml, '<tbody><tr><td>1</td><td>cpu-host39</td><td>30.8%</td></tr><tr><td>2</td><td>cpu-host113</td><td>14.2%</td></tr></tbody>')

const tabTableMarkdown = [
  '指标\t数值',
  '平均CPU使用率\t4.12%',
  '最高CPU使用率\t30.8%（cpu-host39）',
  'CPU使用率>20%主机数\t1',
  'CPU使用率>10%主机数\t2'
].join('\n')

const tabTableHtml = formatMarkdown(tabTableMarkdown)

assertIncludes(tabTableHtml, '<thead><tr><th>指标</th><th>数值</th></tr></thead>')
assertIncludes(tabTableHtml, '<td>最高CPU使用率</td><td>30.8%（cpu-host39）</td>')
